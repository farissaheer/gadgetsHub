const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
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
      },
    ],
  },
  { versionKey: false }
);

module.exports = mongoose.model("wishlistdata", wishlistSchema);
