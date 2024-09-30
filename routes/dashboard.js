const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");

const Booking = require("../models/Booking");

// Dashboard
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  try {
    // Fetch only the bookings for the logged-in user
    const userBookings = await Booking.find({ user: req.user._id });

    // Render the dashboard and pass the user's bookings
    res.render("dashboard", { bookings: userBookings, user: req.user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error while fetching bookings");
  }
});

module.exports = router;
