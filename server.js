import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPublicPath = () => {
    const paths = [
        path.join(__dirname, '..', 'public'), 
        path.join(__dirname, 'public')       
    ];
    
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return paths[0]; 
};

const publicPath = getPublicPath();

// --- ۲. تنظیمات محیطی و Supabase ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Key are required.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- ۳. میدل‌ورها ---
app.use(express.json());
app.use(express.static(publicPath)); 

// --- ۴. مسیرهای API ---

// Signup
app.post('/signup', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, expiry_date')
            .eq('email', email)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (existingUser) {
            const expiryDate = new Date(existingUser.expiry_date);
            if (expiryDate > new Date()) {
                return res.status(409).json({ message: "User already exists and has valid access." });
            } else {
                const newExpiryDate = new Date();
                newExpiryDate.setDate(newExpiryDate.getDate() + 7);
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ expiry_date: newExpiryDate.toISOString() })
                    .eq('id', existingUser.id);
                if (updateError) throw updateError;
                return res.json({ message: "User access extended for 7 days." });
            }
        } else {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);
            const { data, error } = await supabase
                .from('users')
                .insert([{ email: email, expiry_date: expiryDate.toISOString() }]);
            if (error) throw error;
            res.status(201).json({ message: "User registered. Access valid for 7 days." });
        }
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Failed to process signup" });
    }
});

// Vote
app.post('/vote', async (req, res) => {
    const { email, type } = req.body;
    if (!email || !type) return res.status(400).json({ error: "Email and vote type are required" });
    if (type !== 'like' && type !== 'dislike') return res.status(400).json({ error: "Invalid vote type." });

    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('expiry_date')
            .eq('email', email)
            .single();

        if (userError || !user || new Date(user.expiry_date) <= new Date()) {
            return res.status(403).json({ error: "User does not have valid access." });
        }

        const { data: existingVote, error: voteError } = await supabase
            .from('votes')
            .select('id')
            .eq('email', email)
            .eq('type', type)
            .single();

        if (voteError && voteError.code !== 'PGRST116') throw voteError;
        if (existingVote) return res.status(409).json({ message: "You have already voted." });

        const { error: insertError } = await supabase
            .from('votes')
            .insert([{ email: email, type: type }]);
        if (insertError) throw insertError;

        let updateQuery = supabase.from('site_data').update({});
        if (type === 'like') {
            updateQuery = updateQuery.set('likes', () => 'likes + 1');
        } else {
            updateQuery = updateQuery.set('dislikes', () => 'dislikes + 1');
        }
        const { error: dataUpdateError } = await updateQuery.eq('id', 1);
        if (dataUpdateError) throw dataUpdateError;

        res.json({ message: "Vote recorded successfully." });
    } catch (error) {
        console.error("Vote error:", error);
        res.status(500).json({ error: "Failed to record vote" });
    }
});

// Site Data
app.get('/site-data', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('site_data')
            .select('likes, dislikes')
            .eq('id', 1)
            .single();
        if (error) throw error;
        res.json(data || { likes: 0, dislikes: 0 });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve site data" });
    }
});

app.post('/create-piece', async (req, res) => {
    const { pieceData, password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(403).json({ error: "Invalid admin password." });
    if (!pieceData) return res.status(400).json({ error: "Piece data is required." });
    
    try {
 
        res.status(201).json({ message: "Piece created successfully.", receivedData: pieceData });
    } catch (error) {
        res.status(500).json({ error: "Failed to create piece." });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html')); 
});

export default app;
