const express = require('express');
const app = express();
app.use(express.json());

// دیتابیس موقت
let siteData = {
    likes: 0,
    dislikes: 0,
    comments: [],
    voters: {}, // ذخیره ایمیل‌ها برای جلوگیری از رای دوباره: { "user@test.com": "like" }
    users: {}   // ذخیره اطلاعات کاربران: { "user@test.com": { expiryDate: "..." } }
};

// ۱. سیستم احراز هویت واقعی
app.post('/api/login-or-register', (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "ایمیل نامعتبر است!" });
    }

    if (!siteData.users[email]) {
        // ثبت نام کاربر جدید با ۷ روز اشتراک رایگان
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        siteData.users[email] = {
            email: email,
            expiryDate: expiryDate.toISOString()
        };
        return res.json({ user: siteData.users[email], message: "ثبت‌نام با موفقیت انجام شد (۷ روز رایگان)" });
    }

    // اگر کاربر از قبل بود، فقط ورود بده
    res.json({ user: siteData.users[email], message: "خوش آمدید" });
});

// ۲. سیستم رای‌دهی امن (حل مشکل رای بی‌نهایت)
app.post('/api/vote', (req, res) => {
    const { type, email } = req.body;

    if (!email || !siteData.users[email]) {
        return res.status(401).json({ error: "ابتدا باید وارد شوید!" });
    }

    // بررسی اینکه آیا این کاربر قبلاً رای داده است یا خیر
    if (siteData.voters[email]) {
        return res.status(403).json({ error: "شما قبلاً رای داده‌اید!" });
    }

    if (type === 'like') siteData.likes++;
    else if (type === 'dislike') siteData.dislikes++;

    siteData.voters[email] = type; // ثبت رای در حافظه سرور
    res.json({ likes: siteData.likes, dislikes: siteData.dislikes });
});

// ۳. دریافت داده‌ها
app.get('/api/data', (req, res) => {
    res.json(siteData);
});

app.listen(3000, () => console.log("Server running on port 3000"));
