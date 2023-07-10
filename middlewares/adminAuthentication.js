const adminAuthenticate = {
  isLogin: async (req, res, next) => {
    try {
      if (req.session.adminName) {
        next();
      } else {
        res.redirect("/admin");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
  isLogout: async (req, res, next) => {
    try {
      if (req.session.adminName) {
        res.redirect("/admin/adminHome");
      } else {
        next();
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
};

module.exports = adminAuthenticate;
