const addressCollection = require("../models/addressModel");

const address = {
  load: async (req, res) => {
    let { userData } = req.session;
    try {
      let success = req.flash("success");
      const addresses = await addressCollection.find({
        $and: [{ userid: userData._id }, { isActive: 1 }],
      });
      res.render("userAddress", { userData, addresses, success: success[0] });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  addPage: async (req, res) => {
    let { userData } = req.session;
    try {
      res.render("addAddress", { userData });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  add: async (req, res) => {
    let { userData } = req.session;
    const { name, address, city, State, Pincode, phone, landmark } = req.body;
    try {
      const useraddress = new addressCollection({
        userid: userData._id,
        name,
        address,
        city,
        State,
        Pincode,
        phone,
        landmark,
      });
      await useraddress.save();
      req.flash("success", "New address added");
      res.redirect("/addresses");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  editAddressPage: async (req, res) => {
    let { userData } = req.session;
    let { id } = req.query;
    try {
      const address = await addressCollection.findById(id);
      res.render("editAddress", { userData, address });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  editAddress: async (req, res) => {
    let { id, name, address, city, State, Pincode, phone, landmark } = req.body;
    try {
      await addressCollection.findByIdAndUpdate(id, {
        $set: { name, address, city, State, Pincode, phone, landmark },
      });
      req.flash("success", "Address updated Successfully.");
      res.redirect("/addresses");
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },

  delete: async (req, res) => {
    const { id } = req.body;
    try {
      await addressCollection.findByIdAndUpdate(id, { $set: { isActive: 0 } });
      res.send({ message: "1" });
    } catch (error) {
      res.render("error", { error: error.message });
    }
  },
};

module.exports = address;
