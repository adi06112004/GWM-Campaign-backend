const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Lead = require("./models/Lead");
const PDFDocument = require('pdfkit');

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

// In your backend (Express):
app.delete('/api/leads/delete/:id', async (req, res) => {
  try {
    const result = await Lead.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: "Lead not found" });
    res.json({ message: "Lead deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


app.put('/api/leads/reward/:id', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { rewarded: true },
      { new: true }
    );
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    res.json(lead);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Export PDF
app.get('/api/leads/export/:campaignId', async (req, res) => {
  try {
    const leads = await Lead.find({ campaignId: req.params.campaignId });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.pdf');
    doc.pipe(res);

    doc.fontSize(18).text(`Leads Report for ${req.params.campaignId}`, { align: 'center' });
    doc.moveDown();

    leads.forEach((lead, idx) => {
      doc.fontSize(12).text(`${idx + 1}. Name: ${lead.name}`);
      doc.text(`   Mobile: ${lead.mobile}`);
      doc.text(`   UPI: ${lead.upi}`);
      doc.text(`   Rewarded: ${lead.rewarded ? 'Yes' : 'No'}`);
      doc.text(`   Submitted At: ${new Date(lead.createdAt).toLocaleString()}`);
      doc.moveDown();
    });

    doc.end();
  } catch {
    res.status(500).json({ error: "Error generating PDF" });
  }
});




// ✅ Server start
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
