function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/error?message=You need to log in to access this page");
}

module.exports = { ensureAuthenticated };