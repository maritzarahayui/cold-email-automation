const express = require("express");
const passport = require("passport");
<<<<<<< HEAD
const { chatHandler, sendTextMailHandler, sendAttachmentsMailHandler } = require("./handler");
=======
const { chatHandler } = require("./handler");
>>>>>>> 3f7cb27ac2bd8c676aba6236643f2ddd1f9fab2d
const { ensureAuthenticated } = require("../middleware/middleware");
const { userProfile } = require("./passportConfig");

const router = express.Router();

router.get("/", (req, res) => {
  res.render("auth");
});

router.get("/success", (req, res) => {
  res.render("success", { user: req.user || userProfile });
});

router.get("/error", (req, res) => {
  const message = req.query.message || "An error occurred";
  res.render("error", { message });
});

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
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

router.get("/chat", ensureAuthenticated, (req, res) => {
  res.render("chat");
});

router.post("/chat", chatHandler);

<<<<<<< HEAD
// mail

router.post("/text-mail", sendTextMailHandler);
router.post("/attachments-mail", sendAttachmentsMailHandler);

=======
>>>>>>> 3f7cb27ac2bd8c676aba6236643f2ddd1f9fab2d
module.exports = router;