/**
 * Firebase Cloud Functions Backend - WeGoGym
 * Functions: fetchNutritionBatch, analyzeFood
 * Description: Invokes Google Gemini API with key rotation & backoff to estimate nutritional profiles (protein, fat, carbs, fiber, calories, foodType, confidence).
 * Security: Gemini API Keys are managed backend-side with automatic rotation and retry mechanisms.
 */

const functions = require("firebase-functions");
const https = require("https");

function getApiKeys() {
  const envKeysString = process.env.GEMINI_KEYS || process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEYS || process.env.VITE_GEMINI_API_KEY || "";
  if (envKeysString) {
    const parsed = envKeysString.split(",").map(k => k.trim()).filter(Boolean);
    if (parsed.length > 0) return parsed;
  }
  const individualKeys = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4
  ].filter(Boolean);
  if (individualKeys.length > 0) return individualKeys;
  return [];
}

let keyIndex = 0;

function getNextKey(keysList) {
  if (!keysList || keysList.length === 0) return null;
  const key = keysList[keyIndex % keysList.length];
  keyIndex = (keyIndex + 1) % keysList.length;
  return key;
}

function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return cleaned.trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call Gemini REST API with key rotation and exponential backoff
 */
async function callGeminiWithRotation(promptText, retries = 3) {
  const keys = getApiKeys();
  let lastErr = null;

  for (let attempt = 0; attempt < Math.max(retries, keys.length); attempt++) {
    const apiKey = getNextKey(keys);
    if (!apiKey) break;

    try {
      const result = await new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.1,
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
              if (res.statusCode === 429 || res.statusCode === 503) {
                return reject(new Error(`API Rate Limited or Unavailable (HTTP ${res.statusCode})`));
              }
              if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`Gemini API HTTP Error ${res.statusCode}: ${body}`));
              }
              try {
                const responseJson = JSON.parse(body);
                const textContent = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!textContent) {
                  return reject(new Error("Empty response text from Gemini API"));
                }
                const cleanedText = cleanJsonResponse(textContent);
                const parsedNutrition = JSON.parse(cleanedText);
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

      return result;
    } catch (err) {
      console.warn(`[Gemini API] Attempt ${attempt + 1} failed: ${err.message}. Rotating key...`);
      lastErr = err;
      // Exponential backoff wait before next key retry
      await sleep(Math.min(1000 * Math.pow(2, attempt), 4000));
    }
  }

  throw lastErr || new Error("All Gemini API keys exhausted or rate limited.");
}

/**
 * Callable Cloud Function: fetchNutritionBatch
 * Accepts: { foods: [ { foodName, referenceQuantity, referenceUnit } ] } or [ { foodName, referenceQuantity, referenceUnit } ]
 * Returns: { success: true, results: [ { foodName, referenceQuantity, referenceUnit, protein, fat, carbs, fiber, calories, foodType, confidence } ] }
 */
