const mongoose = require("mongoose");

const courtSlotSchema = new mongoose.Schema(
  {
    courtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Court",
      required: true,
    },
    date: {
      type: String, // String in YYYY-MM-DD format, or Date
      required: true,
    },
    startTime: {
      type: String, // e.g. "08:00"
      required: true,
    },
    endTime: {
      type: String, // e.g. "09:00"
      required: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CourtSlot", courtSlotSchema);
