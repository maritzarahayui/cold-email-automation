const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

let userProfile;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth client ID or secret in environment variables.");
}

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "https://cold-email-automation-j6el7ykauq-et.a.run.app/auth/google/callback",
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

module.exports = passport;
module.exports.userProfile = userProfile;
