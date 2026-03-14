const mongoose = require("mongoose");

const courtSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    ownerName: {
      type: String,
      default: "",
      trim: true,
    },
    pricePerHour: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "suspended", "rejected"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Court", courtSchema);
