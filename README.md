# Price Tracker Bot (Amazon + Flipkart)

Telegram bot — কেউ Amazon বা Flipkart এর প্রোডাক্ট লিংক পাঠালে বট প্রাইস ট্র্যাক করা শুরু করে, এবং দাম কমলে অটোমেটিক নোটিফিকেশন পাঠায়।

## কী কী করে
- `/track <link>` বা সরাসরি লিংক পাঠালেই ট্র্যাকিং শুরু
- `/list` — ট্র্যাক করা সব প্রোডাক্ট ও দাম দেখায়
- `/untrack <id>` — ট্র্যাকিং বন্ধ করে
- `/chart <id>` — সেই প্রোডাক্টের দামের হিস্ট্রি লাইন গ্রাফ (ছবি) পাঠায়
- প্রতি ৬ ঘন্টায় (কনফিগারযোগ্য) অটো প্রাইস চেক, দাম কমলে মেসেজ পাঠায়, প্রতিটা চেক প্রাইস হিস্ট্রিতে সেভ হয়

## ধাপ ১: Telegram Bot বানানো
1. Telegram-এ **@BotFather** খুলুন
2. `/newbot` পাঠান, নাম দিন
3. যে **token** পাবেন সেটা কপি করে রাখুন

## ধাপ ২: লোকালি রান করা (টেস্ট করতে)
```bash
npm install
cp .env.example .env
# .env ফাইলে BOT_TOKEN বসান
npm start
```

## ধাপ ৩: GitHub-এ পুশ করা
```bash
git init
git add .
git commit -m "Amazon/Flipkart price tracker bot"
git branch -M main
git remote add origin https://github.com/<your-username>/price-tracker-bot.git
git push -u origin main
```

## ধাপ ৪: Railway-তে ডেপ্লয়
1. [railway.app](https://railway.app) এ গিয়ে **New Project → Deploy from GitHub repo** বাছুন
2. এই রিপোটা সিলেক্ট করুন
3. **Variables** ট্যাবে গিয়ে `BOT_TOKEN` এবং (চাইলে) `CHECK_CRON` অ্যাড করুন
4. Deploy হয়ে গেলে bot চালু হয়ে যাবে — Telegram-এ গিয়ে `/start` দিয়ে টেস্ট করুন

### ডেটা persist করা (গুরুত্বপূর্ণ)
এই বট প্রোডাক্টের তালিকা `data/db.json` ফাইলে রাখে। Railway-তে redeploy হলে এই ফাইল মুছে যেতে পারে যদি volume না থাকে। তাই:
- Railway প্রজেক্টে **Volume** অ্যাড করুন এবং সেটা `/app/data` পাথে mount করুন
- এতে ট্র্যাক করা প্রোডাক্টের লিস্ট রিডেপ্লয়ের পরও থেকে যাবে

### চার্ট কীভাবে কাজ করে
গ্রাফ বানাতে [QuickChart.io](https://quickchart.io) নামের একটা ফ্রি পাবলিক চার্ট API ইউজ করা হয়েছে — তাই আলাদা কোনো native library (canvas ইত্যাদি) ইনস্টল করতে হয় না, Railway-তে ডেপ্লয় করাও সহজ। প্রতিবার প্রাইস চেক হলে সেই দাম `data/db.json`-এ প্রোডাক্টের `priceHistory` তে জমা হয় (সর্বশেষ ১০০টা এন্ট্রি রাখা হয়), আর `/chart <id>` দিলে সেই হিস্ট্রি থেকে লাইন গ্রাফ বানিয়ে পাঠানো হয়।

## সীমাবদ্ধতা ও সতর্কতা
- Amazon/Flipkart মাঝে মাঝে তাদের পেজের HTML গঠন বদলায় — তখন `src/scraper.js` এর selector গুলো আপডেট করতে হতে পারে
- অতিরিক্ত রিকোয়েস্ট পাঠালে IP ব্লক হতে পারে — কোড-এ ইচ্ছাকৃত delay রাখা আছে, দরকার হলে `CHECK_CRON` আরও কম ফ্রিকোয়েন্সিতে সেট করুন (যেমন দিনে ২ বার)
- এটা ব্যক্তিগত/ছোট স্কেলে ব্যবহারের জন্য একটা MVP — বড় স্কেলে ব্যবহারের আগে Amazon/Flipkart-এর টার্মস অফ সার্ভিস দেখে নেওয়া ভালো

## ফাইল স্ট্রাকচার
```
src/
  index.js    - entry point, cron scheduler
  bot.js      - Telegram command handlers
  scraper.js  - Amazon/Flipkart প্রাইস স্ক্র্যাপার
  storage.js  - সাধারণ JSON ফাইল-ভিত্তিক স্টোরেজ
data/db.json  - ট্র্যাক করা প্রোডাক্টের ডেটা (auto-generated)
```
