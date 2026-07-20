/**
 * Firebase Cloud Functions Backend - WeGoGym
 * Function: analyzeFood
 * Description: Invokes Google Gemini API to estimate protein and calories for food library items.
 * Security: Gemini API Key is read securely from environment variables / Secret Manager.
 */

const functions = require("firebase-functions");
const https = require("https");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

exports.analyzeFood = functions.https.onCall(async (data, context) => {
  // 1. Verify User Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to call analyzeFood.");
  }

  const { foodName, referenceQuantity, referenceUnit } = data;
  if (!foodName || !referenceQuantity || !referenceUnit) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required parameters: foodName, referenceQuantity, referenceUnit.");
  }

  const promptText = `
You are a certified sports nutrition expert.

Estimate the nutritional values for the following food.

Food Name:
${foodName}

Reference Quantity:
${referenceQuantity}

Reference Unit:
${referenceUnit}

Return ONLY valid JSON.

{
"foodName":"",
"referenceQuantity":0,
"referenceUnit":"",
"protein":0,
"calories":0,
"confidence":0.0
}

Rules:
Use standard nutritional values.
Scale values according to quantity.
Return ONLY JSON.
No markdown.
No explanation.
`.trim();

  // Helper to query Gemini REST API
  const callGeminiAPI = () => {
    return new Promise((resolve, reject) => {
      if (!GEMINI_API_KEY) {
        return reject(new Error("GEMINI_API_KEY environment variable is missing."));
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const payload = JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      });

      const req = https.request(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          }
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              const responseJson = JSON.parse(body);
              const textContent = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!textContent) {
                return reject(new Error("Empty response from Gemini API"));
              }
              const parsedNutrition = JSON.parse(textContent);
              resolve(parsedNutrition);
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      req.on("error", (err) => reject(err));
      req.write(payload);
      req.end();
    });
  };

  try {
    // Attempt 1
    let result = await callGeminiAPI().catch(async (err) => {
      console.warn("Gemini Attempt 1 failed, retrying once...", err);
      // Attempt 2 Retry
      return await callGeminiAPI();
    });

    return {
      success: true,
      data: {
        foodName: result.foodName || foodName,
        referenceQuantity: Number(result.referenceQuantity) || Number(referenceQuantity),
        referenceUnit: result.referenceUnit || referenceUnit,
        protein: Math.round(Number(result.protein) || 0),
        calories: Math.round(Number(result.calories) || 0),
        confidence: Number(result.confidence) || 0.85
      }
    };
  } catch (error) {
    console.error("Failed to analyze food with Gemini AI:", error);
    throw new functions.https.HttpsError("internal", "Unable to estimate nutrition.");
  }
});
