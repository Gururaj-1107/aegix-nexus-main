const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { processRequestWithAgent } = require('../services/agent');

const upload = multer();

router.post('/', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
       return res.status(400).json({ error: "No document image uploaded" });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
       return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }, { apiVersion: "v1beta" });

    const cleanMimeType = req.file.mimetype.split(';')[0].trim();
    const documentPart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: cleanMimeType,
      },
    };

    const prompt = "Extract all text from this document. Preserve formatting and layout as much as possible.";

    const result = await model.generateContent([prompt, documentPart]);
    const text = result.response.text();
    console.log(`Parsed document text length: ${text.length}`);

    // Send the extracted raw text to the agent to structure
    const agentIntent = await processRequestWithAgent(`Document Report Text:\n${text}`);

    res.json({
        status: "success",
        extractedData: agentIntent,
        intent: agentIntent
    });
  } catch (error) {
    console.error("Document routing error:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

module.exports = router;
