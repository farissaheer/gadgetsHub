const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userdata",
      required: true,
    },
    products: [
      {
        productid: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "productDetail",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { versionKey: false }
);

module.exports = mongoose.model("cartDetails", cartSchema);
