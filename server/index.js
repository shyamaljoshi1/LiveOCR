require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const Scan = require('./models/Scan');
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('Optional dependency "sharp" not installed — image preprocessing will be skipped. Run `npm install sharp` to enable.');
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json({ limit: '10mb' }));

// connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.warn('MONGO_URI not set in environment. Use .env or set MONGO_URI.');
}

mongoose.connect(mongoUri || 'mongodb://127.0.0.1:27017/ocr-scans', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// create Tesseract worker once
let worker;
(async () => {
  worker = await createWorker({
    logger: m => {
      // console.log('Tesseract', m);
    }
  });
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  // Tune Tesseract parameters for better OCR accuracy where appropriate.
  // Page segmentation mode 6 = Assume a single uniform block of text.
  // OCR engine mode 1 = LSTM only (if supported).
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_ocr_engine_mode: '1',
      // You can set a whitelist to limit characters if your content is predictable.
      // tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,:;!?' 
    });
    console.log('Tesseract parameters set');
  } catch (e) {
    console.warn('Failed to set Tesseract parameters:', e.message || e);
  }
  console.log('Tesseract worker ready');
})();

// health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Accept JSON with imageBase64 field (no data URL prefix) and optional timezone
app.post('/api/scan', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

    const buffer = Buffer.from(imageBase64, 'base64');
    const tmpDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const fileName = `capture_${Date.now()}.jpg`;
    const filePath = path.join(tmpDir, fileName);

    // If sharp is available, preprocess the image to improve OCR accuracy:
    // - resize to a reasonable width
    // - convert to grayscale
    // - normalize contrast
    try {
      if (sharp) {
        const processed = await sharp(buffer)
          .resize({ width: 2000, withoutEnlargement: true })
          .grayscale()
          .normalize()
          .toBuffer();
        fs.writeFileSync(filePath, processed);
      } else {
        fs.writeFileSync(filePath, buffer);
      }
    } catch (e) {
      // fallback to writing original buffer
      console.warn('Image preprocessing failed, using original image:', e.message || e);
      fs.writeFileSync(filePath, buffer);
    }

    // run OCR on the (possibly preprocessed) image
    const { data } = await worker.recognize(filePath);
    const text = (data && data.text) ? data.text.trim() : 'No text detected';

    console.log('OCR extracted text:', text.substring(0, 100));

    // save to MongoDB
    const scan = new Scan({ text, imagePath: filePath });
    await scan.save();
    
    console.log('Scan saved to MongoDB:', scan._id);

    // fs.unlink(filePath, (unlinkErr) => {
    //   if (unlinkErr) {
    //     console.warn('Failed to delete temporary image:', filePath, unlinkErr);
    //   } else {
    //     console.log('Deleted temporary image:', filePath);
    //   }
    // });

    res.json({ success: true, text, id: scan._id });
  } catch (err) {
    console.error('Error in /api/scan', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`OCR server listening on port ${PORT}`));
