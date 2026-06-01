const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// تنظیمات برای خواندن داده‌های JSON از سمت کلاینت
app.use(bodyParser.json());

// اجازه دادن به اکسپرس برای دسترسی به فایل‌های HTML، CSS و JS شما
app.use(express.static(path.join(__dirname)));

// --- دیتابیس موقت (در حافظه) ---
// این بخش فقط یک بار تعریف شده است تا خطا ندهد
let users = {}; 
let comments = [
    { id: 1, text: "این یک نظر نمونه است", votes: 0 },
    { id: 2, text: "طراحی بسیار خوبی دارد!", votes: 5 }
];

// --- مسیرهای API (Back-end Routes) ---

// ۱. دریافت وضعیت کاربر (برای نمایش دکمه‌ها در صفحه اصلی)
app.get('/api/user-status', (req, res) => {
    // در حال حاضر همه را کاربر عادی فرض می‌کنیم تا سیستم کامل شود
    res.json({ access: "free", expiry: null });
});

// ۲. دریافت لیست نظرات
app.get('/api/comments', (req, res) => {
    res.json(comments);
});

// ۳. ثبت رای (لایک/دیسلایک)
app.post('/api/vote', (req, res) => {
    const { commentId, type } = req.body;
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
        type === 'like' ? comment.votes++ : comment.votes--;
        res.json({ success: true, newVotes: comment.votes });
    } else {
        res.status(404).json({ success: false, message: "نظر پیدا نشد" });
    }
});

// ۴. مدیریت اشتراک و احراز هویت
app.post('/api/subscribe', (req, res) => {
    const { email, password } = req.body;

    // چک کردن رمز خاص ادمین
    if (password === "SECRET_CODE_123") {
        users[email] = { access: "admin", expiry: "infinite" };
        return res.json({ success: true, message: "دسترسی ویژه ادمین فعال شد!" });
    }

    // اگر کاربر جدید بود، اشتراک رایگان یک هفته‌ای بده
    if (!users[email]) {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        users[email] = { access: "trial", expiry: oneWeekFromNow };
        return res.json({ success: true, message: "اشتراک رایگان یک هفته‌ای فعال شد!" });
    }

    res.json({ success: false, message: "این ایمیل قبلاً ثبت شده است." });
});

// راه اندازی سرور
app.listen(PORT, () => {
    console.log(`---------------------------------------`);
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📂 Serving files from: ${__dirname}`);
    console.log(`---------------------------------------`);
});
