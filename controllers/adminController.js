const adminCollection = require("../models/userModel");
const categoryCollection = require("../models/categoryModel");
const productCollection = require("../models/productModel");
const orderCollection = require("../models/orderModel");
const moment = require("moment");
const couponModel = require("../models/couponModel");

const admin = {
  // Admin Login
  adminLogin: async (req, res) => {
    try {
      const title = req.flash("title");
      res.render("login", { messageAlert: title[0] || "" });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
  // Admin Home
  adminHome: async (req, res) => {
    const { adminName } = req.session;
    try {
      const orders = await orderCollection
        .find()
        .populate("products.productid")
        .populate("userid")
        .exec();
      const products = await productCollection.find();
      const productCount = products.length;
      res.render("home", { adminName, orders, productCount });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
  // Admin Verify
  adminVerify: async (req, res) => {
    const { email, password } = req.body;
    try {
      const adminData = await adminCollection.findOne({
        $and: [{ email }, { isAdmin: 1 }],
      });
      if (adminData) {
        if (adminData.password === password) {
          req.session.adminName = adminData.name;
          res.redirect("/admin/adminHome");
        } else {
          req.flash("title", "Incorrect Pasword");
          res.redirect("/admin");
        }
      } else {
        req.flash("title", "Incorrect Username");
        res.redirect("/admin");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  fetchChartData: async (req, res) => {
    try {
      const salesData = await orderCollection.aggregate([
        { $match: {} },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $toDate: "$orderDate" },
              },
            },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: -1 } },
        { $project: { _id: 0, date: "$_id", totalRevenue: 1 } },
        { $limit: 10 },
      ]);
      console.log(salesData);
      const productData = await orderCollection.aggregate([
        { $match: { status: "Delivered" } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: { $toDate: "$orderDate" },
              },
            },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: -1 } },
        { $project: { _id: 0, date: "$_id", totalRevenue: 1 } },
        { $limit: 4 },
      ]);

      // console.log(salesData);

      const data = [];
      const date = [];
      for (const totalRevenue of salesData) {
        data.push(totalRevenue.totalRevenue);
      }

      for (const item of salesData) {
        date.push(item.date);
      }

      data.reverse();
      date.reverse();

      res.status(200).send({ data: data, date: date });
    } catch (error) {
      console.log(error.message);
    }
  },

  chartData2: async (req, res) => {
    try {
      const salesData = await orderCollection.aggregate([
        { $match: {} },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: { $toDate: "$orderDate" },
              },
            },
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: -1 } },
        { $project: { _id: 0, date: "$_id", totalRevenue: 1 } },
        { $limit: 7 },
      ]);
      console.log(salesData);

      const data = [];
      const date = [];

      for (const totalRevenue of salesData) {
        data.push(totalRevenue.totalRevenue);
        const monthName = new Date(totalRevenue.date + "-01").toLocaleString(
          "en-US",
          { month: "long" }
        );
        date.push(monthName);
      }
      data.reverse();
      date.reverse();
      res.status(200).json({ data: data, date: date });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  userList: async (req, res) => {
    const { adminName } = req.session;
    try {
      const userData = await adminCollection.find({ isAdmin: { $ne: 1 } });
      res.render("userlist", { adminName, userData });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  blockUser: async (req, res) => {
    const { id } = req.query;
    try {
      const userData = await adminCollection.findByIdAndUpdate(id, {
        $set: { isBlocked: true },
      });
      if (userData) {
        res.send({ message: "User Blocked Successfully" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
  unblockUser: async (req, res) => {
    const { id } = req.query;
    try {
      const userData = await adminCollection.findByIdAndUpdate(id, {
        $set: { isBlocked: false },
      });
      if (userData) {
        res.send({ message: "User Unblocked Successfully" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  categoryPage: async (req, res) => {
    const { adminName } = req.session;
    try {
      let title = req.flash("title");
      const categories = await categoryCollection.find({});
      res.render("categories", {
        adminName,
        categories,
        messageAlert: title[0],
      });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  createCategory: async (req, res) => {
    const { categoryName, categoryDescription } = req.body;
    try {
      let categorylower = categoryName.toLowerCase().replace(/\s/g, "");
      const existCategory = await categoryCollection.findOne({ categorylower });
      if (existCategory) {
        req.flash("title", "Category Already Exist");
        res.redirect("/admin/categoryPage");
      } else {
        const category = new categoryCollection({
          categoryName,
          categorylower,
          categoryDescription,
        });
        await category.save();
        res.redirect("/admin/categoryPage");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  listUnlistCategory: async (req, res) => {
    const { id, text } = req.body;
    try {
      let list = text == "List" ? 1 : 0;
      const done = await categoryCollection.findByIdAndUpdate(id, {
        $set: { list },
      });
      if (done) {
        res.send({ message: "1", status: "Done" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  addProduct: async (req, res) => {
    const { adminName } = req.session;
    try {
      const categories = await categoryCollection.find({ list: 1 });
      if (categories.length) {
        res.render("addproduct", { adminName, categories });
      } else {
        req.flash("title", "Add Atleast One Category");
        res.redirect("/admin/categoryPage");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  addProductDetails: async (req, res) => {
    const {
      productname,
      productcategory,
      productbrand,
      productquantity,
      productprice,
      productdescription,
    } = req.body;
    try {
      const productimages = [];
      if (req.files) {
        for (let i = 0; i < req.files.length; i++) {
          productimages.push(req.files[i].filename);
        }
      }
      const newproduct = new productCollection({
        productname,
        productcategory,
        productbrand,
        productquantity,
        productprice,
        productdescription,
        productimages,
      });
      await newproduct.save();

      // Send a success response
      res.status(200).redirect("/admin/productList");
    } catch (error) {
      // Handle the error
      res.status(500).send({ error: "Internal Server Error" });
    }
  },

  productList: async (req, res) => {
    const { adminName } = req.session;
    try {
      const products = await productCollection.find({});
      res.render("productslist", { adminName, products });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  deleteProduct: async (req, res) => {
    const { id } = req.query;
    try {
      await productCollection.findByIdAndUpdate(id, { $set: { isActive: 0 } });
      res.send({ message: 1 });
      // res.redirect("/admin/productList");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  activateProduct: async (req, res) => {
    const { id } = req.query;
    try {
      await productCollection.findByIdAndUpdate(id, { $set: { isActive: 1 } });
      res.send({ message: 1 });
      // res.redirect("/admin/productList");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  editProduct: async (req, res) => {
    const { id } = req.query;
    const { adminName } = req.session;
    try {
      const productData = await productCollection.findById(id);
      res.render("editproduct", { adminName, productData });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  deleteimage: async (req, res) => {
    const { imageID } = req.body;
    try {
      const prodetails = await productCollection.findOne({
        productimages: imageID,
      });
      await productCollection.updateOne(
        { _id: prodetails._id },
        { $pull: { productimages: imageID } }
      );
      res.send({ message: "1" });
    } catch (error) {
      res.status(404).render("error", { error: error.message });
    }
  },

  updateProduct: async (req, res) => {
    const {
      id,
      productname,
      productcategory,
      productbrand,
      productquantity,
      productprice,
      productdescription,
    } = req.body;
    try {
      const arrImages = [];
      let dataobj = {
        productname,
        productcategory,
        productbrand,
        productquantity,
        productprice,
        productdescription,
        productimages: [],
      };
      const product = await productCollection.findById(id);
      dataobj.productimages.push(...product.productimages);
      if (req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          arrImages[i] = req.files[i].filename;
        }
        dataobj.productimages.push(...arrImages);
      }
      await productCollection.findByIdAndUpdate(
        id,
        { $set: dataobj },
        { new: true }
      );
      res.redirect("/admin/productList");
    } catch (error) {
      res.render("error", { error: error.message });
      res.status(500).send({ success: false, msg: error.message });
    }
  },

  order: async (req, res) => {
    const { adminName } = req.session;
    try {
      const orders = await orderCollection.find({}).populate("userid").exec();
      res.render("order", { adminName, orders });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  orderDetails: async (req, res) => {
    const { id } = req.query;
    const { adminName } = req.session;
    try {
      const orderDetail = await orderCollection
        .findById(id)
        .populate("products.productid")
        .populate("address")
        .populate("userid")
        .exec();
      res.render("orderDetails", { adminName, orderDetail });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  updateStatus: async (req, res) => {
    const { orderid, status } = req.body;
    try {
      const order = await orderCollection.findOne({ _id: orderid });
      let order_update;
      if (status == "Delivered" && order.paymentMethod == "COD") {
        order_update = await orderCollection.findByIdAndUpdate(orderid, {
          $set: { status, paymentStatus: "Paid" },
        });
      } else {
        order_update = await orderCollection.findByIdAndUpdate(
          { _id: orderid },
          { $set: { status: status } }
        );
      }

      if (status == "Delivered") {
        const deliveredDate = new Date();
        await orderCollection.findByIdAndUpdate(
          orderid,
          { deliveredDate },
          { new: true }
        );
        // const completionTime = moment(deliveredDate).add(1, "minute");
        const completionTime = moment(deliveredDate).add(7, "days");
        setTimeout(async () => {
          const updatedOrder = await orderCollection.findById(orderid);
          if (
            updatedOrder &&
            updatedOrder.status !== "Completed" &&
            updatedOrder.status !== "Return Requested" &&
            updatedOrder.status !== "Returned"
          ) {
            updatedOrder.status = "Completed";
            await updatedOrder.save();
          }
        }, completionTime.diff(moment()));
      }

      if (order_update) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  listCoupon: async (req, res) => {
    const { adminName } = req.session;
    try {
      let coupons = await couponModel.find({});
      res.render("couponList", { coupons, adminName });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  addCouponPage: async (req, res) => {
    const { adminName } = req.session;
    try {
      res.render("addCoupon", { adminName });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  addCoupon: async (req, res) => {
    const {
      couponCode,
      couponAmount,
      expireDate,
      couponDescription,
      minimumAmount,
    } = req.body;
    try {
      const coupon = new couponModel({
        couponCode,
        couponAmount,
        expireDate,
        couponDescription,
        minimumAmount,
      });
      coupon.save();
      res.redirect("/admin/couponList");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  editCouponPage: async (req, res) => {
    const { id } = req.query;
    const { adminName } = req.session;
    try {
      const coupon = await couponModel.findOne({ _id: id });
      res.render("editCoupon", { adminName, coupon });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  editCoupon: async (req, res) => {
    const {
      id,
      couponCode,
      couponAmount,
      expireDate,
      couponDescription,
      minimumAmount,
    } = req.body;
    try {
      await couponModel.findByIdAndUpdate(id, {
        $set: {
          couponCode,
          couponAmount,
          expireDate,
          couponDescription,
          minimumAmount,
        },
      });
      res.redirect("/admin/couponList");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  productoffers: async (req, res) => {
    try {
      const successmsg = req.flash("success")[0];
      const messageAlert = req.flash("title")[0];
      const products = await productCollection.find({ offerprice: { $eq: 0 } });
      const offered = await productCollection.find({ offerprice: { $ne: 0 } });
      res.render("productoffers", {
        products,
        offered,
        successmsg,
        messageAlert,
      });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  addProductOffer: async (req, res) => {
    const { productname, offerpercentage } = req.body;
    try {
      const product = await productCollection.findOne({ productname });
      if (product.offerpercentage == 0) {
        const offerprice = Math.floor(
          product.productprice - (product.productprice * offerpercentage) / 100
        );
        const productUpdate = await productCollection.updateOne(
          { productname },
          { $set: { offerpercentage, offerprice } }
        );
        req.flash("success", "Offer Applied");
        res.redirect("/admin/productoffer");
      } else {
        req.flash("title", "Product Already have an Offer");
        res.redirect("/admin/productOffer");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  removeProductOffer: async (req, res) => {
    const { id } = req.body;
    try {
      const product = await productCollection.findByIdAndUpdate(id, {
        $set: { offerpercentage: 0, offerprice: 0 },
      });
      if (product) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.send({ message: "0" });
    }
  },

  adminLogout: async (req, res) => {
    try {
      req.session.destroy();
      res.redirect("/admin");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
};

module.exports = admin;
