const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = 3000;
const USERS_FILE = './users.json';
const DATA_FILE = './data.json'; // برای ذخیره نظرات و لایک‌ها

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// --- دیتابیس‌های موقت (با قابلیت ذخیره‌سازی در فایل) ---
let users = {};
let siteData = { comments: [], likes: 0, dislikes: 0 };

// خواندن اطلاعات از فایل‌ها در شروع کار
if (fs.existsSync(USERS_FILE)) users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
if (fs.existsSync(DATA_FILE)) siteData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

const saveAll = () => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    fs.writeFileSync(DATA_FILE, JSON.stringify(siteData, null, 2));
};

// --- بخش احراز هویت و اشتراک ---
app.post('/api/login-or-register', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "ایمیل الزامی است." });

    const now = new Date();
    let user = Object.values(users).find(u => u.email === email);

    if (!user) {
        const expiryDate = new Date();
        expiryDate.setDate(now.getDate() + 7); // ۷ روز رایگان

        user = {
            email: email,
            subscriptionType: 'free',
            expiryDate: expiryDate.toISOString(),
            id: crypto.randomBytes(8).toString('hex')
        };
        users[user.id] = user;
        saveAll();
        return res.json({ message: "ثبت‌نام موفق! ۷ روز اشتراک رایگان فعال شد.", user });
    } else {
        const isExpired = new Date(user.expiryDate) < now;
        return res.json({ message: isExpired ? "اشتراک منقضی شده." : "خوش آمدید!", user, isExpired });
    }
});

// --- بخش نظرات و رای‌گیری (Logic اصلی که حذف شده بود) ---

// دریافت لیست نظرات و آمار
app.get('/api/data', (req, res) => {
    res.json(siteData);
});

// ثبت نظر جدید
app.post('/api/comment', (req, res) => {
    const { text, email, isExpired } = req.body;
    if (isExpired) return res.status(403).json({ message: "برای ثبت نظر باید اشتراک داشته باشید." });
    if (!text) return res.status(400).json({ message: "متن نظر خالی است." });

    const newComment = {
        id: Date.now(),
        text,
        email,
        date: new Date().toLocaleString('fa-IR')
    };
    siteData.comments.push(newComment);
    saveAll();
    res.json(newComment);
});

// لایک و دیس‌لایک
app.post('/api/vote', (req, res) => {
    const { type, isExpired } = req.body;
    if (isExpired) return res.status(403).json({ message: "برای رای دادن باید اشتراک داشته باشید." });

    if (type === 'like') siteData.likes++;
    if (type === 'dislike') siteData.dislikes++;
    
    saveAll();
    res.json({ likes: siteData.likes, dislikes: siteData.dislikes });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
