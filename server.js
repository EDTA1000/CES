import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "6.67430...×10^(-11)m³/(kg.s²)"; 

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Key are required. Please set SUPABASE_URL and SUPABASE_KEY environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use(express.static('public')); 


app.post('/signup', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, expiry_date')
            .eq('email', email)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means 'No rows found'
            throw fetchError;
        }

        if (existingUser) {
            const expiryDate = new Date(existingUser.expiry_date);
            if (expiryDate > new Date()) {
                return res.status(409).json({ message: "User already exists and has valid access." });
            } else {
                // Update expiry date if expired
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

// ثبت رای و جلوگیری از رای تکراری
app.post('/vote', async (req, res) => {
    const { email, type } = req.body; // type can be 'like' or 'dislike'
    if (!email || !type) {
        return res.status(400).json({ error: "Email and vote type are required" });
    }
    if (type !== 'like' && type !== 'dislike') {
        return res.status(400).json({ error: "Invalid vote type. Must be 'like' or 'dislike'." });
    }

    try {
        // Check if user has valid access
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('expiry_date')
            .eq('email', email)
            .single();

        if (userError || !user || new Date(user.expiry_date) <= new Date()) {
            return res.status(403).json({ error: "User does not have valid access or access has expired." });
        }

        // Check if user has already voted
        const { data: existingVote, error: voteError } = await supabase
            .from('votes')
            .select('id')
            .eq('email', email)
            .eq('type', type) // Check for the specific type of vote
            .single();

        if (voteError && voteError.code !== 'PGRST116') {
            throw voteError;
        }

        if (existingVote) {
            return res.status(409).json({ message: "You have already voted for this type." });
        }

        // Record the vote
        const { error: insertError } = await supabase
            .from('votes')
            .insert([{ email: email, type: type }]);
        if (insertError) throw insertError;

        // Update site_data counts
        let updateQuery = supabase.from('site_data').update({});
        if (type === 'like') {
            updateQuery = updateQuery.set('likes', () => 'likes + 1');
        } else {
            updateQuery = updateQuery.set('dislikes', () => 'dislikes + 1');
        }
        updateQuery = updateQuery.eq('id', 1); // Assuming id=1 for the single row

        const { error: dataUpdateError } = await updateQuery;
        if (dataUpdateError) throw dataUpdateError;

        res.json({ message: "Vote recorded successfully." });

    } catch (error) {
        console.error("Vote error:", error);
        res.status(500).json({ error: "Failed to record vote" });
    }
});

// دریافت اطلاعات سایت (like/dislike)
app.get('/site-data', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('site_data')
            .select('likes, dislikes')
            .eq('id', 1) // Assuming id=1 for the single row
            .single();
        if (error) throw error;
        res.json(data || { likes: 0, dislikes: 0 });
    } catch (error) {
        console.error("Get site data error:", error);
        res.status(500).json({ error: "Failed to retrieve site data" });
    }
});

// -- Admin Routes --
app.post('/create-piece', async (req, res) => {
    const { pieceData, password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "Invalid admin password." });
    }

    if (!pieceData) {
        return res.status(400).json({ error: "Piece data is required." });
    }

    try {
        // Here you would typically insert pieceData into a 'pieces' table
        // For now, we'll just acknowledge it.
        // Example: const { data, error } = await supabase.from('pieces').insert([pieceData]);
        // if (error) throw error;

        res.status(201).json({ message: "Piece created successfully (simulated).", receivedData: pieceData });
    } catch (error) {
        console.error("Create piece error:", error);
        res.status(500).json({ error: "Failed to create piece." });
    }
});

// -- Serve Frontend --
// This assumes your frontend files (index.html, main.js, lighting.png) are in a 'public' folder
// Make sure to create this folder and place your files there.
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Adjust path as needed
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
