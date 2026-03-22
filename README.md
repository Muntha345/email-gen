# 📧 Email & Name Generator with Google Sheets Integration

এটি একটি শক্তিশালী **Email Generator** এবং **Name Manager** অ্যাপ্লিকেশন যা সরাসরি **Google Sheets API** এর সাথে ইন্টিগ্রেটেড। এটি ব্যবহার করে আপনি সহজেই নাম অ্যাড করতে পারেন এবং ইউনিক ইমেইল জেনারেট করতে পারেন।

## ✨ বৈশিষ্ট্যসমূহ (Features)
- **Email Generation**: ইউনিক ইমেইল জেনারেট করে এবং ডুপ্লিকেট চেক করে।
- **Name Management**: জেন্ডার অনুযায়ী নাম অ্যাড করে এবং ডুপ্লিকেট নাম বাদ দেয়।
- **Google Sheets Integration**: রিয়েল-টাইমে ডেটা শিটে সেভ হয়।
- **Modern UI**: Tailwind CSS এবং Framer Motion ব্যবহার করে তৈরি করা আকর্ষণীয় ইন্টারফেস।

## 🚀 কীভাবে ব্যবহার করবেন (How to Use)

### ১. লোকালি চালানো (Locally)
১. প্রোজেক্টটি ডাউনলোড বা ক্লোন করুন।
২. টার্মিনালে গিয়ে প্যাকেজ ইন্সটল করুন:
   ```bash
   npm install
   ```
৩. `.env.example` ফাইলটি কপি করে `.env` নামে একটি ফাইল তৈরি করুন এবং আপনার Google API এর তথ্যগুলো দিন।
৪. অ্যাপ্লিকেশনটি চালু করতে লিখুন:
   ```bash
   npm run dev
   ```

### ২. GitHub-এ পাবলিশ করা (Publish to GitHub)
১. GitHub-এ একটি নতুন **Private Repository** তৈরি করুন (নিরাপত্তার জন্য)।
২. আপনার কোডটি সেখানে আপলোড করুন।
৩. হোস্টিংয়ের জন্য **Render** বা **Railway** ব্যবহার করতে পারেন।

## ⚠️ নিরাপত্তা সতর্কতা (Security Warning)
আপনার Google API এর **Private Key** কখনোই পাবলিক রিপোজিটরিতে শেয়ার করবেন না। সবসময় এনভায়রনমেন্ট ভেরিয়েবল (`.env`) ব্যবহার করুন।

## 🛠️ টেক স্ট্যাক (Tech Stack)
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express.
- **Database**: Google Sheets API.
