const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const OpenAI= require('openai');

const app = express();

const dotenv = require('dotenv');
const result = dotenv.config();

if (result.error) {
  throw result.error;
}

// Set up the view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'SECRET'
}));

app.use(passport.initialize());
app.use(passport.session());

// OPEN AI //
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + openai.apiKey
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {"role": "system", "content": "You are a helpful assistant in generating email drafts."},
          {"role": "user", "content": prompt}
        ],
        stream: true
      })
    });

    if (!apiResponse.body) {
      res.status(500).send('Failed to obtain response body');
      return;
    }

    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();
    let isFinished = false;
    let accumulatedData = '';

    while (!isFinished) {
      const { value, done } = await reader.read();
      isFinished = done;
      accumulatedData += decoder.decode(value, {stream: !done});

      let boundary = accumulatedData.indexOf('\n');
      while (boundary !== -1) {
        const chunk = accumulatedData.substring(0, boundary);
        accumulatedData = accumulatedData.substring(boundary + 1);
        processChunk(chunk, res);
        boundary = accumulatedData.indexOf('\n');
      }
    }

    res.end();

  } catch (error) {
    console.error('Stream processing failed:', error);
    res.status(500).send('Stream processing failed');
  }
});

function processChunk(chunk, res) {
  if (chunk.trim() === 'data: [DONE]' || !chunk.trim().startsWith('data:')) return;

  try {
    const json = JSON.parse(chunk.trim().replace('data: ', ''));
    const text = json.choices?.[0]?.delta?.content;
    if (text) {
      res.write(text);
    }
  } catch (error) {
    console.error('Error processing chunk:', chunk, error);
  }
}

let userProfile;

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    userProfile = profile;
    return done(null, userProfile);
  }
));

// Routes
app.get('/', (req, res) => {
  res.render('auth');
});

app.get('/success', (req, res) => res.render('success', { user: userProfile }));
app.get('/error', (req, res) => res.send("Error logging in"));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/error' }),
  (req, res) => {
    res.redirect('/success');
  }
);

app.get('/chat', (req, res) => {
  res.render('chat');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('App listening on port ' + port));