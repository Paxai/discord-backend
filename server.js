const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI; // Musi być zgodne z tym z Discord Developer Portal

// 1️⃣ Główna logika: wymiana kodu na token + pobieranie danych użytkownika
app.post('/auth/discord', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Brak kodu!' });

  try {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        scope: 'identify',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenResponse.data.access_token}`,
      },
    });

    res.json(userResponse.data);
  } catch (error) {
    console.error('Błąd Discord OAuth:', error.response?.data || error.message);
    res.status(500).json({ error: 'Nie udało się zalogować' });
  }
});

// 2️⃣ Obsługa GET `/auth/discord/callback` – używane przez Discord jako redirect_uri
app.get('/auth/discord/callback', (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Brak kodu autoryzacyjnego');
  }

  // Przekieruj użytkownika do frontendu z kodem w URL
  res.redirect(`https://project-ud55.vercel.app/?code=${code}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serwer działa na porcie ${PORT}`);
});
