const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const Razorpay = require("razorpay");
const walletModel = require("../models/walletModel");
const couponModel = require("../models/couponModel");
const userModel = require("../models/userModel");

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const order = {
  place: async (req, res) => {
    const { userData } = req.session;
    const { address, totalAmount, paymentMethod, couponAmount, couponCode } =
      req.body;
    try {
      let stock = await checkStock(userData);
      if (stock) {
        const orderdetail = new orderModel({
          userid: userData._id,
          totalAmount,
          paymentMethod,
          address,
          couponAmount,
        });
        if (couponCode) orderdetail.couponCode == couponCode;
        const cart = await cartModel
          .findOne({ userid: userData._id })
          .populate("products.productid");
        if (paymentMethod != "COD") orderdetail.paymentStatus = "Paid";
        for (const product of cart.products) {
          const quantity = product.quantity;
          const productid = product.productid;
          const pro = await productModel.findById(productid);
          let price;
          if (pro.offerprice > 0) price = pro.offerprice;
          else price = pro.productprice;
          orderdetail.products.push({ productid, quantity, price });
          await productModel.findByIdAndUpdate(productid, {
            $inc: { productquantity: -quantity },
          });
        }
        const newOrder = await orderdetail.save();
        userData.cartCount = 0;
        if (paymentMethod == "Wallet") {
          await walletModel.updateOne(
            { userid: userData._id },
            {
              $inc: { balance: -newOrder.totalAmount },
              $push: {
                orderDetails: {
                  orderid: newOrder._id,
                  amount: newOrder.totalAmount,
                  type: "Used",
                },
              },
            },
            { new: true }
          );
        }
        const userDetail = await userModel.findById(userData._id);
        if (!userDetail.referalCode) {
          const userOrders = await orderModel.find({
            paymentMethod: { $ne: "COD" },
          });
          let orderCount = userOrders.length;
          const referalCode = "REFERAL" + userDetail.name;
          if (orderCount >= 3) {
            await userModel.findByIdAndUpdate(userData._id, {
              $set: { referalCode },
            });
          }
        }
        await couponModel.updateOne(
          { couponCode },
          { $push: { usedUsers: userData._id } }
        );
        await cartModel.findOneAndDelete({ userid: userData._id });
        res.send({ message: "1" });
      } else {
        res.send({ message: "0", msg: "Some products are out of Stock" });
      }
    } catch (error) {
      console.log(error.message);
      // res.render("error", { error: error.message });
    }
  },

  details: async (req, res) => {
    const { id } = req.query;
    try {
      const order = await orderModel
        .findById(id)
        .populate("products.productid")
        .populate("address")
        .exec();
      if (order) {
        res.render("orderDetails", { order });
      } else {
        res.redirect("/profile");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  createOrder: async (req, res) => {
    const { userData } = req.session;
    let { amount } = req.body;
    try {
      amount = parseInt(amount) * 100;
      let stock = await checkStock(userData);
      if (stock) {
        const options = {
          amount,
          currency: "INR",
          receipt: "mohammedfaris105@gmail.com",
        };
        razorpayInstance.orders.create(options, (err, order) => {
          if (!err) {
            res.status(200).send({
              success: true,
              msg: "Order Created",
              amount,
              key_id: RAZORPAY_ID_KEY,
              contact: "9745127684",
              name: userData.name,
              email: "mohammedfaris105@gmail.com",
              message: true,
            });
          } else {
            res.status(400).send({
              message: true,
              success: false,
              msg: "Something went wrong!",
            });
          }
        });
      } else {
        res.send({ message: false, msg: "Some products are out of Stock" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  cancelOrder: async (req, res) => {
    const { userData } = req.session;
    const { id } = req.body;
    try {
      let order = await orderModel.findById(id);
      if (order.paymentMethod != "COD") {
        const userwallet = await walletModel.findOne({ userid: userData._id });
        if (userwallet) {
          await walletModel.findByIdAndUpdate(
            userwallet._id,
            {
              $inc: { balance: order.totalAmount },
              $push: {
                orderDetails: {
                  orderid: id,
                  amount: order.totalAmount,
                  type: "Added",
                },
              },
            },
            { new: true }
          );
        } else {
          let wallet = new walletModel({
            userid: userData._id,
            balance: order.totalAmount,
            orderDetails: [
              {
                orderid: id,
                amount: order.totalAmount,
                type: "Added",
              },
            ],
          });
          await wallet.save();
        }
        order = await orderModel.findByIdAndUpdate(
          id,
          { paymentStatus: "Refund" },
          { new: true }
        );
      }
      for (const product of order.products) {
        await productModel.findByIdAndUpdate(
          product.productid,
          { $inc: { productquantity: product.quantity } },
          { new: true }
        );
      }
      order = await orderModel.findByIdAndUpdate(
        id,
        { status: "Cancelled" },
        { new: true }
      );
      if (order) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  returnRequest: async (req, res) => {
    const { id } = req.body;
    try {
      let order = await orderModel.findByIdAndUpdate(
        id,
        { status: "Return Requested" },
        { new: true }
      );
      if (order) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  approveReturn: async (req, res) => {
    const { id } = req.body;
    try {
      let order = await orderModel.findById(id);
      const userwallet = await walletModel.findOne({ userid: order.userid });
      if (userwallet) {
        await walletModel.findByIdAndUpdate(
          userwallet._id,
          {
            $inc: { balance: order.totalAmount },
            $push: {
              orderDetails: {
                orderid: id,
                amount: order.totalAmount,
                type: "Added",
              },
            },
          },
          { new: true }
        );
      } else {
        let wallet = new walletModel({
          userid: order.userid,
          balance: order.totalAmount,
          orderDetails: [
            {
              orderid: id,
              amount: order.totalAmount,
              type: "Added",
            },
          ],
        });
        await wallet.save();
      }
      for (const product of order.products) {
        await productModel.findByIdAndUpdate(
          product.productid,
          {
            $inc: { productquantity: product.quantity },
          },
          { new: true }
        );
      }
      order = await orderModel.findByIdAndUpdate(
        id,
        { paymentStatus: "Refund" },
        { new: true }
      );
      order = await orderModel.findByIdAndUpdate(
        id,
        { status: "Returned" },
        { new: true }
      );
      if (order) {
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
};

module.exports = order;

let checkStock = async (user) => {
  let flag = true;
  const cart = await cartModel
    .findOne({ userid: user._id })
    .populate("products.productid");
  for (const product of cart.products) {
    const pro = await productModel.findOne({ _id: product.productid });
    if (product.quantity > pro.productquantity) {
      flag = false;
      break;
    }
  }
  return flag;
};
