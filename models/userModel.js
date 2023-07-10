const mongoose = require("mongoose");

const LoginSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Number,
      required: true,
      default: 0,
    },
    isBlocked: {
      type: Number,
      required: true,
      default: 0,
    },
    isVerified: {
      type: Number,
      required: true,
      default: 1,
    },
    referalCode: {
      type: String,
      default: "",
    },
    createdOn: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("userDatas", LoginSchema);
