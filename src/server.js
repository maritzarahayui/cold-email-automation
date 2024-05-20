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
    const bags = []

    while (!isFinished) {
      const { value, done } = await reader.read();
      isFinished = done;
      const decodedValue = decoder.decode(value)
      console.log("decodedValue", decodedValue);

      if (!decodedValue) break

      for (const chunk of decodedValue.split('\n\n')) {
        if (chunk.trim() === 'data: [DONE]') continue

        bags.push(chunk)
        try {
          const json = JSON.parse(bags.join('').split('data: ').at(-1) || '{}')
          const text = json.choices?.[0]?.delta?.content
          console.log("json", json);
          console.log("text", text);

          if (text) {
            res.write(text)
          }
        } catch (error) {
          // ignore
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("Error during streaming:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create completion: " + error.message
    });
  }
});

// app.post("/chat", async (req, res) => {
//   try {
//     const { prompt } = req.body;
//     const response = await fetch('https://api.openai.com/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': 'Bearer ' + openai.apiKey,
//       },
//       body: JSON.stringify({
//         model: 'gpt-3.5-turbo',
//         messages: [
//           {"role": "system", "content": "You are a helpful assistant in generating email drafts."},
//           {"role": "user", "content": prompt}
//         ],
//         stream: true 
//       })
//     });

//     console.log("PROMPT!!!! " + prompt)
//     console.log("FULL RESPONSE!!!!" + response.toString())

//     if (!response.body) {
//       res.status(500).send('Failed to obtain response body');
//       return;
//     }

//     const reader = response.body.getReader();
//     console.log("READERRRR!!!! " + reader)
//     const decoder = new TextDecoder();
//     let isFinished = false;

//     res.writeHead(200, {
//       'Content-Type': 'text/event-stream',
//       'Cache-Control': 'no-cache',
//       'Connection': 'keep-alive',
//     });

//     while (!isFinished) {
//       const { value, done } = await reader.read();
//       isFinished = done;
//       if (value) {
//         const decodedValue = decoder.decode(value, {stream: !done});
//         res.write(decodedValue); 
//       }
//     }

//     res.end();

//   } catch (error) {
//     console.log("ERRRORRR!!!!" + error.messages)
//     return res.status(500).json({
//       success: false,
//       error: "Failed to create completion"
//     });
//   }
// });

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