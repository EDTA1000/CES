import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


pp.post('/api/subscribe', async (req, res) => {
  const { email } = req.body;

  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('email, expiryDate')
      .eq('email', email)
      .single();
    if (existingUser) {
      return res.status(200).json({ success: true, message: 'خوش آمدید!' });
    }

    const { error } = await supabase
      .from('users')
      .insert([{ 
        email: email, 
        is_subscribed: false 
      }]);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'ثبت‌نام اولیه انجام شد.' });
  } catch (err) {
    res.status(500).json({ message: 'خطای سرور' });
  }
});

app.post('/api/purchase', async (req, res) => {
  try {
    const { email, planId } = req.body;

    console.log(`درخواست خرید پلن: ${planId} برای ${email}`);

    if (!email || !planId) {
      return res.status(400).json({ success: false, message: 'ایمیل و پلن الزامی است.' });
    }

    return res.status(200).json({
      success: true,
      message: 'به درگاه پرداخت منتقل می‌شوید.'
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return res.status(500).json({ success: false, message: 'خطای داخلی سرور.' });
  }
});

app.post('/api/subscribe-trial', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'ایمیل الزامی است.' });
    }

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setDate(startDate.getDate() + 7);

    try {
      await supabase.from('users').upsert([
        {
          email,
          plan: 'trial',
          is_subscribed: true,
          startDate: startDate.toISOString(),
          expiryDate: expiryDate.toISOString()
        }
      ]);
    } catch (dbErr) {
      console.error('Error saving trial subscription:', dbErr);
    }

    console.log(`اشتراک ۷ روزه برای ${email} فعال شد. انقضا: ${expiryDate.toDateString()}`);

    return res.status(200).json({
      success: true,
      message: 'اشتراک ۷ روزه رایگان فعال شد!',
      expiry: expiryDate.toLocaleDateString('fa-IR')
    });
  } catch (error) {
    console.error('Trial subscribe error:', error);
    return res.status(500).json({ success: false, message: 'خطای داخلی سرور.' });
  }
});

// API: activate free trial (legacy/compatibility)
app.post('/api/activate-free-trial', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'ایمیل الزامی است.' });
    }

    await supabase.from('users').upsert([
      { email: email, is_subscribed: true, plan: 'trial' }
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error activating free trial:', err);
    return res.status(500).json({ error: 'خطا در فعال‌سازی' });
  }
});

// API: decline free trial (legacy/compatibility)
app.post('/api/decline-free-trial', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'ایمیل الزامی است.' });
    }

    await supabase.from('users').upsert([
      { email: email, is_subscribed: false }
    ]);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error declining free trial:', err);
    return res.status(500).json({ error: 'خطا در ثبت' });
  }
});

// API: check user status
app.post('/api/check-user-status', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'ایمیل الزامی است.' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('is_subscribed, plan, expiryDate, startDate')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error checking user status:', error);
      return res.status(500).json({ success: false, error: 'خطا در دیتابیس' });
    }

    return res.json({
      success: true,
      data: data || null
    });
  } catch (err) {
    console.error('Unexpected error in /api/check-user-status:', err);
    return res.status(500).json({ success: false, error: 'خطا در دیتابیس' });
  }
});

// API: comments
app.get('/api/comments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ error: 'خطا در دریافت نظرات' });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in /api/comments GET:', err);
    return res.status(500).json({ error: 'خطا در دریافت نظرات' });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { email, content } = req.body;

    if (!email || !content) {
      return res.status(400).json({ success: false, message: 'ایمیل و متن نظر الزامی است.' });
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([{ email, content }])
      .select();

    if (error) {
      console.error('Error inserting comment:', error);
      return res.status(500).json({ success: false, message: 'خطا در ثبت نظر' });
    }

    return res.status(200).json({
      success: true,
      message: 'نظر با موفقیت ثبت شد.',
      data: data || []
    });
  } catch (err) {
    console.error('Unexpected error in /api/comments POST:', err);
    return res.status(500).json({ success: false, message: 'خطا در ثبت نظر' });
  }
});
app.post('/api/replies', async (req, res) => {
  try {
    const { comment_id, email, content } = req.body;
    const { data, error } = await supabase
      .from('replies')
      .insert([{ comment_id, email, content }]);

    if (error) return res.status(500).json({ success: false, message: 'خطا در ثبت پاسخ' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

app.post('/api/vote', async (req, res) => {
  try {
    const { comment_id, user_email, vote_type } = req.body;
    const { data, error } = await supabase
      .from('votes')
      .insert([{ comment_id, user_email, vote_type }]);

    if (error) return res.status(500).json({ success: false, message: 'خطا در ثبت رای' });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// API: admin verify
app.post('/api/admin-verify', async (req, res) => {
  const { code } = req.body;
  if (code === process.env.ADMIN_SECRET) {
    return res.json({ authorized: true });
  }
  return res.status(401).json({ authorized: false, message: 'کد نامعتبر' });
});

// API: create piece
app.post('/api/create-piece', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const { data, error } = await supabase
      .from('pieces')
      .insert([{ title, content, author }]);

    if (error) return res.status(500).json({ success: false, message: 'خطا در ساخت اثر' });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// API: simulation (if exists in original logic)
app.post('/api/run-simulation', (req, res) => {
    res.status(200).json({ success: true, result: "Simulation finished" });
});

// API: site data (general info)
app.get('/api/site-data', async (req, res) => {
    const { data, error } = await supabase.from('site_settings').select('*');
    res.json(data || {});
});

app.use((req, res) => {
  res.status(404).send('صفحه مورد نظر پیدا نشد.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
