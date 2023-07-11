const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const shortid = require("shortid");

const userCollection = require("../models/userModel");
const otpCollection = require("../models/otpModel");
const productCollection = require("../models/productModel");
const addressModel = require("../models/addressModel");
const cartCollection = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const wishlistCollection = require("../models/wishlistModel");
const walletModel = require("../models/walletModel");
const categoryModel = require("../models/categoryModel");

const productsPerPage = 8; // Number of product in one page

const user = {
  homePage: async (req, res) => {
    let { userData } = req.session;
    try {
      let title = req.flash("title");
      let mobile = await productCollection.find({
        productcategory: "Mobile Phone",
      });
      res.status(200).render("home", {
        userData,
        mobile,
        messageAlert: title[0],
        success: req.flash("success")[0],
      });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  loginPage: (req, res) => {
    try {
      res.render("login");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  profile: async (req, res) => {
    let { userData } = req.session;
    try {
      // console.log(shortid.generate());
      let userDetail = await userCollection.findOne({ _id: userData._id });
      if (userData) {
        const address = await addressModel.find({ userid: userData._id });
        const success = req.flash("success");
        const order = await orderModel
          .find({ userid: userData._id })
          .populate("products.productid")
          .populate("address")
          .exec();
        res.render("dashboard", {
          userData,
          success: success[0],
          userDetail: userDetail,
          addresses: address,
          orders: order,
        });
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  editPage: async (req, res) => {
    let { userData } = req.session;
    try {
      const user = await userCollection.findOne({ _id: userData._id });
      res.render("editProfile", { userData, user: user });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  editProfile: async (req, res) => {
    let { userData } = req.session;
    try {
      await userCollection.updateOne(
        { _id: userData._id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
          },
        }
      );
      req.flash("success", "User Details updated Successfully.");
      res.redirect("/profile");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  passwordPage: async (req, res) => {
    let { userData } = req.session;
    try {
      let title = req.flash("title");
      res.render("editPassword", { userData, messageAlert: title[0] });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  editPassword: async (req, res) => {
    let { userData } = req.session;
    let { currentpassword, password } = req.body;
    try {
      let user = await userCollection.findById(userData._id);
      if (currentpassword === user.password) {
        await userCollection.findByIdAndUpdate(userData._id, {
          $set: { password },
        });
        req.flash("success", "Password updated Successfully.");
        res.redirect("/profile");
      } else {
        req.flash("title", "Password Incorrect");
        res.redirect("/changePassword");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  orders: async (req, res) => {
    let { userData } = req.session;
    try {
      const orders = await orderModel
        .find({ userid: userData._id })
        .populate("products.productid")
        .exec();
      res.render("order", { userData, orders });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  wallet: async (req, res) => {
    let { userData } = req.session;
    try {
      const wallet = await walletModel.findOne({ userid: userData._id });
      res.render("wallet", { userData, wallet: wallet });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  loginVerify: async (req, res) => {
    let { email, password } = req.body;
    try {
      const loginData = await userCollection.findOne({ email });
      if (loginData) {
        if (loginData.isVerified) {
          if (!loginData.isBlocked) {
            if (loginData.password === password) {
              let cartCount, wishlistCount;
              let cart = await cartCollection.findOne({
                userid: loginData._id,
              });
              if (cart) {
                cartCount = cart.products.length;
              } else cartCount = 0;

              let wishlist = await wishlistCollection.findOne({
                userid: loginData._id,
              });
              if (wishlist) {
                wishlistCount = wishlist.products.length;
              } else wishlistCount = 0;

              req.session.userData = {
                _id: loginData._id,
                name: loginData.name,
                email: loginData.email,
                cartCount,
                wishlistCount,
              };
              res.redirect("/");
            } else {
              res.render("login", { messageAlert: "Incorrect Password" });
            }
          } else {
            res.render("login", { messageAlert: "Account Blocked" });
          }
        } else {
          res.render("login", { messageAlert: "Verify your Email" });
        }
      } else {
        res.render("login", { messageAlert: "Incorrect Username" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  otpLogin: async (req, res) => {
    try {
      const title = req.flash("title");
      res.render("otpLogin", { messageAlert: title[0] || "" });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  otpRequest: async (req, res) => {
    let { email } = req.body;
    try {
      const userData = await userCollection.findOne({ email });
      if (userData) {
        if (!userData.isBlocked) {
          await otpCollection.deleteMany({ email });
          const OTP = otpRequest();
          console.log(OTP);
          const transporter = transportCreater();
          let mailOptions = mailOpt(userData, OTP);
          transporter.sendMail(mailOptions, function (error, info) {});
          const Otp = new otpCollection({ email, otp: OTP });
          const salt = await bcrypt.genSalt(10);
          Otp.otp = await bcrypt.hash(Otp.otp, salt);
          await Otp.save();
          res.render("provideOtp", { email });
        } else {
          req.flash("title", "Account Blocked");
          res.redirect("/otplogin");
        }
      } else {
        req.flash("title", "Incorrect Email");
        res.redirect("/otplogin");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  otpVerify: async (req, res) => {
    let { email, otp } = req.body;
    try {
      const otpData = await otpCollection.findOne({ email });
      if (otpData) {
        const validUser = await bcrypt.compare(otp, otpData.otp);
        if (validUser) {
          let cartCount, wishlistCount;
          const userData = await userCollection.findOne({ email });
          let cart = await cartCollection.findOne({
            userid: userData._id,
          });
          if (cart) {
            cartCount = cart.products.length;
          } else cartCount = 0;

          let wishlist = await wishlistCollection.findOne({
            userid: userData._id,
          });
          if (wishlist) {
            wishlistCount = wishlist.products.length;
          } else wishlistCount = 0;
          req.session.userData = {
            _id: userData._id,
            name: userData.name,
            email: userData.email,
            wishlistCount,
            cartCount,
          };
          await otpCollection.deleteMany({ email });
          res.redirect("/");
        } else {
          res.render("provideOtp", {
            email,
            messageAlert: "Incorrect OTP",
          });
        }
      } else {
        req.flash("title", "OTP Expired");
        res.redirect("/otplogin");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  signupPage: async (req, res) => {
    try {
      res.render("signupemail", { messageAlert: req.flash("title")[0] });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  signupOTP: async (req, res) => {
    const { email } = req.body;
    try {
      const userData = await userCollection.findOne({ email });
      if (!userData) {
        const otp = otpRequest();
        console.log(otp);
        await otpCollection.deleteMany({ email });
        const transporter = transportCreater();
        let mailOptions = {
          from: "GadgetsHub<mohammedfaris105@gmail.com>",
          to: email,
          subject: "GadgetsHub OTP VERIFICATION",
          text:
            "Hi,\nWelcome to GadgetsHub\n\nPlease Enter this OTP for Login: " +
            otp,
        };
        transporter.sendMail(mailOptions, function (error, info) {});
        const Otp = new otpCollection({ email, otp });
        const salt = await bcrypt.genSalt(10);
        Otp.otp = await bcrypt.hash(Otp.otp, salt);
        await Otp.save();
        res.render("signupOTPVerify", {
          email,
          success: "OTP Send Successfully",
        });
      } else {
        req.flash("title", "Already Registered");
        res.redirect("/signup");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  OTPVerifySignUP: async (req, res) => {
    const { email, otp } = req.body;
    try {
      const otpData = await otpCollection.findOne({ email });
      if (otpData) {
        const validUser = await bcrypt.compare(otp, otpData.otp);
        if (validUser) {
          await otpCollection.deleteMany({ email });
          res.render("signup", { email });
        } else {
          res.render("signupOTPVerify", {
            email: otpData.email,
            messageAlert: "Incorrect OTP",
          });
        }
      } else {
        req.flash("title", "OTP Expired");
        res.redirect("/signup");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
  // ----------------- Forgot Password ----------------------
  forgotPage: async (req, res) => {
    try {
      let title = req.flash("title");
      res.render("forgotPassword", { messageAlert: title[0] || "" });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    try {
      const userData = await userCollection.findOne({ email });
      if (userData) {
        if (!userData.isBlocked) {
          await otpCollection.deleteMany({ email });
          const otp = otpRequest();
          console.log(otp);
          const transporter = transportCreater();
          let mailOptions = mailOpt(userData, otp);
          transporter.sendMail(mailOptions, function (error, info) {});
          const Otp = new otpCollection({ email, otp });
          const salt = await bcrypt.genSalt(10);
          Otp.otp = await bcrypt.hash(Otp.otp, salt);
          const result = await Otp.save();
          res.render("OTPVerifyFP", {
            email,
            success: "OTP Send Successfully",
          });
        } else {
          req.flash("title", "Account Blocked");
          res.redirect("/forgotpassword");
        }
      } else {
        req.flash("title", "Incorrect Email");
        res.redirect("/forgotpassword");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  FPOTPVerify: async (req, res) => {
    const { email, otp } = req.body;
    try {
      const otpData = await otpCollection.findOne({ email });
      if (otpData) {
        const validUser = await bcrypt.compare(otp, otpData.otp);
        if (validUser) {
          await otpCollection.deleteMany({ email });
          res.render("resetPassword", { email });
        } else {
          res.render("OTPVerifyFP", {
            messageAlert: "Incorrect OTP",
            email,
          });
        }
      } else {
        req.flash("title", "OTP Expired");
        res.redirect("/forgotpassword");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    const { password, email } = req.body;
    try {
      await userCollection.updateOne({ email }, { $set: { password } });
      req.flash("success", "Password Successfully Changed");
      res.redirect("/");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  verifySignUp: async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
      const userData = new userCollection({ name, email, phone, password });
      await userData.save();
      res.render("referal", { email });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  validateReferal: async (req, res) => {
    const { email, referalCode } = req.body;
    try {
      const referer = await userCollection.findOne({ referalCode });
      if (referer) {
        const newUser = await userCollection.findOne({ email });
        let wallet = new walletModel({
          userid: newUser._id,
          balance: 500,
          orderDetails: [{ amount: 500, type: "Added" }],
        });
        await wallet.save();
        const refererWallet = await walletModel.findOne({
          userid: referer._id,
        });
        if (refererWallet) {
          await walletModel.findByIdAndUpdate(refererWallet._id, {
            $inc: { balance: 500 },
            $push: { orderDetails: { amount: 500, type: "Added" } },
          });
        } else {
          let wallet = new walletModel({
            userid: referer._id,
            balance: 500,
            orderDetails: [{ amount: 500, type: "Added" }],
          });
          await wallet.save();
        }
        req.flash("success", "Referal code applied, ₹500 added to wallet.");
        res.redirect("/");
      } else {
        let messageAlert = "Invalid Referal Code";
        res.render("referal", { email, messageAlert });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  logoutUser: async (req, res) => {
    try {
      req.session.destroy();
      res.redirect("/");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  mobileList: async (req, res) => {
    let { userData } = req.session;
    const { page } = req.query;
    try {
      const currentPage = parseInt(page) || 1;
      const totalProducts = await productCollection.countDocuments({});
      const categories = await categoryModel.find();
      const products = await productCollection
        .find({})
        .skip((currentPage - 1) * productsPerPage)
        .limit(productsPerPage)
        .exec();
      const title = req.flash("title");
      let success = req.flash("success");
      let totalPages = Math.ceil(totalProducts / productsPerPage);
      res.render("productList", {
        categories,
        userData,
        products,
        totalPages,
        currentPage,
        success: success[0],
        messageAlert: title[0],
      });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  productView: async (req, res) => {
    let { userData } = req.session;
    try {
      const product = await productCollection.findById(req.query.id);
      let success = req.flash("success");
      res.render("product", { userData, product, success: success[0] });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
};

module.exports = user;

function otpRequest() {
  let otp = otpGenerator.generate(4, {
    digits: true,
    alphabets: false,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
}

function transportCreater() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "mohammedfaris105@gmail.com",
      pass: "ujieqxjrifjnoqln",
    },
  });
}

function mailOpt(userDetail, OTP) {
  let mailFormat = {
    from: "GadgetsHub<mohammedfaris105@gmail.com>",
    to: userDetail.email,
    subject: "GadgetsHub OTP VERIFICATION",
    text:
      "Hi " +
      userDetail.name +
      ",\nWelcome to GadgetsHub\n\nPlease Enter this OTP for Login: " +
      OTP,
  };
  return mailFormat;
}
