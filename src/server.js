const express = require("express");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const OpenAI = require("openai");
const { ensureAuthenticated } = require("../middleware/middleware");

const app = express();

const dotenv = require("dotenv");
const result = dotenv.config();

if (result.error) {
  throw result.error;
}

// Set up the view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);

app.use(passport.initialize());
app.use(passport.session());

// OPEN AI //
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

app.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    promptText = `Buatkan sebuah template email untuk customer tentang ${prompt}. Berikan juga caption di akhir yang menampilkan salam penutup dari Algo Network`;
    const apiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + openai.apiKey,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant in generating email drafts.",
            },
            // {"role": "system", "content": "Algo Network is a Palugada Company Based in Jakarta"},
            { role: "user", content: promptText },
          ],
          stream: true,
        }),
      }
    );

    if (!apiResponse.body) {
      res.status(500).send("Failed to obtain response body");
      return;
    }

    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();
    let isFinished = false;
    let accumulatedData = "";

    while (!isFinished) {
      const { value, done } = await reader.read();
      isFinished = done;
      accumulatedData += decoder.decode(value, { stream: !done });

      let boundary = accumulatedData.indexOf("\n");
      while (boundary !== -1) {
        const chunk = accumulatedData.substring(0, boundary);
        accumulatedData = accumulatedData.substring(boundary + 1);
        processChunk(chunk, res);
        boundary = accumulatedData.indexOf("\n");
      }
    }

    res.end();
  } catch (error) {
    console.error("Stream processing failed:", error);
    res.status(500).send("Stream processing failed");
  }
});

function processChunk(chunk, res) {
  if (chunk.trim() === "data: [DONE]" || !chunk.trim().startsWith("data:"))
    return;

  try {
    const json = JSON.parse(chunk.trim().replace("data: ", ""));
    const text = json.choices?.[0]?.delta?.content;
    if (text) {
      res.write(text);
    }
  } catch (error) {
    console.error("Error processing chunk:", chunk, error);
  }
}

let userProfile;

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      const email = profile.emails[0].value;
      const domain = email.split("@")[1];

      if (domain === "bangkit.academy") {
        userProfile = profile;
        return done(null, userProfile);
      } else {
        return done(null, false, { message: "Unauthorized domain" });
      }
    }
  )
);

// Routes
app.get("/", (req, res) => {
  res.render("auth");
});

app.get("/success", (req, res) => res.render("success", { user: userProfile }));

app.get("/error", (req, res) => {
  const message = req.query.message || "An error occurred";
  res.render("error", { message });
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  (req, res, next) => {
    passport.authenticate("google", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.redirect(`/error?message=${encodeURIComponent(info.message)}`);
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.redirect("/success");
      });
    })(req, res, next);
  }
);

app.get("/chat", ensureAuthenticated, (req, res) => {
  res.render("chat");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("App listening on port " + port));
