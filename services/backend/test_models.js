const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_KEY || GEMINI_KEY.includes('YOUR_')) {
  console.error("❌ GEMINI_API_KEY is not configured in .env");
  process.exit(1);
}

async function run() {
  console.log(`Using API Key: ${GEMINI_KEY.substring(0, 8)}...`);
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  
  // Method 1: Try gemini-1.5-flash
  try {
    console.log("\n1. Testing gemini-1.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, reply with 'test success' if you read this.");
    console.log("✅ gemini-1.5-flash succeeded! Reply:", result.response.text());
  } catch (err) {
    console.error("❌ gemini-1.5-flash failed:", err.message);
  }

  // Method 2: Try gemini-1.5-pro
  try {
    console.log("\n2. Testing gemini-1.5-pro...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent("Hello.");
    console.log("✅ gemini-1.5-pro succeeded!");
  } catch (err) {
    console.error("❌ gemini-1.5-pro failed:", err.message);
  }

  // Method 3: Try gemini-2.0-flash-exp (or gemini-2.0-flash)
  try {
    console.log("\n3. Testing gemini-2.0-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello.");
    console.log("✅ gemini-2.0-flash succeeded!");
  } catch (err) {
    console.error("❌ gemini-2.0-flash failed:", err.message);
  }

  // Method 4: List all available models for your key
  try {
    console.log("\n4. Listing all models available for your key...");
    // Raw fetch for list models
    const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
    const data = await res.json();
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => {
        console.log(` - ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`);
      });
    } else {
      console.log("❌ Could not list models. Response:", data);
    }
  } catch (err) {
    console.error("❌ Listing models failed:", err.message);
  }
}

run();
