const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");

// Registration Page
router.get("/register", (req, res) => res.render("register"));

// Register Handle
router.post("/register", (req, res) => {
  const { firstname, lastname, email, password, password2 } = req.body;
  let errors = [];

  // Check required fields
  if (!firstname || !lastname || !email || !password || !password2) {
    errors.push({ msg: "Please fill in all fields" });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      firstname,
      lastname,
      email,
      password,
      password2,
    });
  } else {
    // Check if email already exists
    User.findOne({ email: email }).then((user) => {
      if (user) {
        errors.push({ msg: "Email is already registered" });
        res.render("register", {
          errors,
          firstname,
          lastname,
          email,
          password,
          password2,
        });
      } else {
        const newUser = new User({ firstname, lastname, email, password });

        // Save user
        newUser
          .save()
          .then((user) => {
            req.flash("success_msg", "You are now registered and can log in");
            res.redirect("/login");
          })
          .catch((err) => console.log(err));
      }
    });
  }
});

// Login Page
router.get("/login", (req, res) => res.render("login"));

// Login Handle
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true,
  })(req, res, next);
});

// Logout Handle
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success_msg", "You are logged out");
    res.redirect("/login");
  });
});

module.exports = router;
