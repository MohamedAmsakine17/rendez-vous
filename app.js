require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");

const { ensureAuthenticated } = require("./config/auth");

require("./config/passport")(passport);

const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "admin_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables for flash messages
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

const Booking = require("./models/Booking");

const adminUser = {
  username: "admin",
  password: bcrypt.hashSync(process.env.ADMIN_PWD, 10), // Hash the password for security
};

function isAdmin(req, res, next) {
  if (req.session.admin) {
    return next();
  }
  res.redirect("/admin/login");
}

// Routes
app.get("/", (req, res) => {
  res.render("index"); // Homepage
});

app.get("/booking", ensureAuthenticated, (req, res) => {
  res.render("booking"); // Booking page
});

app.post("/booking", ensureAuthenticated, async (req, res) => {
  const { firstname, lastname, email, phone, date, message, time } = req.body;
  try {
    const newBooking = new Booking({
      firstname,
      lastname,
      email,
      phone,
      date,
      time,
      message,
      user: req.user._id,
    });
    await newBooking.save();

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // Use your email service (e.g., Gmail, Outlook, etc.)
      auth: {
        user: "mohamedamsakine17@gmail.com", // Replace with your email
        pass: process.env.PASSWORD, // Replace with your email password or app password if using Gmail
      },
    });

    // Compose email options
    const mailOptions = {
      from: "M2A@Comptable.ma", // Sender email
      to: email, // Client email
      subject: "Confirmation de votre rendez-vous",
      text: `Bonjour ${lastname},\n\nVotre rendez-vous avec notre comptable agréé est confirmé pour le ${date}.\n\nMessage: ${message}\n\nNous sommes impatients de vous rencontrer.\n\nCordialement,\nVotre Comptable Agréé`,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        return res
          .status(500)
          .send(
            "Une erreur est survenue lors de l'envoi de l'email. Veuillez réessayer."
          );
      } else {
        console.log("Email sent: " + info.response);
        // Redirect to confirmation page after the email is sent
        res.redirect("/confirmation");
      }
    });

    // res.redirect("/confirmation");
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send(
        "An error occurred while processing your request. Please try again later."
      );
  }
});

app.get("/confirmation", (req, res) => {
  res.render("confirmation"); // Confirmation page
});

app.get("/admin/login", (req, res) => {
  res.render("admin-login"); // This should point to the login form
});

app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === adminUser.username &&
    bcrypt.compareSync(password, adminUser.password)
  ) {
    req.session.admin = true; // Set session if login is successful
    res.redirect("/admin/dashboard");
  } else {
    res.send("Incorrect username or password");
  }
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});

app.get("/admin/dashboard", isAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find(); // Retrieve all bookings
    res.render("admin-dashboard", { bookings }); // Render admin dashboard with bookings
  } catch (err) {
    res.status(500).send("Error retrieving bookings");
  }
});

app.post("/admin/delete-booking/:id", isAdmin, async (req, res) => {
  try {
    // Delete the booking by ID
    await Booking.findByIdAndDelete(req.params.id);
    // Redirect back to the dashboard
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.status(500).send("Error deleting the booking");
  }
});

const User = require("./models/User");

app.get("/admin/users", isAdmin, async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.render("adminUsers", { users });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error while fetching users");
  }
});

// Use Routes
app.use("/", authRoutes);
app.use("/", dashboardRoutes);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
