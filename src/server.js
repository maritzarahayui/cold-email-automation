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
app.use(express.json());
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "You are a helpful assistant in generating email drafts."},
        {"role": "user", "content": prompt}
      ],
    });

    return res.status(200).json({
      success: true,
      data: response.choices[0]
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Failed to create completion"
    });
  }
});

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