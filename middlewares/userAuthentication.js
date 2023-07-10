const userModel = require("../models/userModel");

const userAuthenticate = {
  isLogin: async (req, res, next) => {
    try {
      if (req.session.userData) {
        next();
      } else {
        res.redirect("/login");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
  isLogout: async (req, res, next) => {
    try {
      if (req.session.userData) {
        res.redirect("/");
      } else {
        next();
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
  isBlocked: async (req, res, next) => {
    const { userData } = req.session;
    try {
      const user = await userModel.findById(userData._id);
      if (user.isBlocked) {
        req.session.destroy();
        res.render("home", { messageAlert: "User has been blocked" });
      } else {
        next();
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
};

module.exports = userAuthenticate;
