const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/translate
router.post('/', async (req, res) => {
  try {
    const { text, target_language } = req.body;
    if (!text || !target_language) return res.status(400).json({ error: 'text and target_language required' });

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.json({ translated: text, note: 'Gemini API not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }, { apiVersion: "v1beta" });

    const prompt = `Translate the following text to ${target_language}. Reply ONLY with the translated text, nothing else. Text: "${text}"`;

    const result = await model.generateContent(prompt);
    res.json({ translated: result.response.text().trim() });
  } catch (error) {
    res.status(500).json({ error: error.message, translated: req.body.text });
  }
});

module.exports = router;
