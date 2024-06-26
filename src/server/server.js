require("dotenv").config();
const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const passport = require("./passportConfig");
const routes = require("./routes");
const { ensureAuthenticated } = require("../middleware/middleware");

const app = express();
app.use(express.static(path.join(__dirname, '../../public')));

// Set up the view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../../views"));

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRET",
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Body parser for OpenAI
app.use(bodyParser.json());

// Use the routes defined in routes.js
app.use("/", routes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("App listening on port " + port));
