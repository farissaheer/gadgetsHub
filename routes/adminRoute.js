const express = require("express");
const adminRoute = express();
const path = require("path");
const multer = require("multer");

const adminControl = require("../controllers/adminController");
const adminAuthenticate = require("../middlewares/adminAuthentication");
const orderControl = require("../controllers/orderController");

adminRoute.set("view engine", "ejs");
adminRoute.set("views", "views/admin");

adminRoute.use(express.static("public"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});

const uploads = multer({ storage: storage });

adminRoute.get("/", adminAuthenticate.isLogout, adminControl.adminLogin);
adminRoute.get("/adminHome",adminAuthenticate.isLogin, adminControl.adminHome);
adminRoute.post("/home", adminControl.adminVerify);

adminRoute.get("/chartData", adminControl.fetchChartData);
adminRoute.get("/chartData2", adminControl.chartData2);

adminRoute.get("/userList", adminAuthenticate.isLogin, adminControl.userList);
adminRoute.get("/blockUser", adminAuthenticate.isLogin, adminControl.blockUser);
adminRoute.get("/unblockUser", adminAuthenticate.isLogin, adminControl.unblockUser);

adminRoute.get("/categoryPage", adminAuthenticate.isLogin, adminControl.categoryPage);
adminRoute.post("/createCategory", adminAuthenticate.isLogin, adminControl.createCategory);
adminRoute.post("/categoryListUnlist", adminAuthenticate.isLogin, adminControl.listUnlistCategory);

adminRoute.get("/addProduct", adminAuthenticate.isLogin, adminControl.addProduct);
adminRoute.post("/addProduct", adminAuthenticate.isLogin, uploads.array("productimage"), adminControl.addProductDetails);
adminRoute.get("/productList", adminAuthenticate.isLogin, adminControl.productList);
adminRoute.get("/deleteProduct", adminAuthenticate.isLogin, adminControl.deleteProduct);
adminRoute.get("/activateProduct", adminAuthenticate.isLogin, adminControl.activateProduct);
adminRoute.get("/editProduct", adminAuthenticate.isLogin, adminControl.editProduct);
adminRoute.post("/deleteimage", adminAuthenticate.isLogin, adminControl.deleteimage);
adminRoute.post('/updateProduct', adminAuthenticate.isLogin, uploads.array("productimage"), adminControl.updateProduct);
// --------------------------- Order -----------------------------------
adminRoute.get('/order', adminAuthenticate.isLogin, adminControl.order);
adminRoute.get('/orderdetails', adminAuthenticate.isLogin, adminControl.orderDetails);
adminRoute.post("/statusupdate", adminAuthenticate.isLogin, adminControl.updateStatus);
adminRoute.post("/returnapprove", adminAuthenticate.isLogin, orderControl.approveReturn);
// --------------------------- Coupon ------------------------------------
adminRoute.get("/couponList", adminAuthenticate.isLogin, adminControl.listCoupon);
adminRoute.get("/addCoupon", adminAuthenticate.isLogin, adminControl.addCouponPage);
adminRoute.post("/addCoupon", adminAuthenticate.isLogin, adminControl.addCoupon);
adminRoute.get("/editcouponpage", adminAuthenticate.isLogin, adminControl.editCouponPage);
// ------------------------------- Offers ------------------------------------
adminRoute.get("/productOffer", adminAuthenticate.isLogin, adminControl.productoffers);
adminRoute.post("/productOffer", adminAuthenticate.isLogin, adminControl.addProductOffer);
adminRoute.post("/removeProductOffer", adminAuthenticate.isLogin, adminControl.removeProductOffer);
// --------------------------- Logout ------------------------------------
adminRoute.get('/logout', adminAuthenticate.isLogin, adminControl.adminLogout);

module.exports = adminRoute;
