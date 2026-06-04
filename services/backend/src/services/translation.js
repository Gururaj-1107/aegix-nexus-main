const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Automatically detects language and translates to English if it's not English.
 * Ensures the Agentic workflow operates smoothly regardless of volunteer language.
 */
async function translateToEnglishIfNeeded(text) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    return text;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" }, { apiVersion: "v1beta" });

    const prompt = `If the following text is in English, reply exactly with the text. If it is in another language, translate it to English and reply ONLY with the translated English text, nothing else. Text: "${text}"`;

    const result = await model.generateContent(prompt);
    const translatedText = result.response.text().trim();
    
    console.log(`[Translation] Processed input text through Gemini translator pipeline.`);
    
    return translatedText;
  } catch (error) {
    console.error(`[Translation] Error in auto-translation pipeline:`, error.message);
    return text; // fallback to original input
  }
}

module.exports = { translateToEnglishIfNeeded };
