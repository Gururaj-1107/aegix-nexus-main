const { GoogleGenerativeAI } = require('@google/generative-ai');
const { translateToEnglishIfNeeded } = require('./translation');
require('dotenv').config();

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `You are Aegis AI, a highly efficient NGO resource dispatch agent.
Your role is to analyze incoming requests from field volunteers or handwritten documents and extract the key operational parameters.
Always respond with strict JSON matching this exact schema:
{
  "skill": "MEDIC | FOOD_AID | EVAC | SUPPLY | SECURITY | UNKNOWN",
  "lat": <float>,
  "lng": <float>,
  "urgency": "LOW | MEDIUM | HIGH | CRITICAL",
  "quantity": <int>,
  "summary": "<concise 1-sentence human summary>",
  "estimatedResponseMinutes": <int>
}
No markdown. No explanation. Only valid JSON.`;

async function processRequestWithAgent(textOrParsedJSON) {
  if (!GEMINI_KEY || GEMINI_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn('[Agent] No Gemini API key — using fallback stub');
    return getFallbackResponse();
  }

  try {
    const inputString = typeof textOrParsedJSON === 'string' ? textOrParsedJSON : JSON.stringify(textOrParsedJSON);
    console.log('[Agent Pipeline] Passing through translation matrix...');
    const translatedText = await translateToEnglishIfNeeded(inputString);

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    }, { apiVersion: "v1beta" });

    const prompt = `${SYSTEM_PROMPT}\n\nRequest: ${translatedText}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    console.log('[Agent] Gemini processed structural logic:', parsed);
    return parsed;

  } catch (error) {
    console.error('[Agent] Processing error:', error.message);
    return getFallbackResponse();
  }
}

/**
 * Executes a conversational Agent process with Function Calling to 
 * ping database locations or the RAG KnowledgeBase dynamically.
 */
async function queryGeminiChat(messages, systemContext = '', prisma) {
  if (!GEMINI_KEY || GEMINI_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    return { reply: 'Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.', toolLogs: [] };
  }

  const toolLogs = [];
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    
    // Define Agentic Tool Schema (Function Calling)
    const tools = [{
      functionDeclarations: [
        {
          name: "lookup_medic_locations",
          description: "Fetch live lat/lng locations of active Medic volunteers to decide deployment proximity.",
          parameters: { type: "OBJECT", properties: { zone: { type: "STRING", description: "The zone to query" } } }
        },
        {
          name: "query_knowledge_base",
          description: "Perform a RAG vector search across NGO operating guidelines, response protocols, and emergency documents.",
          parameters: { 
            type: "OBJECT", 
            properties: { 
              query: { type: "STRING", description: "The specific emergency question to search for" } 
            }, 
            required: ["query"] 
          }
        }
      ]
    }];

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: systemContext || 'You are Aegis AI assistant, a resource coordination command intelligence.',
      tools: tools
    }, { apiVersion: "v1beta" });

    // Format chat history for SDK
    // Slice off the last message (which we send in model.sendMessage)
    // Also filter out any leading 'model' messages since Gemini requires history to start with 'user'
    let history = messages.slice(0, -1)
      .filter(m => m.content && m.content.trim()) // skip empty messages
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
    // Drop leading model messages — Gemini SDK requires first history entry to be 'user'
    while (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    console.log('[Agent] History length:', history.length, 'Roles:', history.map(h => h.role));

    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    });

    const latestMessage = messages[messages.length - 1].content;
    console.log('[Agent] Sending message:', latestMessage?.substring(0, 50));
    let result = await chat.sendMessage(latestMessage);
    let response = result.response;
    
    // Check for function calls
    let functionCalls = response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const fnName = call.name;
      const fnArgs = call.args;
      console.log(`[Agent SDK] Executing function: ${fnName}`, fnArgs);
      
      let functionResponse = {};

      if (fnName === 'lookup_medic_locations') {
         toolLogs.push("Agent tracking live Medics...");
         try {
           const volunteers = await prisma.volunteer.findMany({
             take: 3, select: { first_name: true, current_lat: true, current_lng: true, status: true }
           });
           functionResponse = { medics: volunteers };
         } catch (e) {
           console.error('[Agent SDK] Volunteer lookup failed:', e.message);
           functionResponse = { medics: "Database connection failed, assuming 2 medics at Zone Alpha." };
         }
      } 
      else if (fnName === 'query_knowledge_base') {
         toolLogs.push("Agent querying NGO Disaster Guidelines via RAG...");
         try {
           // Get embedding of query using the SDK (using gemini-embedding-001 for key compatibility)
           const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" }, { apiVersion: "v1beta" });
           const embResult = await embedModel.embedContent(fnArgs.query);
           const vector = embResult.embedding?.values;
           
           if (!vector) throw new Error("Embeddings unavailable");

           const vectorStr = `[${vector.join(',')}]`;
           const results = await prisma.$queryRawUnsafe(`
             SELECT title, content, 1 - (embedding <=> $1::vector) as similarity
             FROM "KnowledgeBase"
             ORDER BY embedding <=> $1::vector LIMIT 2
           `, vectorStr);
           
           functionResponse = { documents: results };
         } catch (e) {
           console.error('[Agent SDK] RAG Error:', e.message);
           functionResponse = { documents: "RAG lookup failed. Resorting to baseline." };
         }
      }

      // Send the tool response back to complete the turn
      result = await chat.sendMessage([{
        functionResponse: {
          name: fnName,
          response: functionResponse
        }
      }]);
      response = result.response;
    }

    return { reply: response.text(), toolLogs };

  } catch (error) {
    console.error('[Agent] Chat error:', error);
    return { reply: `AI service error: ${error.message}`, toolLogs: [] };
  }
}

function getFallbackResponse() {
  return {
    skill: "MEDIC", lat: 34.0522, lng: -118.2437, urgency: "CRITICAL", quantity: 3, summary: "Fallback mode.", estimatedResponseMinutes: 8
  };
}

module.exports = { processRequestWithAgent, queryGeminiChat };
