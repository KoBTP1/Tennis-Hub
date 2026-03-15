const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Court",
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourtSlot",
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed"],
      default: "unpaid",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["mock", ""],
      default: "",
    },
    paymentOrderId: {
      type: String,
      default: "",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index(
  { slotId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed", "completed"] },
    },
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
