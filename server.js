const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Lead = require("./models/Lead");

const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config();


// ✅ DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ✅ API to handle submission
app.post("/api/submit", async (req, res) => {
  const { name, mobile, upi, campaignId } = req.body;
  if (!name || !mobile || !upi || !campaignId) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    let lead = await Lead.findOne({ name, mobile, upi, campaignId });
    if (lead) {
      // Existing lead — redirect
      return res.json({
        alreadyExists: true,
        redirectUrl: lead.redirectUrl
      });
    }

    // New lead
    lead = new Lead({
      name,
      mobile,
      upi,
      campaignId,
      redirectUrl: "https://your-affiliate-link.com"  // Change to dynamic if needed
    });
    await lead.save();

    return res.json({
      redirectUrl: lead.redirectUrl
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});


app.get("/api/leads/:campaignId", async (req, res) => {
  try {
    const leads = await Lead.find({ campaignId: req.params.campaignId }).sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



// ✅ Server start
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
