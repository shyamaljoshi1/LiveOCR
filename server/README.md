# OCR Server

This is a simple Node/Express backend that receives base64-encoded images, uses Tesseract.js to extract text, and saves results in MongoDB.

Quick start

1. Copy `.env.example` to `.env` and set `MONGO_URI`.

2. Install dependencies:

```bash
cd server
npm install
```

3. Start the server:

```bash
npm run dev
```

Endpoint

POST /api/scan

Body JSON:

{
  "imageBase64": "...base64 string without data:image/...;base64,... prefix..."
}

Response:

{
  "success": true,
  "text": "extracted text",
  "id": "mongodb id"
}

Notes

- This prototype writes temporary image files to `server/tmp/`. You can keep or delete them depending on your needs.
- For better OCR accuracy, consider sending larger images or using cloud OCR services.
- This is not hardened for production. Add authentication, TLS, rate-limiting, and input validations before deploying.
