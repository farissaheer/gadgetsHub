const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    usedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userDatas",
      },
    ],
    couponCode: {
      type: String,
      required: true,
    },
    couponAmount: {
      type: Number,
      required: true,
    },
    expireDate: {
      type: Date,
      required: true,
    },
    couponDescription: {
      type: String,
      required: true,
    },
    minimumAmount: {
      type: Number,
      required: true,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("coupondata", couponSchema);
