const mongoose = require("mongoose");

const userInSchema = new mongoose.Schema(
  {
    productname: {
      type: String,
      required: true,
    },
    productcategory: {
      type: String,
      required: true,
    },
    productbrand: {
      type: String,
      required: true,
    },
    productquantity: {
      type: Number,
      required: true,
    },
    productprice: {
      type: Number,
      required: true,
    },
    productdescription: {
      type: String,
      required: true,
    },
    selected: {
      type: Number,
      required: true,
      default: 0,
    },
    productimages: {
      type: Array,
      required: true,
      validate: [arrayLimit, "maximum 5 product images allowed"],
    },
    isActive: {
      type: Number,
      required: true,
      default: 1,
    },
    offerpercentage: {
      type: Number,
      default: 0,
    },
    offerprice: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
  }
);

function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = mongoose.model("productDetail", userInSchema);
