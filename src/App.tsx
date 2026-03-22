import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Plus, 
  Loader2, 
  AlertCircle,
  Settings,
  Copy,
  Download,
  Check,
  RefreshCw,
  LogIn,
  LogOut,
  History,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Toaster, toast } from 'react-hot-toast';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc,
  serverTimestamp,
  Timestamp,
  User
} from './firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GeneratedEmail {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt?: any;
}

interface NameEntry {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'add-names' | 'history'>('single');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingNames, setIsAddingNames] = useState(false);
  const [results, setResults] = useState<GeneratedEmail[]>([]);
  const [history, setHistory] = useState<GeneratedEmail[]>([]);
  const [namesList, setNamesList] = useState<NameEntry[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(['@gmail.com']);
  const [bulkCount, setBulkCount] = useState<number>(10);
  const [pasteGender, setPasteGender] = useState<'male' | 'female'>('male');

  const providers = [
    { id: 'gmail', label: 'Gmail', value: '@gmail.com' },
    { id: 'hotmail', label: 'Hotmail', value: '@hotmail.com' },
    { id: 'outlook', label: 'Outlook', value: '@outlook.com' },
    { id: 'yahoo', label: 'Yahoo', value: '@yahoo.com' },
    { id: 'icloud', label: 'iCloud', value: '@icloud.com' }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch names and history when user is logged in
  useEffect(() => {
    if (!user) {
      setNamesList([]);
      setHistory([]);
      return;
    }

    const namesQuery = query(collection(db, 'names'));
    const unsubscribeNames = onSnapshot(namesQuery, (snapshot) => {
      const names = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NameEntry));
      setNamesList(names);
    });

    const historyQuery = query(collection(db, 'generated_emails'));
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const emails = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedEmail));
      // Sort by createdAt descending
      emails.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setHistory(emails);
    });

    return () => {
      unsubscribeNames();
      unsubscribeHistory();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Logged in successfully');
    } catch (error: any) {
      toast.error('Login failed: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error('Logout failed: ' + error.message);
    }
  };

  const toggleProvider = (value: string) => {
    setSelectedProviders(prev => {
      if (prev.includes(value)) {
        if (prev.length === 1) {
          toast.error('At least one provider must be selected');
          return prev;
        }
        return prev.filter(p => p !== value);
      }
      return [...prev, value];
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const generateRandomEmail = (firstName: string, lastName: string) => {
    const fn = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ln = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const getCommonNumber = () => {
      const rand = Math.random();
      if (rand < 0.7) {
        const common = [10, 12, 20, 22, 25, 52, 81, 99, 123, 111, 555, 777, 888, 999, 420, 786, 143, 520];
        return common[Math.floor(Math.random() * common.length)];
      } else if (rand < 0.9) {
        const years = [2024, 2025, 2023, 2022, 2021, 2020];
        if (Math.random() > 0.5) {
          return Math.floor(Math.random() * (2010 - 1970 + 1)) + 1970;
        }
        return years[Math.floor(Math.random() * years.length)];
      } else {
        return Math.floor(Math.random() * 9) + 1;
      }
    };

    const n = getCommonNumber;
    const patterns = [
      `${fn}${n()}`,
      `${ln}${n()}`,
      `${fn}${ln}${n()}`,
      `${fn}${ln}`,
      `${ln}${fn}${n()}`,
    ];
    
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    const provider = selectedProviders[Math.floor(Math.random() * selectedProviders.length)];
    return `${selectedPattern}${provider}`;
  };

  const handleInstantPasteAndAdd = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error('Clipboard is empty');
        return;
      }

      setIsAddingNames(true);
      const names = text.split('\n').filter(n => n.trim());
      
      let addedCount = 0;
      for (const fullName of names) {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 0) continue;

        const firstName = parts[0] || '';
        const lastName = parts.length > 1 ? parts[parts.length - 1] : 'User';

        await addDoc(collection(db, 'names'), {
          firstName,
          lastName,
          gender: pasteGender,
          createdAt: serverTimestamp()
        });
        addedCount++;
      }

      toast.success(`Successfully added ${addedCount} names to Firebase!`);
    } catch (err: any) {
      console.error('Failed to add names:', err);
      toast.error(err.message || 'Failed to add names');
    } finally {
      setIsAddingNames(false);
    }
  };

  const handleGenerate = async (countToGenerate: number) => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    if (namesList.length === 0) {
      toast.error('No names found. Please add names first.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const newResults: GeneratedEmail[] = [];
      for (let i = 0; i < countToGenerate; i++) {
        const randomName = namesList[Math.floor(Math.random() * namesList.length)];
        const email = generateRandomEmail(randomName.firstName, randomName.lastName);
        
        const emailData = {
          firstName: randomName.firstName,
          lastName: randomName.lastName,
          email,
          createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'generated_emails'), emailData);
        newResults.push({ id: docRef.id, ...emailData });
      }

      setResults(newResults);
      toast.success(`Generated ${newResults.length} new emails!`);
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'generated_emails', id));
      toast.success('Email deleted from history');
    } catch (error: any) {
      toast.error('Delete failed: ' + error.message);
    }
  };

  const downloadCSV = (data: GeneratedEmail[]) => {
    if (data.length === 0) return;
    const headers = ['First Name', 'Last Name', 'Email'];
    const csvContent = [
      headers.join(','),
      ...data.map(r => `${r.firstName},${r.lastName},${r.email}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `generated_emails_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded successfully');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-md"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <Mail className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Email Generator</h1>
            <p className="text-zinc-400">Login with Google to start generating emails securely with Firebase.</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] group"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 flex flex-col items-center p-6 relative overflow-hidden">
      {/* User Profile & Logout */}
      <div className="fixed top-6 right-6 z-[100] flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-md">
          <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full" />
          <span className="text-xs font-medium text-zinc-300">{user.displayName}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 rounded-xl bg-zinc-900/90 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-500 transition-all backdrop-blur-md"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <Toaster position="top-center" />
      
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <main className="w-full max-w-4xl relative z-10 py-12">
        <div className="text-center mb-12 space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4"
          >
            <Mail className="w-8 h-8 text-emerald-500" />
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            Email Generator
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide uppercase text-[10px]">
            Futuristic, Fast, and Secure with Firebase
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800/50 backdrop-blur-sm flex gap-1">
            {(['single', 'bulk', 'add-names', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  activeTab === tab 
                    ? "bg-emerald-500 text-zinc-950 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'add-names' ? (
            <motion.div
              key="add-names"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPasteGender('male')}
                  className={cn(
                    "py-6 rounded-2xl border font-bold transition-all",
                    pasteGender === 'male'
                      ? "bg-zinc-900 border-emerald-500/50 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                      : "bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  Male Names
                </button>
                <button
                  onClick={() => setPasteGender('female')}
                  className={cn(
                    "py-6 rounded-2xl border font-bold transition-all",
                    pasteGender === 'female'
                      ? "bg-zinc-900 border-pink-500/50 text-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.1)]"
                      : "bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  Female Names
                </button>
              </div>

              <button
                onClick={handleInstantPasteAndAdd}
                disabled={isAddingNames}
                className="w-full group relative overflow-hidden rounded-3xl bg-emerald-500 p-12 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                <div className="relative z-10 flex flex-col items-center gap-4">
                  {isAddingNames ? (
                    <Loader2 className="w-12 h-12 animate-spin text-zinc-950" />
                  ) : (
                    <Plus className="w-12 h-12 text-zinc-950 group-hover:rotate-90 transition-transform duration-500" />
                  )}
                  <div className="text-center">
                    <h3 className="text-3xl font-black text-zinc-950 uppercase tracking-tighter">Paste & Add</h3>
                    <p className="text-zinc-900/60 text-xs font-bold uppercase tracking-widest mt-1">Instant Sync to Firebase</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <p className="text-center text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                Click to instantly add clipboard names to {pasteGender} list
              </p>

              <div className="text-center text-zinc-400 text-sm">
                Total names in database: <span className="text-emerald-500 font-bold">{namesList.length}</span>
              </div>
            </motion.div>
          ) : activeTab === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-500" />
                  Generation History
                </h2>
                <button
                  onClick={() => downloadCSV(history)}
                  disabled={history.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-500 transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              </div>

              <div className="grid gap-3">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="group bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between hover:border-emerald-500/20 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-500 font-bold">
                        {item.firstName[0]}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{item.firstName} {item.lastName}</div>
                        <div className="text-xs text-zinc-500 font-mono">{item.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(item.email, -1)}
                        className="p-2 rounded-lg hover:bg-emerald-500/10 text-zinc-500 hover:text-emerald-500 transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => item.id && handleDeleteHistory(item.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-12 text-zinc-500 italic">
                    No history found. Start generating emails!
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="generator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Provider Selection */}
              <div className="space-y-6">
                <p className="text-center text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Select Providers</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => toggleProvider(provider.value)}
                      className={cn(
                        "px-6 py-3 rounded-2xl border text-xs font-bold uppercase tracking-widest transition-all",
                        selectedProviders.includes(provider.value)
                          ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                      )}
                    >
                      {provider.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk Count */}
              {activeTab === 'bulk' && (
                <div className="max-w-xs mx-auto space-y-4">
                  <p className="text-center text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">Generation Count</p>
                  <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
                    <input 
                      type="number" 
                      value={bulkCount}
                      onChange={(e) => setBulkCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-transparent border-none focus:ring-0 text-center w-full font-bold text-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => handleGenerate(activeTab === 'single' ? 1 : bulkCount)}
                  disabled={isGenerating || namesList.length === 0}
                  className="group relative px-12 py-5 rounded-3xl bg-emerald-500 text-zinc-950 font-black uppercase tracking-tighter text-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-4 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
                >
                  {isGenerating ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                  )}
                  Generate Now
                </button>
              </div>

              {/* Results */}
              <AnimatePresence>
                {results.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Live Results</h3>
                      <button 
                        onClick={() => downloadCSV(results)}
                        className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 text-xs font-bold uppercase tracking-widest transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export Batch
                      </button>
                    </div>
                    <div className="grid gap-4">
                      {results.map((result, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between hover:border-emerald-500/30 transition-all backdrop-blur-md"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xl border border-emerald-500/20">
                              {result.firstName[0]}
                            </div>
                            <div>
                              <div className="text-lg font-bold tracking-tight">{result.firstName} {result.lastName}</div>
                              <div className="text-zinc-500 font-mono text-sm">{result.email}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(result.email, idx)}
                            className="p-4 rounded-2xl bg-zinc-800/50 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-500 transition-all border border-transparent hover:border-emerald-500/20"
                          >
                            {copiedIndex === idx ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="mt-auto py-12 text-center space-y-2 opacity-30">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
          Powered by Firebase Real-time Infrastructure
        </p>
        <p className="text-[8px] font-medium text-zinc-600">
          Secure • Scalable • Serverless
        </p>
      </footer>
    </div>
  );
}
