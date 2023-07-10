require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3030;
const path = require("path");
const nocache = require("nocache");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const session = require("express-session");

const connectDB = require("./helper/connectDB");
const userRouter = require("./routes/userRoute");
const adminRouter = require("./routes/adminRoute");

connectDB();
app.use(
  session({
    secret: "fiwafhiwfwhvuwvu9hvvvwv",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 43200000 },
    store: MongoStore.create({
      mongoUrl: process.env.dbconnect,
    }),
  })
);

app.use(flash());
app.use(nocache());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.use("/", userRouter);
app.use("/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`Server sarted: http://localhost:${PORT}`);
});
