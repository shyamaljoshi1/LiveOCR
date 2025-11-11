const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  imagePath: { type: String } // optional path where the image was temporarily saved
});

module.exports = mongoose.model('Scan', ScanSchema);
