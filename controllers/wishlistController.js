const wishlistCollection = require("../models/wishlistModel");

const wishlist = {
  load: async (req, res) => {
    const { userData } = req.session;
    try {
      const title = req.flash("title");
      const success = req.flash("success");
      const wishlist = await wishlistCollection
        .findOne({ userid: userData._id })
        .populate("products.productid")
        .exec();
      res.render("wishlist", {
        userData,
        wishlist,
        messageAlert: title[0],
        success: success[0],
      });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  add: async (req, res) => {
    const { productid } = req.body;
    const { userData } = req.session;
    try {
      let flag = true;
      const wishlist = await wishlistCollection.findOne({
        userid: userData._id,
      });
      if (wishlist) {
        const product = wishlist.products.findIndex((product) =>
          product.productid.equals(productid)
        );
        if (product == -1) {
          await wishlistCollection.findByIdAndUpdate(
            wishlist._id,
            { $push: { products: { productid } } },
            { new: true }
          );
        } else {
          flag = false;
          res.send({ success: false });
        }
      } else {
        const wishlist = new wishlistCollection({
          userid: userData._id,
          products: [{ productid }],
        });
        await wishlist.save();
      }
      if (flag) {
        userData.wishlistCount++;
        res.send({ success: true });
      }
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  remove: async (req, res) => {
    const { userData } = req.session;
    const { productid } = req.query;
    try {
      await wishlistCollection.updateOne(
        { userid: userData._id },
        { $pull: { products: { productid } } }
      );
      userData.wishlistCount--;
      res.redirect("/wishlist");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
};

module.exports = wishlist;