exports.fetchNutritionBatch = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to call fetchNutritionBatch.");
  }

  const items = Array.isArray(data) ? data : (data?.foods || (data?.foodName ? [data] : []));
  if (!items || items.length === 0) {
    throw new functions.https.HttpsError("invalid-argument", "At least one food item must be provided.");
  }

  const results = [];

  for (const item of items) {
    const foodName = (item.foodName || item.name || "").trim();
    const referenceQuantity = Number(item.referenceQuantity) || 100;
    const referenceUnit = (item.referenceUnit || "g").trim();

    if (!foodName) {
      results.push({
        foodName: "Unknown",
        referenceQuantity,
        referenceUnit,
        error: "Missing food name"
      });
      continue;
    }

    const promptText = `
You are a certified sports nutrition expert specializing in Indian and global fitness nutrition.

Estimate standard accurate nutritional values for the following food item:

Food Name: ${foodName}
Reference Quantity: ${referenceQuantity}
Reference Unit: ${referenceUnit}

CRITICAL NUTRITIONAL REFERENCE GUIDELINES FOR INDIAN & GLOBAL FOODS:
- 1 Roti / Chapati / Phulka (1 piece, ~35g cooked whole wheat): 3.2g Protein, 0.5g Fat, 15g Carbs, 2g Fiber, 75 Calories.
- 1 Paratha (plain, 1 piece): 4g Protein, 7g Fat, 24g Carbs, 2g Fiber, 180 Calories.
- 1 Naan (plain, 1 piece): 8g Protein, 5g Fat, 45g Carbs, 2g Fiber, 260 Calories.
- 1 Bowl Cooked Dal / Sambhar (150g): 6.5g Protein, 3g Fat, 18g Carbs, 4g Fiber, 130 Calories.
- 100g Paneer (Raw/Cottage Cheese): 18g Protein, 20g Fat, 3g Carbs, 0g Fiber, 265 Calories.
- 1 Dosa (plain, 1 piece): 4g Protein, 4g Fat, 28g Carbs, 1.5g Fiber, 160 Calories.
- 1 Idli (1 piece): 2g Protein, 0.2g Fat, 10g Carbs, 0.5g Fiber, 50 Calories.
- 1 Bowl Cooked Rice (150g): 3.5g Protein, 0.4g Fat, 40g Carbs, 0.6g Fiber, 190 Calories.
- 1 Whole Large Egg: 6g Protein, 5g Fat, 0.6g Carbs, 0g Fiber, 70 Calories.
- 100g Chicken Breast (cooked): 31g Protein, 3.6g Fat, 0g Carbs, 0g Fiber, 165 Calories.
- 1 Scoop Whey Protein (30g): 24g Protein, 1.5g Fat, 2g Carbs, 0g Fiber, 120 Calories.

Respond with ONLY a JSON object containing:
{
  "foodName": "${foodName}",
  "referenceQuantity": ${referenceQuantity},
  "referenceUnit": "${referenceUnit}",
  "protein": 0,
  "fat": 0,
  "carbs": 0,
  "fiber": 0,
  "calories": 0,
  "foodType": "protein|grain|dairy|vegetable|fruit|meat|seafood|legumes|nuts|supplement|beverage|snack",
  "confidence": 0.95
}

Rules:
- All nutritional numerical values MUST be accurately scaled for the specified reference quantity and unit.
- If the unit is "piece", "roti", or "chapati", calculate for the EXACT specified number of pieces (e.g. 1 Roti = 3.2g Protein, 75 kcal; 2 Rotis = 6.4g Protein, 150 kcal).
- If unit is "g" or "ml", scale proportionally (e.g. 100g Paneer = 18g Protein, 265 kcal).
- "protein", "fat", "carbs", "fiber", "calories" must be numbers (in grams, calories in kcal).
- "foodType" MUST be one of: protein, grain, dairy, vegetable, fruit, meat, seafood, legumes, nuts, supplement, beverage, snack.
- Return ONLY valid raw JSON. No markdown fences. No explanatory commentary.
`.trim();

    try {
      const parsed = await callGeminiWithRotation(promptText);
      const protein = Math.max(0, Math.round(Number(parsed.protein) || 0));
      const fat = Math.max(0, Math.round(Number(parsed.fat) || 0));
      const carbs = Math.max(0, Math.round(Number(parsed.carbs) || 0));
      const fiber = Math.max(0, Math.round(Number(parsed.fiber) || 0));
      const calories = Math.max(0, Math.round(Number(parsed.calories) || (protein * 4 + carbs * 4 + fat * 9)));

      results.push({
        foodName: parsed.foodName || foodName,
        referenceQuantity,
        referenceUnit,
        protein,
        fat,
        carbs,
        fiber,
        calories,
        foodType: parsed.foodType || "protein",
        confidence: Number(parsed.confidence) || 0.95,
        aiGenerated: true,
        source: "gemini_ai"
      });
    } catch (err) {
      console.error(`Failed to analyze item "${foodName}":`, err.message);
      results.push({
        foodName,
        referenceQuantity,
        referenceUnit,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        calories: 0,
        foodType: "protein",
        confidence: 0,
        error: err.message || "Failed to fetch nutrition data"
      });
    }
  }

  return {
    success: true,
    results
  };
});

/**
 * Legacy Callable Cloud Function: analyzeFood
 * Kept for backwards compatibility
 */
exports.analyzeFood = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to call analyzeFood.");
  }

  const batchRes = await exports.fetchNutritionBatch.run({
    data,
    auth: context.auth
  });

  const firstResult = batchRes?.results?.[0];
  if (!firstResult || firstResult.error) {
    throw new functions.https.HttpsError("internal", firstResult?.error || "Unable to estimate nutrition.");
  }

  return {
    success: true,
    data: firstResult
  };
});
