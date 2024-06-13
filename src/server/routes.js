const express = require("express");
const passport = require("passport");
const { chatHandler, sendTextMailHandler, sendAttachmentsMailHandler } = require("./handler");
const { ensureAuthenticated } = require("../middleware/middleware");
const { userProfile } = require("./passportConfig");
const { getAllSentEmails, getEmailById } = require('./handler');

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
        return res.redirect("/mail");
      });
    })(req, res, next);
  }
);

router.get("/mail", ensureAuthenticated, (req, res) => {
  res.render("email-compose");
});

router.get("/history", ensureAuthenticated, getAllSentEmails);
router.get("/detail/:id", ensureAuthenticated, getEmailById);

router.post("/mail", chatHandler);
router.post("/text-mail", sendTextMailHandler);
router.post("/attachments-mail", sendAttachmentsMailHandler);

module.exports = router;

