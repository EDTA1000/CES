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
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const db = {
    users: [] 
};

app.post('/api/subscribe-trial', (req, res) => {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: 'ایمیل الزامی است.' });

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(startDate.getDate() + 7);

    db.users.push({
        email,
        plan: 'trial',
        startDate: startDate.toISOString(),
        expiryDate: expiryDate.toISOString()
    });

    console.log(`اشتراک ۷ روزه برای ${email} فعال شد. انقضا: ${expiryDate.toDateString()}`);

    res.status(200).json({ 
        message: 'اشتراک ۷ روزه رایگان فعال شد!',
        expiry: expiryDate.toLocaleDateString('fa-IR') // تاریخ به شمسی برای نمایش
    });
});
app.use(express.json());
    app.post('/api/purchase', (req, res) => {
    const { plan } = req.body;
    console.log(`درخواست خرید پلن: ${plan}`);
    
    res.status(200).json({ message: 'به درگاه پرداخت منتقل می‌شوید.' });
});

app.post('/api/subscribe-trial', (req, res) => {
    const { email, plan } = req.body;
    
    if (!email) return res.status(400).json({ message: 'ایمیل الزامی است.' });

    console.log(`فعال‌سازی اشتراک رایگان برای: ${email}`);
    
    res.status(200).json({ message: 'اشتراک ۷ روزه رایگان برای شما فعال شد!' });
});
app.post('/api/subscribe', async (req, res) => {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'فرمت ایمیل نامعتبر است.' });
    }

    try {
        // const { data, error } = await supabase.from('subscribers').insert([{ email }]);
        
        res.status(200).json({ message: 'ایمیل با موفقیت ثبت شد.' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'خطای داخلی سرور.' });
    }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/api/comments", async (req, res) => {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});
app.get("/api/site-data", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("site_data")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching site data:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Site data not found" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Unexpected error in /api/site-data:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
app.post('/api/check-user-status', async (req, res) => {
  const { email } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_subscribed')
      .eq('email', email)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) {
      return res.json({ isNewUser: true });
    }
    
    return res.json({ isNewUser: false });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دیتابیس' });
  }
});
app.post("/api/comment-vote", async (req, res) => {

  const { email, commentId, type } = req.body;

  const { error } = await supabase
    .from("comment_votes")
    .upsert(
      {
        comment_id: commentId,
        email,
        type
      },
      {
        onConflict: "comment_id,email"
      }
    );

  if (error) {
    return res.status(500).json(error);
  }

  res.json({
    success: true
  });

});
app.get("/api/comment-votes/:id", async (req, res) => {

  const commentId = req.params.id;

  const { data } = await supabase
    .from("comment_votes")
    .select("type")
    .eq("comment_id", commentId);

  const likes = data.filter(x => x.type === "like").length;
  const dislikes = data.filter(x => x.type === "dislike").length;

  res.json({
    likes,
    dislikes
  });

});
app.get("/api/comment-replies/:id", async (req, res) => {

  const { data, error } = await supabase
    .from("comment_replies")
    .select("*")
    .eq("comment_id", req.params.id)
    .order("created_at", { ascending: true });

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);

});
app.post("/api/comment-reply", async (req, res) => {

  const { email, commentId, content } = req.body;

  const { data, error } = await supabase
    .from("comment_replies")
    .insert([
      {
        email,
        comment_id: commentId,
        content
      }
    ]);

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);

});
app.post('/api/activate-free-trial', async (req, res) => {
  const { email } = req.body;
  try {
    await supabase.from('users').upsert([{ email: email, is_subscribed: true }]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطا در فعال‌سازی' });
  }
});
app.post('/api/decline-free-trial', async (req, res) => {
  const { email } = req.body;
  try {
    await supabase.from('users').upsert([{ email: email, is_subscribed: false }]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطا در ثبت' });
  }
});

app.post("/vote", async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ error: "Email and type are required" });
    }

    if (type !== "like" && type !== "dislike") {
      return res.status(400).json({ error: "Type must be like or dislike" });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("Error fetching user:", userError);
      return res.status(500).json({ error: userError.message });
    }

    if (!user) {
      return res.status(403).json({ error: "User not found or not subscribed" });
    }

    if (user.expiry_date) {
      const expiryDate = new Date(user.expiry_date);
      const now = new Date();

      if (expiryDate < now) {
        return res.status(403).json({ error: "Subscription expired" });
      }
    }

    const { data: previousVote, error: previousVoteError } = await supabase
      .from("votes")
      .select("type")
      .eq("email", email)
      .maybeSingle();

    if (previousVoteError) {
      console.error("Error fetching previous vote:", previousVoteError);
      return res.status(500).json({ error: previousVoteError.message });
    }

    const { error: upsertError } = await supabase
      .from("votes")
      .upsert(
        {
          email,
          type,
        },
        {
          onConflict: "email",
        }
      );

    if (upsertError) {
      console.error("Error upserting vote:", upsertError);
      return res.status(500).json({ error: upsertError.message });
    }

    const { data: siteData, error: siteDataError } = await supabase
      .from("site_data")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (siteDataError) {
      console.error("Error fetching site data for update:", siteDataError);
      return res.status(500).json({ error: siteDataError.message });
    }

    if (!siteData) {
      return res.status(404).json({ error: "Site data row not found" });
    }

    let likes = siteData.likes || 0;
    let dislikes = siteData.dislikes || 0;

    if (previousVote) {
      if (previousVote.type === "like") {
        likes = Math.max(0, likes - 1);
      } else if (previousVote.type === "dislike") {
        dislikes = Math.max(0, dislikes - 1);
      }
    }

    if (type === "like") {
      likes += 1;
    } else if (type === "dislike") {
      dislikes += 1;
    }

    const { error: updateError } = await supabase
      .from("site_data")
      .update({
        likes,
        dislikes,
      })
      .eq("id", 1);

    if (updateError) {
      console.error("Error updating site data:", updateError);
      return res.status(500).json({ error: updateError.message });
    }

    return res.json({
      success: true,
      message: "Vote recorded successfully",
      likes,
      dislikes,
    });
  } catch (err) {
    console.error("Unexpected error in /vote:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});
   app.use(cors()); 
    app.use(express.json());
    app.post('/verify-admin', (req, res) => {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      if (password === process.env.ADMIN_PASSWORD) {
        res.status(200).json({ message: 'Admin verified' });
      } else {
        res.status(401).json({ message: 'Invalid password' });
      }
    });
app.get('/simulation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'simulation.html'));
});
app.post("/api/comments", async (req, res) => {
  const { email, content } = req.body;

  const { data, error } = await supabase
    .from("comments")
    .insert([{ email, content }])
    .select();

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});
app.get('/create-piece', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'create-piece.html'));
});

app.post("/create-piece", async (req, res) => {
  try {
    const { password, pieceData } = req.body;

    if (!process.env.ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD is not set in environment variables.");
      return res.status(500).json({ error: "Server configuration error." });
    }

    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password." });
    }

    console.log("Admin verified. Creating piece:", pieceData);

    return res.json({ message: "Piece created successfully!" });
  } catch (err) {
    console.error("Unexpected error in /create-piece:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

export default app;

