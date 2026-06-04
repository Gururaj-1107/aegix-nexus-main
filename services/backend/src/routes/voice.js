const express = require('express');
const router = express.Router();
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { processRequestWithAgent } = require('../services/agent');
const { dispatchMatcher } = require('../services/matcherClient');

const upload = multer();

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }, { apiVersion: "v1beta" });
    
    const cleanMimeType = req.file.mimetype.split(';')[0].trim();
    const audioPart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: cleanMimeType,
      }
    };

    const prompt = "Please transcribe this audio exactly as it is spoken.";
    
    const result = await model.generateContent([prompt, audioPart]);
    const transcript = result.response.text().trim();
    
    console.log(`Transcribed voice: ${transcript}`);

    // Vertex AI call to parse JSON out of transcript
    const agentIntent = await processRequestWithAgent(transcript);
    
    // Find optimal match using matcher via JSON payload
    const match = await dispatchMatcher(agentIntent);

    res.json({
        status: "success",
        transcript,
        intent: agentIntent,
        dispatched_volunteer: match || "No available medics nearby"
    });
  } catch (error) {
    console.error("Voice routing error:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

module.exports = router;
