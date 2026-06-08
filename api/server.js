const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

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

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/site-data", async (req, res) => {
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
    console.error("Unexpected error in /site-data:", err);
    return res.status(500).json({ error: "Internal server error" });
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

app.use((req, res) => {
  res.status(404).send("Not Found");
});

const PORT = process.env.PORT || 3000;
const path = require('path');

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
