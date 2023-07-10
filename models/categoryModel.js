const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    categoryDescription: {
      type: String,
      required: true,
    },
    categorylower: {
      type: String,
      required: true,
    },
    list: {
      type: Number,
      required: true,
      default: 1,
    },
    isActive: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("categoryDetail", categorySchema);
