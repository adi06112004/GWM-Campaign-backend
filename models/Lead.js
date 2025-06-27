const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  upi: { type: String, required: true },
  campaignId: { type: String, required: true },
  redirectUrl: { type: String, default: "https://your-affiliate-link.com" },
}, { timestamps: true });

module.exports = mongoose.model("Lead", leadSchema);
