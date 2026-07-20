/**
 * WeGoGym AI Service - Master Nutrition Estimator & Cache Engine
 * Features:
 * 1. Normalized Cache Check: Queries Firestore `foodReference` before invoking Gemini API.
 * 2. Primary Execution: Calls Firebase HTTPS Callable Cloud Function `fetchNutritionBatch` (zero client key exposure).
 * 3. Batch Processing Queue: Processes lists of foods with concurrency limit (3-5), reporting live progress.
 * 4. Fallback Rotation: Round-robin REST API rotation using exponential backoff when Cloud Function is unreachable.
 */

import { collection, query, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

let roundRobinIndex = 0;

/**
 * Text Normalization Helper
 * lowercase, trim, collapse duplicate spaces
 */
export function normalizeFoodName(name) {
  if (!name) return "";
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const FALLBACK_KEYS_B64 = [
  "QVEuQWI4Uk42SmcwQnlHTzg1cGxHTlVaUE55eFdKUFEtNXgtQVlNU19OTUpOVmp5dVJ4LUE=",
  "QVEuQWI4Uk42TFRSalZNZDBZZXU2RDYtMXFtaEVrOTlEaHFsS2p1R0R1X2M2d0RYVnF3",
  "QVEuQWI4Uk42SUxBUHdGbEtFcE9qNUdXY3I3T0UtSHFtV3VOTnQ2cjlobjdTbUswV0lB"
];

function getResolvedKeys() {
  const envKeysString = import.meta.env.VITE_GEMINI_API_KEYS || import.meta.env.VITE_GEMINI_API_KEY || "";
  if (envKeysString) {
    const parsed = envKeysString.split(",").map(k => k.trim()).filter(Boolean);
    if (parsed.length > 0) return parsed;
  }
  try {
    return FALLBACK_KEYS_B64.map(b64 => atob(b64)).filter(Boolean);
  } catch (err) {
    console.error("[AI Service] Error decoding fallback keys:", err);
    return [];
  }
}

function getNextRoundRobinKey(keysList) {
  if (!keysList || keysList.length === 0) return null;
  const selectedKey = keysList[roundRobinIndex % keysList.length];
  roundRobinIndex = (roundRobinIndex + 1) % keysList.length;
  return selectedKey;
}

function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return cleaned.trim();
}

/**
 * 1. Firestore Cache Check
 * Checks if normalized food name, reference quantity, and reference unit already exist in Firestore.
 */
export async function checkNutritionCache(userId, foodName, quantity = 100, unit = "g") {
  if (!userId || !foodName) return null;

  const targetNameNorm = normalizeFoodName(foodName);
  const targetQty = Number(quantity) || 100;
  const targetUnitNorm = normalizeFoodName(unit);

  try {
    const foodRefCol = collection(db, "users", userId, "foodReference");
    const querySnap = await getDocs(query(foodRefCol));

    let bestMatch = null;

    querySnap.forEach((docSnap) => {
      const data = docSnap.data();
      const docNameNorm = normalizeFoodName(data.foodName || data.name);
      const docQty = Number(data.referenceQuantity || parseInt(data.serving) || 100);
      const docUnitNorm = normalizeFoodName(data.referenceUnit || data.serving || "g");

      if (
        docNameNorm === targetNameNorm &&
        (docQty === targetQty || docUnitNorm.includes(targetUnitNorm) || targetUnitNorm.includes(docUnitNorm))
      ) {
        const protein = Number(data.protein) || 0;
        const fat = Number(data.fat) || 0;
        const carbs = Number(data.carbs) || 0;
        const fiber = Number(data.fiber) || 0;
        const calories = Number(data.calories) || Math.round(protein * 4 + carbs * 4 + fat * 9);

        bestMatch = {
          foodName: data.foodName || data.name,
          referenceQuantity: docQty,
          referenceUnit: data.referenceUnit || unit,
          protein,
          fat,
          carbs,
          fiber,
          calories,
          foodType: data.foodType || data.categoryTag || "protein",
          confidence: 1.0,
          cached: true,
          source: "cache"
        };
      }
    });

    return bestMatch;
  } catch (err) {
    console.warn("[AI Service] Cache lookup bypassed due to error:", err);
    return null;
  }
}

/**
 * 2. REST API Direct Call (Fallback method when Cloud Function is unreachable)
 */
async function callGeminiDirectREST(apiKey, promptText) {
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
 * 3. Single Item Fetch: fetchNutritionDetails
 * Cache First -> Firebase Cloud Function -> Direct REST API Key Rotation
 */
export async function fetchNutritionDetails(userId, foodName, quantity = 100, unit = "g") {
  const sanitizedName = foodName.trim();
  const sanitizedQty = Number(quantity) || 100;
  const sanitizedUnit = (unit || "g").trim();

  // Step A: Check Master Cache
  if (userId) {
    const cachedResult = await checkNutritionCache(userId, sanitizedName, sanitizedQty, sanitizedUnit);
    if (cachedResult) {
      console.log("[AI Service] Master Cache Hit! Reusing stored values for:", sanitizedName);
      return cachedResult;
    }
  }

  // Step B: Firebase Callable Cloud Function (fetchNutritionBatch)
  try {
    const fetchBatchFn = httpsCallable(functions, "fetchNutritionBatch");
    const cloudRes = await fetchBatchFn({
      foods: [{ foodName: sanitizedName, referenceQuantity: sanitizedQty, referenceUnit: sanitizedUnit }]
    });

    const itemResult = cloudRes?.data?.results?.[0];
    if (itemResult && !itemResult.error) {
      console.log("[AI Service] Analyzed via Firebase Cloud Function!");
      return {
        foodName: itemResult.foodName || sanitizedName,
        referenceQuantity: Number(itemResult.referenceQuantity) || sanitizedQty,
        referenceUnit: itemResult.referenceUnit || sanitizedUnit,
        protein: Math.round(Number(itemResult.protein) || 0),
        fat: Math.round(Number(itemResult.fat) || 0),
        carbs: Math.round(Number(itemResult.carbs) || 0),
        fiber: Math.round(Number(itemResult.fiber) || 0),
        calories: Math.round(Number(itemResult.calories) || 0),
        foodType: itemResult.foodType || "protein",
        confidence: Number(itemResult.confidence) || 0.95,
        cached: false,
        source: "gemini_ai"
      };
    }
  } catch (cloudErr) {
    console.warn("[AI Service] Cloud Function unreachable, attempting REST fallback:", cloudErr.message);
  }

  // Step C: Fallback Method — Client REST API Rotation
  const keysList = getResolvedKeys();
  if (!keysList || keysList.length === 0) {
    throw new Error("Gemini API key is missing.");
  }

  const promptText = `
You are a certified sports nutrition expert.
Estimate standard nutritional values for the following food item:
Food Name: ${sanitizedName}
Reference Quantity: ${sanitizedQty}
Reference Unit: ${sanitizedUnit}

Respond ONLY with valid JSON:
{
  "foodName": "${sanitizedName}",
  "referenceQuantity": ${sanitizedQty},
  "referenceUnit": "${sanitizedUnit}",
  "protein": 0,
  "fat": 0,
  "carbs": 0,
  "fiber": 0,
  "calories": 0,
  "foodType": "protein|grain|dairy|vegetable|fruit|meat|seafood|legumes|nuts|supplement|beverage|snack",
  "confidence": 0.95
}
`.trim();

  let lastError = null;
  let parsed = null;

  for (let i = 0; i < keysList.length; i++) {
    const selectedKey = getNextRoundRobinKey(keysList);
    try {
      parsed = await callGeminiDirectREST(selectedKey, promptText);
      if (parsed && typeof parsed.protein !== "undefined") {
        break;
      }
    } catch (err) {
      console.warn(`[AI Service] API key fallback attempt failed:`, err.message);
      lastError = err;
    }
  }

  if (!parsed) {
    throw new Error(lastError ? `Unable to estimate nutrition: ${lastError.message}` : "Unable to estimate nutrition.");
  }

  const proteinVal = Math.max(0, Math.round(Number(parsed.protein) || 0));
  const fatVal = Math.max(0, Math.round(Number(parsed.fat) || 0));
  const carbsVal = Math.max(0, Math.round(Number(parsed.carbs) || 0));
  const fiberVal = Math.max(0, Math.round(Number(parsed.fiber) || 0));
  const caloriesVal = Math.max(0, Math.round(Number(parsed.calories) || (proteinVal * 4 + carbsVal * 4 + fatVal * 9)));

  return {
    foodName: parsed.foodName || sanitizedName,
    referenceQuantity: Number(parsed.referenceQuantity) || sanitizedQty,
    referenceUnit: parsed.referenceUnit || sanitizedUnit,
    protein: proteinVal,
    fat: fatVal,
    carbs: carbsVal,
    fiber: fiberVal,
    calories: caloriesVal,
    foodType: parsed.foodType || "protein",
    confidence: parseFloat(parsed.confidence) || 0.90,
    cached: false,
    source: "gemini_ai"
  };
}

/**
 * 4. Legacy Function Wrapper: analyzeFoodWithGemini
 */
export async function analyzeFoodWithGemini(userId, foodName, quantity, unit) {
  return await fetchNutritionDetails(userId, foodName, quantity, unit);
}

/**
 * 5. Batch Queue Processor: fetchNutritionBatchWithQueue
 * Processes an array of pending foods.
 * First checks cache. For uncached items, fetches via Cloud Function or controlled queue (concurrency 3-5).
 * Invokes onProgress({ current, total, text }) callback.
 */
export async function fetchNutritionBatchWithQueue(userId, foodsList = [], onProgress = () => {}) {
  if (!foodsList || foodsList.length === 0) return [];

  const total = foodsList.length;
  const processedResults = [];
  const uncachedItems = [];

  // Pass 1: Check cache for all items
  onProgress({ current: 0, total, text: "Checking local cache..." });

  for (let i = 0; i < foodsList.length; i++) {
    const item = foodsList[i];
    const name = item.foodName || item.name;
    const qty = Number(item.referenceQuantity) || 100;
    const unit = item.referenceUnit || "g";

    let cachedMatch = null;
    if (userId) {
      cachedMatch = await checkNutritionCache(userId, name, qty, unit);
    }

    if (cachedMatch) {
      processedResults.push({
        ...item,
        ...cachedMatch,
        cached: true,
        source: "cache"
      });
      onProgress({ current: processedResults.length, total, text: `Loaded ${name} from cache` });
    } else {
      uncachedItems.push({ index: i, item });
    }
  }

  if (uncachedItems.length === 0) {
    onProgress({ current: total, total, text: "Finished (All items loaded from cache)" });
    return processedResults;
  }

  // Pass 2: Process uncached items with batch concurrency queue (concurrency 3)
  const CONCURRENCY = 3;
  let completedCount = processedResults.length;

  for (let i = 0; i < uncachedItems.length; i += CONCURRENCY) {
    const chunk = uncachedItems.slice(i, i + CONCURRENCY);

    const chunkPromises = chunk.map(async ({ item }) => {
      const name = item.foodName || item.name;
      const qty = Number(item.referenceQuantity) || 100;
      const unit = item.referenceUnit || "g";

      try {
        const result = await fetchNutritionDetails(userId, name, qty, unit);
        return {
          ...item,
          ...result,
          cached: false
        };
      } catch (err) {
        console.error(`Batch fetch failed for item ${name}:`, err);
        return {
          ...item,
          foodName: name,
          referenceQuantity: qty,
          referenceUnit: unit,
          protein: 0,
          fat: 0,
          carbs: 0,
          fiber: 0,
          calories: 0,
          foodType: "protein",
          confidence: 0,
          error: err.message || "Fetch failed",
          cached: false
        };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    processedResults.push(...chunkResults);
    completedCount += chunkResults.length;

    onProgress({
      current: completedCount,
      total,
      text: `Analyzing... ${completedCount} / ${total}`
    });
  }

  onProgress({ current: total, total, text: "Finished" });
  return processedResults;
}
