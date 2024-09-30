const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  phone: String,
  date: String,
  time: String,
  message: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
