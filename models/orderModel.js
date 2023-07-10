const mongoose = require("mongoose");

const orderSchema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userDatas",
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
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    couponCode: {
      type: String,
      default: null,
    },
    couponAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Pending",
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "address",
      required: true,
    },
    deliveredDate: {
      type: Date,
      default: null,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      default: "Unpaid",
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("orderdetail", orderSchema);
