const mongoose = require("mongoose");

async function connectToDatabase() {
  mongoose
    .connect(process.env.dbconnect, { useNewUrlParser: true })
    .then(() => {
      console.log("MongoDB Connected");
    })
    .catch(() => {
      console.log("Failed to connect MongoDB");
    });
}

module.exports = connectToDatabase;
