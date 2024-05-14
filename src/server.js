const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('App listening on port ' + port));