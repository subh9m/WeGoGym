/**
 * WeGoGym AI Service - Google Gemini Nutrition Estimator
 * Features:
 * 1. Checks Firestore Cache (foodReference) before calling API.
 * 2. Invokes Gemini AI for Protein & Calories ONLY using Round-Robin API Key Selection.
 * 3. NO hardcoded secret keys. Reads securely from VITE_GEMINI_API_KEYS / VITE_GEMINI_API_KEY.
 */

import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

// Global Round-Robin Index pointer
let roundRobinIndex = 0;

/**
 * Parses comma-separated API keys from environment variables securely
 */
function getApiKeys() {
  const envKeysString = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || "";
  const keys = envKeysString
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
  return keys;
}

/**
 * Gets the next API key using Round-Robin rotation
 */
function getNextRoundRobinKey(keysList) {
  if (!keysList || keysList.length === 0) return null;
  const selectedKey = keysList[roundRobinIndex % keysList.length];
  roundRobinIndex = (roundRobinIndex + 1) % keysList.length;
  return selectedKey;
}

/**
 * Normalizes JSON output string by stripping markdown code blocks
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return cleaned.trim();
}

/**
 * 1. Cache Check in Firestore foodReference collection
 */
export async function checkNutritionCache(userId, foodName, quantity, unit) {
  if (!userId || !foodName) return null;
  try {
    const foodRefCol = collection(db, "users", userId, "foodReference");
    const q = query(foodRefCol, where("name", "==", foodName.trim()));
    const querySnap = await getDocs(q);

    let match = null;
    querySnap.forEach((docSnap) => {
      const data = docSnap.data();
      const refQty = Number(data.referenceQuantity || parseInt(data.serving) || 100);
      const refUnit = (data.referenceUnit || data.serving || "").toString().toLowerCase();
      
      if (
        data.name.toLowerCase() === foodName.trim().toLowerCase() &&
        (refQty === Number(quantity) || refUnit.includes(unit.toLowerCase()))
      ) {
        match = {
          protein: Number(data.protein) || 0,
          calories: Number(data.calories) || Math.round(Number(data.protein) * 4),
          confidence: 1.0,
          cached: true
        };
      }
    });

    return match;
  } catch (err) {
    console.warn("[AI Service] Cache check lookup failed:", err);
    return null;
  }
}

/**
 * 2. Execute Gemini API Prompt Request
 */
async function callGeminiAPI(apiKey, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) {
    throw new Error("Empty candidate response text from Gemini API");
  }

  const cleanedText = cleanJsonResponse(textContent);
  return JSON.parse(cleanedText);
}

/**
 * 3. Main Master Function: Analyze Food with Gemini AI using Round-Robin Keys
 */
export async function analyzeFoodWithGemini(userId, foodName, quantity, unit) {
  const sanitizedName = foodName.trim();
  const sanitizedQty = Number(quantity) || 100;
  const sanitizedUnit = (unit || "g").trim();

  // Step A: Check Firestore Cache first
  if (userId) {
    const cachedResult = await checkNutritionCache(userId, sanitizedName, sanitizedQty, sanitizedUnit);
    if (cachedResult) {
      console.log("[AI Service] Cache hit! Reusing existing Firestore values:", cachedResult);
      return cachedResult;
    }
  }

  const keysList = getApiKeys();
  if (!keysList || keysList.length === 0) {
    throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEYS in your .env file.");
  }

  // Step B: Build Certified Prompt
  const promptText = `
You are a certified sports nutrition expert.

Estimate the nutritional values for the following food.

Food Name:
${sanitizedName}

Reference Quantity:
${sanitizedQty}

Reference Unit:
${sanitizedUnit}

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

  let lastError = null;
  let parsed = null;

  // Round-Robin API Key Selection Loop
  for (let i = 0; i < keysList.length; i++) {
    const selectedKey = getNextRoundRobinKey(keysList);
    try {
      console.log(`[AI Service] Invoking Gemini API via Round-Robin Key #${(roundRobinIndex - 1 + keysList.length) % keysList.length + 1}...`);
      parsed = await callGeminiAPI(selectedKey, promptText);
      if (parsed && typeof parsed.protein !== "undefined") {
        break;
      }
    } catch (err) {
      console.warn(`[AI Service] API key attempt failed:`, err);
      lastError = err;
    }
  }

  if (!parsed) {
    throw new Error(lastError ? `Unable to estimate nutrition: ${lastError.message}` : "Unable to estimate nutrition.");
  }

  const proteinVal = Math.max(0, Math.round(Number(parsed.protein) || 0));
  const caloriesVal = Math.max(0, Math.round(Number(parsed.calories) || proteinVal * 4));
  const confidenceVal = parseFloat(parsed.confidence) || 0.90;

  return {
    foodName: parsed.foodName || sanitizedName,
    referenceQuantity: Number(parsed.referenceQuantity) || sanitizedQty,
    referenceUnit: parsed.referenceUnit || sanitizedUnit,
    protein: proteinVal,
    calories: caloriesVal,
    confidence: confidenceVal,
    cached: false,
    lowConfidenceWarning: confidenceVal < 0.60 ? "AI is not confident. Please verify the food." : null
  };
}
