const cartCollection = require("../models/cartModel");
const productCollection = require("../models/productModel");
const addressModel = require("../models/addressModel");
const walletCollection = require("../models/walletModel");
const couponModel = require("../models/couponModel");

const cart = {
  load: async (req, res) => {
    const { userData } = req.session;
    try {
      const cartData = await cartCollection
        .findOne({ userid: userData._id })
        .populate("products.productid");
      res.render("cart", { cart: cartData, userData });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  add: async (req, res) => {
    const { id } = req.query;
    const { userData } = req.session;
    try {
      let flag = 0;
      const product = await productCollection.findById(id);
      let proqty = product.productquantity;
      if (proqty > 0) {
        const cart = await cartCollection.findOne({ userid: userData._id });
        if (cart) {
          const proExist = cart.products.findIndex((product) =>
            product.productid.equals(id)
          );
          if (proExist != -1) {
            flag = 1;
            req.flash("title", "Product Already in cart");
            res.redirect(req.get("referer"));
          } else {
            await cartCollection.findOneAndUpdate(
              { userid: userData._id },
              { $push: { products: { productid: id, quantity: 1 } } },
              { new: true }
            );
          }
        } else {
          const cart = new cartCollection({
            userid: userData._id,
            products: [{ productid: id, quantity: 1 }],
          });
          await cart.save();
        }
        if (flag == 0) {
          userData.cartCount++;
          req.flash("success", "Product Added to Cart");
          res.redirect("back");
        }
      } else {
        req.flash("title", "Product Out of Stock");
        res.redirect(req.get("referer"));
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  delete: async (req, res) => {
    const { id } = req.query;
    const { userData } = req.session;
    try {
      await cartCollection.updateOne(
        { userid: userData._id },
        { $pull: { products: { productid: id } } }
      );
      userData.cartCount--;
      res.redirect("/cart");
    } catch (error) {
      res.status(501).send({ message: error.message });
    }
  },

  increment: async (req, res) => {
    const { id, value, cartid } = req.body;
    try {
      const incr = parseInt(value) + 1;
      const product = await productCollection.findById(id);
      if (product.productquantity >= incr) {
        await cartCollection.updateOne(
          { _id: cartid, "products.productid": id },
          { $inc: { "products.$.quantity": 1 } }
        );
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
      res.send({ message: "Error occurred." });
    }
  },

  decrement: async (req, res) => {
    const { id, value, cartid } = req.body;
    try {
      const decr = parseInt(value) - 1;
      if (decr > 0) {
        await cartCollection.updateOne(
          { _id: cartid, "products.productid": id },
          { $inc: { "products.$.quantity": -1 } }
        );
        res.send({ message: "1" });
      } else {
        res.send({ message: "0" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
      res.send({ message: "Error occurred." });
    }
  },

  checkout: async (req, res) => {
    const { userData } = req.session;
    try {
      const addresses = await addressModel.find({ userid: userData._id });
      const coupons = await couponModel.find({});
      const products = await cartCollection
        .findOne({ userid: userData._id })
        .populate("products.productid");
      const wallet = await walletCollection.findOne({ userid: userData._id });
      if (products) {
        res.render("checkout", {
          wallet,
          userData,
          addresses,
          products,
          coupons,
        });
      } else {
        res.redirect("/cart");
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  validateCoupon: async (req, res) => {
    const { couponCode, subtotal } = req.body;
    const { userData } = req.session;
    try {
      const coupon = await couponModel.findOne({ couponCode });
      if (coupon) {
        if (!coupon.usedUsers.includes(userData._id)) {
          if (subtotal >= coupon.minimumAmount) {
            res.send({ msg: "1", discount: coupon.couponAmount });
          } else {
            res.send({
              msg: "2",
              message: "Coupon is not applicable for this price",
            });
          }
        } else {
          res.send({ msg: "2", message: "Coupon already used" });
        }
      } else {
        res.send({ msg: "2", message: "Coupon Code Invalid" });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
};

module.exports = cart;
