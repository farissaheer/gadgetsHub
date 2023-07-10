const express = require("express");
const userRoute = express();

const userControl = require("../controllers/userController");
const cartControl = require("../controllers/cartController");
const addressControl = require('../controllers/addressController');
const orderControl = require("../controllers/orderController");
const wishlistControl = require("../controllers/wishlistController");
const userAuthenticate = require("../middlewares/userAuthentication");


userRoute.set("views", "views/user");


userRoute.get("/sample",(req,res)=>{
    res.render("sample")
})
userRoute.get("/", userControl.homePage);

userRoute.get("/login", userControl.loginPage);
userRoute.post("/userlogin", userControl.loginVerify);
// -------------- Forgot Password -------------------------
userRoute.get("/forgotpassword", userControl.forgotPage);
userRoute.post("/forgotPassword", userControl.forgotPassword);
userRoute.post("/verifyOTPFP", userControl.FPOTPVerify);
userRoute.post("/resetPassword", userControl.resetPassword);
// -------------- OTP Login -------------------------------
userRoute.get("/otplogin", userControl.otpLogin);
userRoute.post("/otprequest", userControl.otpRequest);
userRoute.post("/otpverify", userControl.otpVerify);

userRoute.get("/logout", userControl.logoutUser);

userRoute.get("/signup", userControl.signupPage);
userRoute.post("/signupOTPRequest", userControl.signupOTP);
userRoute.post("/verifyOTPSignUP", userControl.OTPVerifySignUP);
userRoute.post("/signupPage", userControl.verifySignUp);
userRoute.post("/validateReferal", userControl.validateReferal);
// ------------------- User Dashboard -------------------
userRoute.get("/profile", userAuthenticate.isLogin, userAuthenticate.isBlocked, userControl.profile);
userRoute.get("/editProfile", userAuthenticate.isLogin, userAuthenticate.isBlocked, userControl.editPage);
userRoute.post("/editProfile", userAuthenticate.isLogin, userAuthenticate.isBlocked, userControl.editProfile);
userRoute.get("/changePassword", userAuthenticate.isLogin, userAuthenticate.isBlocked, userControl.passwordPage);
userRoute.post("/changePassword", userAuthenticate.isLogin, userAuthenticate.isBlocked, userControl.editPassword);
userRoute.get("/orders", userAuthenticate.isLogin, userAuthenticate.isBlocked, userControl.orders);
userRoute.post("/cancelorder", userAuthenticate.isLogin, userAuthenticate.isBlocked, orderControl.cancelOrder);
userRoute.post("/returnorder", userAuthenticate.isLogin, userAuthenticate.isBlocked, orderControl.returnRequest);
userRoute.get("/wallet", userAuthenticate.isLogin, userAuthenticate.isBlocked, userControl.wallet);
// -------------------- Address ------------------------
userRoute.get("/addresses", userAuthenticate.isLogin, userAuthenticate.isBlocked, addressControl.load);
userRoute.get("/addAddress", userAuthenticate.isLogin, userAuthenticate.isBlocked, addressControl.addPage);
userRoute.post("/addAddress", userAuthenticate.isLogin, userAuthenticate.isBlocked, addressControl.add);
userRoute.get("/editAddressPage", userAuthenticate.isLogin, userAuthenticate.isBlocked, addressControl.editAddressPage);
userRoute.post("/editAddress", userAuthenticate.isLogin, userAuthenticate.isBlocked, addressControl.editAddress);
userRoute.post("/deleteAddress", userAuthenticate.isLogin, userAuthenticate.isBlocked, addressControl.delete);

userRoute.get("/productHome", userControl.mobileList);
userRoute.get("/productView", userControl.productView);
// ------------------------ Wishlist -----------------------------
userRoute.get("/wishlist", userAuthenticate.isLogin, userAuthenticate.isBlocked, wishlistControl.load);
userRoute.post("/addToWishlist", userAuthenticate.isLogin, userAuthenticate.isBlocked, wishlistControl.add);
userRoute.get("/removeWishlist", userAuthenticate.isLogin, userAuthenticate.isBlocked, wishlistControl.remove);
// ------------------- Cart ---------------------------
userRoute.get("/cart",userAuthenticate.isLogin, userAuthenticate.isBlocked, cartControl.load);
userRoute.get('/addToCart',userAuthenticate.isLogin, userAuthenticate.isBlocked, cartControl.add)
userRoute.get('/deleteProCart', userAuthenticate.isLogin, userAuthenticate.isBlocked, cartControl.delete);
userRoute.post('/increment', userAuthenticate.isLogin, userAuthenticate.isBlocked, cartControl.increment);
userRoute.post('/decrement', userAuthenticate.isLogin, userAuthenticate.isBlocked, cartControl.decrement);
// -------------------- Checkout-----------------------
userRoute.get('/checkout', userAuthenticate.isLogin, userAuthenticate.isBlocked, cartControl.checkout);
userRoute.post("/checkvalidcoupon", userAuthenticate.isLogin, userAuthenticate.isBlocked, cartControl.validateCoupon);
// ---------------------- Order --------------------------------
userRoute.post('/razorpay',userAuthenticate.isLogin, userAuthenticate.isBlocked, orderControl.createOrder);
userRoute.post('/placeOrder', userAuthenticate.isLogin, userAuthenticate.isBlocked, orderControl.place);
userRoute.get('/orderDetails', userAuthenticate.isLogin, userAuthenticate.isBlocked, orderControl.details);

userRoute.get("/sample", (req,res)=>{
    res.render("newproduct")
})


module.exports = userRoute;
