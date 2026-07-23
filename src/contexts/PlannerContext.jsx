import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  addDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const PlannerContext = createContext();

export function usePlanner() {
  return useContext(PlannerContext);
}

const INITIAL_FOOD_REF = [
  { name: "Milk", foodName: "Milk", serving: "500ml", referenceQuantity: 500, referenceUnit: "ml", protein: 16, fat: 15, carbs: 24, fiber: 0, calories: 295, foodType: "dairy", categoryTag: "DAIRY", category: "veg", isVeg: true },
  { name: "Paneer", foodName: "Paneer", serving: "100g", referenceQuantity: 100, referenceUnit: "g", protein: 20, fat: 22, carbs: 4, fiber: 0, calories: 294, foodType: "dairy", categoryTag: "DAIRY", category: "veg", isVeg: true },
  { name: "Chicken Breast", foodName: "Chicken Breast", serving: "150g", referenceQuantity: 150, referenceUnit: "g", protein: 46, fat: 5, carbs: 0, fiber: 0, calories: 248, foodType: "meat", categoryTag: "MEAT", category: "nonveg", isVeg: false },
  { name: "Eggs (3)", foodName: "Eggs (3)", serving: "3 Eggs", referenceQuantity: 3, referenceUnit: "piece", protein: 18, fat: 15, carbs: 2, fiber: 0, calories: 215, foodType: "meat", categoryTag: "PROTEIN", category: "nonveg", isVeg: false },
  { name: "Soya Chunks", foodName: "Soya Chunks", serving: "50g", referenceQuantity: 50, referenceUnit: "g", protein: 26, fat: 1, carbs: 17, fiber: 6, calories: 172, foodType: "legumes", categoryTag: "HIGH PROTEIN", category: "veg", isVeg: true },
  { name: "Oats", foodName: "Oats", serving: "50g", referenceQuantity: 50, referenceUnit: "g", protein: 8, fat: 4, carbs: 33, fiber: 5, calories: 194, foodType: "grain", categoryTag: "GRAINS", category: "veg", isVeg: true },
  { name: "Peanut Butter", foodName: "Peanut Butter", serving: "60g", referenceQuantity: 60, referenceUnit: "g", protein: 15, fat: 30, carbs: 12, fiber: 4, calories: 354, foodType: "nuts", categoryTag: "NUTS", category: "veg", isVeg: true },
  { name: "Banana (3)", foodName: "Banana (3)", serving: "3 Bananas", referenceQuantity: 3, referenceUnit: "piece", protein: 4, fat: 1, carbs: 80, fiber: 9, calories: 315, foodType: "fruit", categoryTag: "FRUITS", category: "veg", isVeg: true },
  { name: "Dal", foodName: "Dal", serving: "1 Bowl", referenceQuantity: 200, referenceUnit: "g", protein: 12, fat: 4, carbs: 28, fiber: 8, calories: 196, foodType: "legumes", categoryTag: "VEGETARIAN", category: "veg", isVeg: true },
  { name: "Rajma", foodName: "Rajma", serving: "1 Bowl", referenceQuantity: 200, referenceUnit: "g", protein: 15, fat: 3, carbs: 38, fiber: 12, calories: 239, foodType: "legumes", categoryTag: "VEGETARIAN", category: "veg", isVeg: true },
  { name: "White Chana", foodName: "White Chana", serving: "1 Bowl", referenceQuantity: 200, referenceUnit: "g", protein: 14, fat: 5, carbs: 44, fiber: 12, calories: 277, foodType: "legumes", categoryTag: "GRAINS", category: "veg", isVeg: true },
  { name: "Greek Yogurt", foodName: "Greek Yogurt", serving: "200g", referenceQuantity: 200, referenceUnit: "g", protein: 20, fat: 1, carbs: 8, fiber: 0, calories: 121, foodType: "dairy", categoryTag: "DAIRY", category: "veg", isVeg: true }
];

const DEFAULT_WORKOUT_STRUCTURES = {
  day1: {
    type: "Push",
    exercises: [
      { name: "Bench Press", muscleGroup: "Chest", weight: "60kg", sets: 4, reps: "6-10", completed: false, notes: "" },
      { name: "Incline Dumbbell Press", muscleGroup: "Chest", weight: "25kg", sets: 3, reps: "6-10", completed: false, notes: "" },
      { name: "Shoulder Press", muscleGroup: "Shoulders", weight: "20kg", sets: 3, reps: "6-10", completed: false, notes: "" },
      { name: "Lateral Raise", muscleGroup: "Shoulders", weight: "10kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Cable Fly", muscleGroup: "Chest", weight: "15kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Tricep Pushdown", muscleGroup: "Triceps", weight: "25kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Overhead Extension", muscleGroup: "Triceps", weight: "17.5kg", sets: 3, reps: "10-15", completed: false, notes: "" }
    ]
  },
  day2: {
    type: "Pull",
    exercises: [
      { name: "Lat Pulldown", muscleGroup: "Back", weight: "55kg", sets: 4, reps: "6-10", completed: false, notes: "" },
      { name: "Barbell Row", muscleGroup: "Back", weight: "50kg", sets: 3, reps: "6-10", completed: false, notes: "" },
      { name: "Seated Cable Row", muscleGroup: "Back", weight: "45kg", sets: 3, reps: "6-10", completed: false, notes: "" },
      { name: "Face Pull", muscleGroup: "Shoulders", weight: "15kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Dumbbell Curl", muscleGroup: "Biceps", weight: "12.5kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Hammer Curl", muscleGroup: "Biceps", weight: "12.5kg", sets: 3, reps: "10-15", completed: false, notes: "" }
    ]
  },
  day3: {
    type: "Legs + Abs",
    exercises: [
      { name: "Squat", muscleGroup: "Quads", weight: "80kg", sets: 4, reps: "6-10", completed: false, notes: "" },
      { name: "Romanian Deadlift", muscleGroup: "Hamstrings", weight: "70kg", sets: 4, reps: "6-10", completed: false, notes: "" },
      { name: "Leg Press", muscleGroup: "Quads", weight: "120kg", sets: 4, reps: "8-10", completed: false, notes: "" },
      { name: "Leg Curl", muscleGroup: "Hamstrings", weight: "35kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Leg Extension", muscleGroup: "Quads", weight: "40kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Standing Calf Raise", muscleGroup: "Calves", weight: "50kg", sets: 4, reps: "12-15", completed: false, notes: "" },
      { name: "Hanging Knee Raise", muscleGroup: "Abs", weight: "-", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Cable Crunch", muscleGroup: "Abs", weight: "30kg", sets: 3, reps: "12-15", completed: false, notes: "" },
      { name: "Plank", muscleGroup: "Abs", weight: "-", sets: 3, reps: "60s", completed: false, notes: "" }
    ]
  },
  day4: {
    type: "Push",
    exercises: [
      { name: "Bench Press", muscleGroup: "Chest", weight: "60kg", sets: 4, reps: "6-10", completed: false, notes: "" },
      { name: "Incline Dumbbell Press", muscleGroup: "Chest", weight: "25kg", sets: 3, reps: "6-10", completed: false, notes: "" },
      { name: "Shoulder Press", muscleGroup: "Shoulders", weight: "20kg", sets: 3, reps: "6-10", completed: false, notes: "" },
      { name: "Lateral Raise", muscleGroup: "Shoulders", weight: "10kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Cable Fly", muscleGroup: "Chest", weight: "15kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Tricep Pushdown", muscleGroup: "Triceps", weight: "25kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Overhead Extension", muscleGroup: "Triceps", weight: "17.5kg", sets: 3, reps: "10-15", completed: false, notes: "" }
    ]
  },
  day5: {
    type: "Pull",
    exercises: [
      { name: "Lat Pulldown", muscleGroup: "Back", weight: "55kg", sets: 4, reps: "6-10", completed: false, notes: "" },
      { name: "Barbell Row", muscleGroup: "Back", weight: "50kg", sets: 3, reps: "6-10", completed: false, notes: "" },
      { name: "Seated Cable Row", muscleGroup: "Back", weight: "45kg", sets: 3, reps: "6-10", completed: false, notes: "" },
      { name: "Face Pull", muscleGroup: "Shoulders", weight: "15kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Dumbbell Curl", muscleGroup: "Biceps", weight: "12.5kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Hammer Curl", muscleGroup: "Biceps", weight: "12.5kg", sets: 3, reps: "10-15", completed: false, notes: "" }
    ]
  },
  day6: {
    type: "Legs + Abs",
    exercises: [
      { name: "Squat", muscleGroup: "Quads", weight: "80kg", sets: 4, reps: "6-10", completed: false, notes: "" },
      { name: "Romanian Deadlift", muscleGroup: "Hamstrings", weight: "70kg", sets: 4, reps: "6-10", completed: false, notes: "" },
      { name: "Leg Press", muscleGroup: "Quads", weight: "120kg", sets: 4, reps: "8-10", completed: false, notes: "" },
      { name: "Leg Curl", muscleGroup: "Hamstrings", weight: "35kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Leg Extension", muscleGroup: "Quads", weight: "40kg", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Standing Calf Raise", muscleGroup: "Calves", weight: "50kg", sets: 4, reps: "12-15", completed: false, notes: "" },
      { name: "Hanging Leg Raise", muscleGroup: "Abs", weight: "-", sets: 3, reps: "10-15", completed: false, notes: "" },
      { name: "Russian Twist", muscleGroup: "Abs", weight: "5kg", sets: 3, reps: "15-20", completed: false, notes: "" },
      { name: "Plank", muscleGroup: "Abs", weight: "-", sets: 3, reps: "60s", completed: false, notes: "" }
    ]
  },
  day7: {
    type: "Rest",
    isRest: true,
    exercises: []
  }
};

function getFormattedDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  let hrs = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  hrs = hrs ? hrs : 12;
  return `${hrs}:${mins} ${ampm}`;
}

export function PlannerProvider({ children }) {
  const { currentUser } = useAuth();
  
  // App States
  const [profile, setProfile] = useState(null); // { name, proteinTarget, dietPreference, streak }
  const [onboarded, setOnboarded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState({});
  const [diets, setDiets] = useState({});
  const [foodReferences, setFoodReferences] = useState([]);
  const [history, setHistory] = useState([]);
  const [prs, setPrs] = useState({});

  // Global Workout Active Session Timer State
  const [activeTimer, setActiveTimer] = useState(null); // { dayKey, startTime, elapsedSeconds, isPaused }
  
  // Global Rest Timer States
  const [restSeconds, setRestSeconds] = useState(0);
  const [restActive, setRestActive] = useState(false);
  const [restInitial, setRestInitial] = useState(60);

  // Load active activeTimer cache from Local Storage on mount
  useEffect(() => {
    const savedTimer = localStorage.getItem("wegogym_active_timer");
    if (savedTimer) {
      try {
        const parsed = JSON.parse(savedTimer);
        if (parsed) {
          if (parsed.accumulatedSeconds === undefined) {
            parsed.accumulatedSeconds = parsed.elapsedSeconds || 0;
          }
          if (parsed.lastResumeTime === undefined) {
            parsed.lastResumeTime = parsed.startTime || Date.now();
          }
          if (!parsed.isPaused) {
            const delta = Math.floor((Date.now() - parsed.lastResumeTime) / 1000);
            parsed.elapsedSeconds = parsed.accumulatedSeconds + Math.max(0, delta);
            parsed.lastUpdated = Date.now();
          } else {
            parsed.elapsedSeconds = parsed.accumulatedSeconds;
          }
          setActiveTimer(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved activeTimer:", e);
      }
    }

    // Load rest timer states
    const savedRest = localStorage.getItem("wegogym_rest_timer");
    if (savedRest) {
      try {
        const parsed = JSON.parse(savedRest);
        if (parsed && parsed.isActive) {
          const delta = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
          const remaining = parsed.secondsRemaining - delta;
          if (remaining > 0) {
            setRestSeconds(remaining);
            setRestActive(true);
            setRestInitial(parsed.initialSeconds);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved rest timer:", e);
      }
    }
  }, []);

  // Sync / catch up activeTimer on page tab visibility or window focus (screen unlock)
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        setActiveTimer((prev) => {
          if (!prev || prev.isPaused) return prev;
          const currentElapsed = (prev.accumulatedSeconds || 0) + Math.floor((Date.now() - (prev.lastResumeTime || Date.now())) / 1000);
          const updated = {
            ...prev,
            elapsedSeconds: currentElapsed,
            lastUpdated: Date.now()
          };
          localStorage.setItem("wegogym_active_timer", JSON.stringify(updated));
          return updated;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, []);

  // Interval hook for active session timer ticking
  useEffect(() => {
    let timerId = null;
    if (activeTimer && !activeTimer.isPaused) {
      timerId = setInterval(() => {
        setActiveTimer((prev) => {
          if (!prev || prev.isPaused) return prev;
          const currentElapsed = (prev.accumulatedSeconds || 0) + Math.floor((Date.now() - (prev.lastResumeTime || Date.now())) / 1000);
          const updated = {
            ...prev,
            elapsedSeconds: currentElapsed,
            lastUpdated: Date.now()
          };
          localStorage.setItem("wegogym_active_timer", JSON.stringify(updated));
          return updated;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [activeTimer]);

  // Interval hook for global rest timer ticking
  useEffect(() => {
    let timerId = null;
    if (restActive && restSeconds > 0) {
      timerId = setInterval(() => {
        setRestSeconds((prev) => {
          const next = prev - 1;
          const cache = {
            secondsRemaining: next,
            isActive: next > 0,
            initialSeconds: restInitial,
            lastUpdated: Date.now()
          };
          localStorage.setItem("wegogym_rest_timer", JSON.stringify(cache));
          
          if (next <= 0) {
            setRestActive(false);
            // Play notification alert
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.3);
            } catch (e) {
              console.warn("Audio warning: ", e);
            }
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [restActive, restSeconds, restInitial]);

  // Sync profile config & history logs from Firestore
  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setWorkouts({});
      setDiets({});
      setFoodReferences([]);
      setHistory([]);
      setPrs({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const uid = currentUser.uid;
    const profileDocRef = doc(db, "users", uid, "profile", "config");

    // Watch config document
    const unsubProfile = onSnapshot(profileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const pData = docSnap.data();
        setProfile(pData);
        setOnboarded(true);
      } else {
        setProfile(null);
        setOnboarded(false);
        setLoading(false);
      }
    }, (err) => {
      console.error("Profile watch failure: ", err);
      setLoading(false);
    });

    return () => unsubProfile();
  }, [currentUser]);

  // Sync planners, history & prs after onboarding checks complete
  useEffect(() => {
    if (!currentUser || !onboarded || !profile) return;

    const uid = currentUser.uid;

    // 1. Sync Workouts
    const workoutsColRef = collection(db, "users", uid, "workouts");
    const unsubWorkouts = onSnapshot(workoutsColRef, (querySnap) => {
      const tempWorkouts = {};
      querySnap.forEach((docSnap) => {
        tempWorkouts[docSnap.id] = docSnap.data();
      });
      setWorkouts(tempWorkouts);
    });

    // 2. Sync Diet Planner
    const dietsColRef = collection(db, "users", uid, "diet");
    const unsubDiets = onSnapshot(dietsColRef, (querySnap) => {
      const tempDiets = {};
      querySnap.forEach((docSnap) => {
        tempDiets[docSnap.id] = docSnap.data();
      });
      setDiets(tempDiets);
    });

    // 3. Sync Global Master Food Library
    const masterColRef = collection(db, "masterFoodLibrary");
    const userFoodRefColRef = collection(db, "users", uid, "foodReference");

    const unsubFoodRef = onSnapshot(masterColRef, async (masterSnap) => {
      const itemsMap = new Map();

      // Seed initial foods if master collection is empty
      if (masterSnap.empty) {
        for (const item of INITIAL_FOOD_REF) {
          const newDocRef = doc(masterColRef);
          await setDoc(newDocRef, { ...item, createdAt: new Date().toISOString() });
        }
        return;
      }

      masterSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const norm = (d.foodName || d.name || "").toLowerCase().trim();
        if (norm) {
          itemsMap.set(docSnap.id, { id: docSnap.id, ...d });
        }
      });

      // Merge with user specific overrides
      try {
        const userSnap = await getDocs(userFoodRefColRef);
        userSnap.forEach((docSnap) => {
          itemsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      } catch (err) {
        console.warn("User foodRef lookup warn:", err);
      }

      setFoodReferences(Array.from(itemsMap.values()));
    });

    // 4. Sync Workout History Logs
    const historyColRef = collection(db, "users", uid, "history");
    const unsubHistory = onSnapshot(historyColRef, (querySnap) => {
      const tempHistory = [];
      querySnap.forEach((docSnap) => {
        tempHistory.push({ id: docSnap.id, ...docSnap.data() });
      });
      setHistory(tempHistory);
    });

    // 5. Sync Personal Records (PRs)
    const prColRef = collection(db, "users", uid, "prs");
    const unsubPr = onSnapshot(prColRef, (querySnap) => {
      const tempPrs = {};
      querySnap.forEach((docSnap) => {
        tempPrs[docSnap.id] = docSnap.data();
      });
      setPrs(tempPrs);
      setLoading(false);
    });

    return () => {
      unsubWorkouts();
      unsubDiets();
      unsubFoodRef();
      unsubHistory();
      unsubPr();
    };
  }, [currentUser, onboarded, profile]);

  // ==========================================
  // Onboarding initialization routine
  // ==========================================
  const completeOnboarding = async (name, target, dietPref) => {
    if (!currentUser) return;
    setLoading(true);

    try {
      const uid = currentUser.uid;

      // 1. Create Profile config document with Streak fields
      const profileDocRef = doc(db, "users", uid, "profile", "config");
      const profilePayload = {
        name: name.trim(),
        proteinTarget: parseInt(target) || 100,
        dietPreference: dietPref, // "veg" or "nonveg"
        streak: {
          current: 0,
          longest: 0,
          totalDays: 0,
          lastWorkoutDate: ""
        },
        stats: {
          totalWorkouts: 0,
          totalExercises: 0,
          totalSets: 0,
          totalHours: 0,
          avgDuration: 0
        }
      };
      await setDoc(profileDocRef, profilePayload);

      // 2. Seed Default workouts
      for (const dayKey of Object.keys(DEFAULT_WORKOUT_STRUCTURES)) {
        const workoutDocRef = doc(db, "users", uid, "workouts", dayKey);
        await setDoc(workoutDocRef, DEFAULT_WORKOUT_STRUCTURES[dayKey]);
      }

      // 3. Seed Default diet templates (Day 1 - Day 7)
      const emptyDietTemplate = {
        meals: {
          breakfast: [],
          lunch: [],
          snacks: [],
          dinner: []
        }
      };
      for (let i = 1; i <= 7; i++) {
        const dietDocRef = doc(db, "users", uid, "diet", `day${i}`);
        await setDoc(dietDocRef, emptyDietTemplate);
      }

      // 4. Seed Reference foods matching preference
      const foodRefColRef = collection(db, "users", uid, "foodReference");
      for (const food of INITIAL_FOOD_REF) {
        if (dietPref === "veg" && food.category === "nonveg") {
          continue;
        }
        await addDoc(foodRefColRef, {
          name: food.name,
          serving: food.serving,
          protein: food.protein
        });
      }

      setProfile(profilePayload);
      setOnboarded(true);
    } catch (err) {
      console.error("Onboarding setup failure: ", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfileSettings = async (name, target, dietPref) => {
    if (!currentUser) return;
    try {
      const uid = currentUser.uid;
      const profileDocRef = doc(db, "users", uid, "profile", "config");
      await updateDoc(profileDocRef, {
        name: name.trim(),
        proteinTarget: parseInt(target) || 100,
        dietPreference: dietPref
      });
    } catch (err) {
      console.error("Failed to update profile config: ", err);
    }
  };

  // ==========================================
  // Session Active Timer Control Handles
  // ==========================================
  const startSession = (dayKey) => {
    const timerObj = {
      dayKey,
      startTime: Date.now(),
      elapsedSeconds: 0,
      isPaused: false,
      accumulatedSeconds: 0,
      lastResumeTime: Date.now(),
      lastUpdated: Date.now()
    };
    setActiveTimer(timerObj);
    localStorage.setItem("wegogym_active_timer", JSON.stringify(timerObj));
  };

  const pauseSession = () => {
    setActiveTimer((prev) => {
      if (!prev) return null;
      const currentElapsed = (prev.accumulatedSeconds || 0) + Math.floor((Date.now() - (prev.lastResumeTime || Date.now())) / 1000);
      const updated = { 
        ...prev, 
        isPaused: true, 
        accumulatedSeconds: currentElapsed, 
        elapsedSeconds: currentElapsed, 
        lastUpdated: Date.now() 
      };
      localStorage.setItem("wegogym_active_timer", JSON.stringify(updated));
      return updated;
    });
  };

  const resumeSession = () => {
    setActiveTimer((prev) => {
      if (!prev) return null;
      const updated = { 
        ...prev, 
        isPaused: false, 
        lastResumeTime: Date.now(), 
        lastUpdated: Date.now() 
      };
      localStorage.setItem("wegogym_active_timer", JSON.stringify(updated));
      return updated;
    });
  };

  const cancelSession = () => {
    setActiveTimer(null);
    localStorage.removeItem("wegogym_active_timer");
  };

  // Helper to normalize per-set tracking list
  const getSetsList = (ex) => {
    if (!ex) return [];
    const targetCount = parseInt(ex.targetSets || ex.sets) || 3;
    const defaultWeight = parseFloat(ex.defaultWeight || ex.weight) || 40;
    const defaultReps = parseInt(ex.targetReps || ex.reps) || 10;

    let existingList = Array.isArray(ex.setsList) ? ex.setsList : [];
    const result = [];
    for (let i = 1; i <= targetCount; i++) {
      if (existingList[i - 1]) {
        result.push({
          setNum: i,
          weight: existingList[i - 1].weight ?? defaultWeight,
          reps: existingList[i - 1].reps ?? defaultReps,
          completed: Boolean(existingList[i - 1].completed)
        });
      } else {
        result.push({
          setNum: i,
          weight: defaultWeight,
          reps: defaultReps,
          completed: false
        });
      }
    }
    return result;
  };

  const finishSession = async () => {
    if (!currentUser || !activeTimer) return;

    try {
      const uid = currentUser.uid;
      const dayKey = activeTimer.dayKey;
      const dayWorkout = workouts[dayKey];
      if (!dayWorkout) return;

      const durationMinutes = Math.round(activeTimer.elapsedSeconds / 60) || 1;
      const todayStr = getFormattedDate(new Date());

      // 1. Compute Per-Set Workout Summaries
      let totalVolume = 0;
      let totalCompletedSets = 0;
      let totalCompletedReps = 0;
      let completedExercisesCount = 0;

      const processedExercises = dayWorkout.exercises.map((ex) => {
        const setsList = getSetsList(ex);
        let exVolume = 0;
        let exMaxWeight = 0;
        let exCompletedSets = 0;

        setsList.forEach((s) => {
          if (s.completed) {
            const w = parseFloat(s.weight) || 0;
            const r = parseInt(s.reps) || 0;
            const v = w * r;
            exVolume += v;
            totalVolume += v;
            totalCompletedSets += 1;
            totalCompletedReps += r;
            exCompletedSets += 1;
            if (w > exMaxWeight) exMaxWeight = w;
          }
        });

        const isExCompleted = setsList.length > 0 && setsList.every(s => s.completed);
        if (exCompletedSets > 0) completedExercisesCount += 1;

        return {
          ...ex,
          setsList,
          completed: isExCompleted,
          completedSetsCount: exCompletedSets,
          totalSetsCount: setsList.length,
          volume: exVolume,
          maxWeight: exMaxWeight
        };
      });

      const estimatedCalories = Math.round(durationMinutes * 6 + totalVolume * 0.005);
      const avgWeight = totalCompletedReps > 0 ? parseFloat((totalVolume / totalCompletedReps).toFixed(1)) : 0;

      // 2. Personal Records (PRs) Detection Engine
      const newPRsUnlocked = [];
      
      for (const ex of processedExercises) {
        if (ex.completedSetsCount === 0) continue;
        const sanitizedName = ex.name.toLowerCase().trim();
        const existingPR = prs[sanitizedName];

        const currentMaxWeight = ex.maxWeight;
        const currentVolume = ex.volume;

        let isNewPr = false;
        let prPayload = {};

        if (!existingPR) {
          isNewPr = true;
          prPayload = {
            exerciseName: ex.name,
            highestWeight: currentMaxWeight,
            bestVolume: currentVolume,
            lastPerformed: todayStr,
            previousPrDate: todayStr
          };
        } else {
          const isWeightPr = currentMaxWeight > (existingPR.highestWeight || 0);
          const isVolumePr = currentVolume > (existingPR.bestVolume || 0);

          if (isWeightPr || isVolumePr) {
            isNewPr = true;
            prPayload = {
              exerciseName: ex.name,
              highestWeight: Math.max(currentMaxWeight, existingPR.highestWeight || 0),
              bestVolume: Math.max(currentVolume, existingPR.bestVolume || 0),
              lastPerformed: todayStr,
              previousPrDate: existingPR.lastPerformed || todayStr
            };
          }
        }

        if (isNewPr) {
          await setDoc(doc(db, "users", uid, "prs", sanitizedName), prPayload);
          newPRsUnlocked.push(ex.name);
        }
      }

      // 3. Save Summary into History Collection
      const historyColRef = collection(db, "users", uid, "history");
      const sessionDocName = `hist-${Date.now()}`;
      await setDoc(doc(historyColRef, sessionDocName), {
        date: todayStr,
        dayKey,
        dayName: dayWorkout.type,
        startTime: formatTime(activeTimer.startTime),
        endTime: formatTime(Date.now()),
        durationMinutes,
        durationSeconds: activeTimer.elapsedSeconds,
        completedCount: completedExercisesCount,
        completedSets: totalCompletedSets,
        totalVolume,
        estimatedCalories,
        avgWeight,
        prsAchieved: newPRsUnlocked,
        exercises: processedExercises
      });

      // 4. Update gym streaks in profile config
      let newStreak = { ...profile.streak };
      let newStats = { ...profile.stats };

      const lastDate = newStreak.lastWorkoutDate;
      const yesterdayStr = getFormattedDate(new Date(Date.now() - 86400000));

      if (lastDate !== todayStr) {
        if (lastDate === yesterdayStr) {
          newStreak.current += 1;
        } else {
          newStreak.current = 1;
        }
        newStreak.longest = Math.max(newStreak.current, newStreak.longest);
        newStreak.totalDays += 1;
        newStreak.lastWorkoutDate = todayStr;
      }

      newStats.totalWorkouts += 1;
      newStats.totalExercises += completedExercisesCount;
      newStats.totalSets += totalCompletedSets;
      const newTotalMinutes = (newStats.totalHours * 60) + durationMinutes;
      newStats.totalHours = parseFloat((newTotalMinutes / 60).toFixed(1));
      newStats.avgDuration = Math.round(newTotalMinutes / newStats.totalWorkouts);

      const profileDocRef = doc(db, "users", uid, "profile", "config");
      await updateDoc(profileDocRef, {
        streak: newStreak,
        stats: newStats
      });

      // 5. Reset active day exercises in Firestore (Uncheck completed set flags for next routine cycle)
      const workoutDocRef = doc(db, "users", uid, "workouts", dayKey);
      const resetExercises = dayWorkout.exercises.map(ex => {
        const setsList = getSetsList(ex).map(s => ({ ...s, completed: false }));
        return {
          ...ex,
          completed: false,
          setsList
        };
      });
      await updateDoc(workoutDocRef, { exercises: resetExercises });

      // Clean local storage states
      setActiveTimer(null);
      localStorage.removeItem("wegogym_active_timer");

      // Notify User
      if (newPRsUnlocked.length > 0) {
        alert(`Workout saved! 🎉 New PR set for: ${newPRsUnlocked.join(", ")}`);
      }
    } catch (e) {
      console.error("Failed to finish session:", e);
    }
  };

  // ==========================================
  // Global Rest Timer Handles
  // ==========================================
  const selectRestDuration = (seconds) => {
    const sec = parseInt(seconds) || 90;
    setRestInitial(sec);
    setRestSeconds(sec);
    setRestActive(false);

    const cache = {
      secondsRemaining: sec,
      isActive: false,
      initialSeconds: sec,
      lastUpdated: Date.now()
    };
    localStorage.setItem("wegogym_rest_timer", JSON.stringify(cache));
  };

  const startRest = (seconds) => {
    if (seconds) {
      selectRestDuration(seconds);
    }
    if (restSeconds <= 0 && !seconds) return;
    setRestActive(true);

    const cache = {
      secondsRemaining: seconds || restSeconds,
      isActive: true,
      initialSeconds: seconds || restInitial,
      lastUpdated: Date.now()
    };
    localStorage.setItem("wegogym_rest_timer", JSON.stringify(cache));
  };

  const pauseRest = () => {
    setRestActive(false);
    const cache = {
      secondsRemaining: restSeconds,
      isActive: false,
      initialSeconds: restInitial,
      lastUpdated: Date.now()
    };
    localStorage.setItem("wegogym_rest_timer", JSON.stringify(cache));
  };

  const resumeRest = () => {
    if (restSeconds <= 0) return;
    setRestActive(true);
    const cache = {
      secondsRemaining: restSeconds,
      isActive: true,
      initialSeconds: restInitial,
      lastUpdated: Date.now()
    };
    localStorage.setItem("wegogym_rest_timer", JSON.stringify(cache));
  };

  const resetRest = () => {
    const resetVal = restInitial || 90;
    setRestSeconds(resetVal);
    setRestActive(false);
    const cache = {
      secondsRemaining: resetVal,
      isActive: false,
      initialSeconds: resetVal,
      lastUpdated: Date.now()
    };
    localStorage.setItem("wegogym_rest_timer", JSON.stringify(cache));
  };

  // ==========================================
  // Standard Workout Updates & Per-Set Logging
  // ==========================================
  const updateExerciseSet = async (dayKey, exerciseIndex, setIndex, updatedSetFields) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const workoutDocRef = doc(db, "users", uid, "workouts", dayKey);
    const dayWorkout = workouts[dayKey];
    if (!dayWorkout || !dayWorkout.exercises[exerciseIndex]) return;

    const newExercises = [...dayWorkout.exercises];
    const targetEx = { ...newExercises[exerciseIndex] };
    const currentSetsList = getSetsList(targetEx);

    const updatedSetsList = [...currentSetsList];
    updatedSetsList[setIndex] = {
      ...updatedSetsList[setIndex],
      ...updatedSetFields
    };

    // Exercise is completed ONLY when ALL sets in setsList are marked completed
    const allSetsCompleted = updatedSetsList.every(s => s.completed);

    newExercises[exerciseIndex] = {
      ...targetEx,
      setsList: updatedSetsList,
      completed: allSetsCompleted
    };

    await updateDoc(workoutDocRef, { exercises: newExercises });
  };

  const updateExercise = async (dayKey, exerciseIndex, updatedFields) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const workoutDocRef = doc(db, "users", uid, "workouts", dayKey);
    
    const dayWorkout = workouts[dayKey];
    if (!dayWorkout) return;

    const newExercises = [...dayWorkout.exercises];
    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      ...updatedFields
    };

    await updateDoc(workoutDocRef, { exercises: newExercises });
    // Note: Timer triggers are manual only (Feature 1 requirement)
  };

  const toggleWorkoutExercise = async (dayKey, exerciseName, muscle) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const workoutDocRef = doc(db, "users", uid, "workouts", dayKey);
    
    const dayWorkout = workouts[dayKey];
    if (!dayWorkout) return;

    const existingIndex = dayWorkout.exercises.findIndex(
      ex => ex.name.toLowerCase() === exerciseName.toLowerCase()
    );

    let newExercises = [...(dayWorkout.exercises || [])];
    if (existingIndex > -1) {
      newExercises.splice(existingIndex, 1);
    } else {
      const newEx = {
        id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: exerciseName,
        muscleGroup: muscle || "General",
        muscle: muscle || "General",
        weight: 40,
        sets: 3,
        reps: 10,
        completed: false,
        setsList: [
          { setNum: 1, weight: 40, reps: 10, completed: false },
          { setNum: 2, weight: 40, reps: 10, completed: false },
          { setNum: 3, weight: 40, reps: 10, completed: false }
        ]
      };
      newExercises.push(newEx);
    }

    await updateDoc(workoutDocRef, { exercises: newExercises });
  };

  // ==========================================
  // Diet Operations
  // ==========================================
  const updateDietMeals = async (dayKey, mealsMap) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const dietDocRef = doc(db, "users", uid, "diet", dayKey);

    await updateDoc(dietDocRef, { meals: mealsMap });
  };

  const addFoodToMeal = async (dayKey, mealKey, foodItem, quantity = 1) => {
    const dayDiet = diets[dayKey];
    if (!dayDiet) return;

    const updatedMeals = { ...dayDiet.meals };
    if (!updatedMeals[mealKey]) {
      updatedMeals[mealKey] = [];
    }

    const proteinVal = parseInt(foodItem.proteinPerServing ?? foodItem.protein) || 0;
    const nameVal = foodItem.foodName || foodItem.name || "Food Item";
    const servingVal = foodItem.serving || "1 serving";

    updatedMeals[mealKey].push({
      refId: foodItem.id || foodItem.refId || "",
      name: nameVal,
      foodName: nameVal,
      serving: servingVal,
      proteinPerServing: proteinVal,
      protein: proteinVal,
      quantity: quantity
    });

    await updateDietMeals(dayKey, updatedMeals);
  };

  const addBatchFoodsToMeal = async (dayKey, mealKey, foodItemsList) => {
    const dayDiet = diets[dayKey];
    if (!dayDiet || !Array.isArray(foodItemsList) || foodItemsList.length === 0) return;

    const updatedMeals = { ...dayDiet.meals };
    if (!updatedMeals[mealKey]) {
      updatedMeals[mealKey] = [];
    }

    foodItemsList.forEach((item) => {
      const pVal = Number(item.proteinPerServing ?? item.protein ?? 0);
      const cVal = Number(item.calories ?? Math.round(pVal * 4));
      const fVal = Number(item.fat ?? 0);
      const carbVal = Number(item.carbs ?? 0);
      const fibVal = Number(item.fiber ?? 0);
      const nameVal = item.foodName || item.name || "Food Item";
      const refQ = Number(item.referenceQuantity) || 100;
      const refU = item.referenceUnit || item.unit || "g";
      const servingVal = item.serving || `${refQ}${refU}`;
      const qty = Number(item.quantity) || refQ;

      updatedMeals[mealKey].push({
        refId: item.id || item.refId || "",
        foodReferenceId: item.id || item.refId || "",
        name: nameVal,
        foodName: nameVal,
        serving: servingVal,
        referenceQuantity: refQ,
        referenceUnit: refU,
        proteinPerServing: pVal,
        protein: pVal,
        calories: cVal,
        fat: fVal,
        carbs: carbVal,
        fiber: fibVal,
        quantity: qty,
        unit: refU
      });
    });

    await updateDietMeals(dayKey, updatedMeals);
  };

  const removeFoodFromMeal = async (dayKey, mealKey, index) => {
    const dayDiet = diets[dayKey];
    if (!dayDiet) return;

    const updatedMeals = { ...dayDiet.meals };
    updatedMeals[mealKey].splice(index, 1);

    await updateDietMeals(dayKey, updatedMeals);
  };

  const updateFoodQuantity = async (dayKey, mealKey, index, delta) => {
    const dayDiet = diets[dayKey];
    if (!dayDiet) return;

    const updatedMeals = { ...dayDiet.meals };
    const item = updatedMeals[mealKey][index];
    const newQty = item.quantity + delta;
    
    if (newQty <= 0) {
      updatedMeals[mealKey].splice(index, 1);
    } else {
      item.quantity = newQty;
    }

    await updateDietMeals(dayKey, updatedMeals);
  };

  const updateLoggedFoodItem = async (dayKey, mealKey, index, updatedFields) => {
    const dayDiet = diets[dayKey];
    if (!dayDiet) return;

    const updatedMeals = { ...dayDiet.meals };
    const currentItem = updatedMeals[mealKey][index];
    if (!currentItem) return;

    const newProtein = Number(updatedFields.proteinPerServing ?? updatedFields.protein ?? currentItem.proteinPerServing ?? currentItem.protein ?? 0);
    const newCalories = Number(updatedFields.calories ?? currentItem.calories ?? Math.round(newProtein * 4));

    updatedMeals[mealKey][index] = {
      ...currentItem,
      ...updatedFields,
      proteinPerServing: newProtein,
      protein: newProtein,
      calories: newCalories
    };

    await updateDietMeals(dayKey, updatedMeals);
  };

  // ==========================================
  // Food Reference CRUD (Global Stock & Sync)
  // ==========================================
  const addFoodRef = async (dataOrName, serving, protein) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const masterColRef = collection(db, "masterFoodLibrary");
    const userFoodRefColRef = collection(db, "users", uid, "foodReference");

    const payload = typeof dataOrName === "object" ? dataOrName : {
      foodName: dataOrName,
      name: dataOrName,
      serving: serving || "100g",
      referenceQuantity: 100,
      referenceUnit: "g",
      protein: parseInt(protein) || 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      calories: Math.round((parseInt(protein) || 0) * 4)
    };

    const prot = Number(payload.protein) || 0;
    const fat = Number(payload.fat) || 0;
    const carbs = Number(payload.carbs) || 0;
    const fiber = Number(payload.fiber) || 0;
    const cals = Number(payload.calories) || Math.round(prot * 4 + carbs * 4 + fat * 9);

    const docData = {
      foodName: payload.foodName || payload.name || "Item",
      name: payload.name || payload.foodName || "Item",
      referenceQuantity: Number(payload.referenceQuantity) || 100,
      referenceUnit: payload.referenceUnit || "g",
      serving: payload.serving || `${payload.referenceQuantity || 100}${payload.referenceUnit || "g"}`,
      protein: prot,
      fat: fat,
      carbs: carbs,
      fiber: fiber,
      calories: cals,
      foodType: payload.foodType || payload.categoryTag || "protein",
      categoryTag: payload.categoryTag || payload.foodType || "Protein",
      isVeg: Boolean(payload.isVeg !== undefined ? payload.isVeg : payload.category === "veg"),
      category: payload.category || (payload.isVeg ? "veg" : "nonveg"),
      aiGenerated: Boolean(payload.aiGenerated),
      confidence: Number(payload.confidence) || 1.0,
      source: payload.source || (payload.aiGenerated ? "gemini_ai" : "manual"),
      verified: Boolean(payload.verified ?? !payload.aiGenerated),
      createdAt: payload.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await addDoc(masterColRef, docData);
    try { await addDoc(userFoodRefColRef, docData); } catch (e) {}
  };

  const addBatchFoodRefs = async (foodsArray = []) => {
    if (!currentUser || !Array.isArray(foodsArray) || foodsArray.length === 0) return;
    for (const foodItem of foodsArray) {
      await addFoodRef(foodItem);
    }
  };

  const editFoodRef = async (foodId, dataOrName, serving, protein) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const masterDocRef = doc(db, "masterFoodLibrary", foodId);
    const userDocRef = doc(db, "users", uid, "foodReference", foodId);

    const payload = typeof dataOrName === "object" ? dataOrName : {
      foodName: dataOrName,
      name: dataOrName,
      serving: serving || "100g",
      referenceQuantity: 100,
      referenceUnit: "g",
      protein: parseInt(protein) || 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      calories: Math.round((parseInt(protein) || 0) * 4)
    };

    const prot = Number(payload.protein) || 0;
    const fat = Number(payload.fat) || 0;
    const carbs = Number(payload.carbs) || 0;
    const fiber = Number(payload.fiber) || 0;
    const cals = Number(payload.calories) || Math.round(prot * 4 + carbs * 4 + fat * 9);

    const updateData = {
      foodName: payload.foodName || payload.name,
      name: payload.name || payload.foodName,
      referenceQuantity: Number(payload.referenceQuantity) || 100,
      referenceUnit: payload.referenceUnit || "g",
      serving: payload.serving || `${payload.referenceQuantity || 100}${payload.referenceUnit || "g"}`,
      protein: prot,
      fat: fat,
      carbs: carbs,
      fiber: fiber,
      calories: cals,
      foodType: payload.foodType || payload.categoryTag || "protein",
      categoryTag: payload.categoryTag || payload.foodType || "Protein",
      isVeg: Boolean(payload.isVeg !== undefined ? payload.isVeg : payload.category === "veg"),
      category: payload.category || (payload.isVeg ? "veg" : "nonveg"),
      aiGenerated: Boolean(payload.aiGenerated),
      confidence: Number(payload.confidence) || 1.0,
      source: payload.source || (payload.aiGenerated ? "gemini_ai" : "manual"),
      verified: Boolean(payload.verified ?? !payload.aiGenerated),
      updatedAt: new Date().toISOString()
    };

    try { await updateDoc(masterDocRef, updateData); } catch (e) {}
    try { await updateDoc(userDocRef, updateData); } catch (e) {}
    await updateCascadeDietReferences(foodId, updateData.name, updateData.serving, updateData.protein, updateData.calories);
  };

  const deleteFoodRef = async (foodId) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const masterDocRef = doc(db, "masterFoodLibrary", foodId);
    const userDocRef = doc(db, "users", uid, "foodReference", foodId);

    try { await deleteDoc(masterDocRef); } catch (e) {}
    try { await deleteDoc(userDocRef); } catch (e) {}
  };

  const updateCascadeDietReferences = async (refId, newName, newServing, newProtein, newCalories) => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    for (let i = 1; i <= 7; i++) {
      const dayKey = `day${i}`;
      const dayDiet = diets[dayKey];
      if (!dayDiet) continue;

      let changed = false;
      const updatedMeals = { ...dayDiet.meals };

      for (const mealKey of Object.keys(updatedMeals)) {
        updatedMeals[mealKey] = updatedMeals[mealKey].map(foodItem => {
          if (foodItem.refId === refId) {
            changed = true;
            return {
              ...foodItem,
              name: newName,
              foodName: newName,
              serving: newServing,
              proteinPerServing: newProtein,
              protein: newProtein,
              calories: newCalories || Math.round(newProtein * 4)
            };
          }
          return foodItem;
        });
      }

      if (changed) {
        await updateDietMeals(dayKey, updatedMeals);
      }
    }
  };

  const updateProteinTarget = async (newTarget) => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    const profileDocRef = doc(db, "users", uid, "profile", "config");
    
    await updateDoc(profileDocRef, { proteinTarget: parseInt(newTarget) || 0 });
  };

  const deleteHistoryLog = async (logId) => {
    if (!currentUser || !logId) return;
    const uid = currentUser.uid;
    const historyDocRef = doc(db, "users", uid, "history", logId);
    await deleteDoc(historyDocRef);
  };

  const value = {
    profile,
    onboarded,
    loading,
    completeOnboarding,
    updateProfileSettings,
    workouts,
    diets,
    foodReferences,
    history,
    prs,
    updateExercise,
    updateExerciseSet,
    toggleWorkoutExercise,
    getSetsList,
    addFoodToMeal,
    addBatchFoodsToMeal,
    removeFoodFromMeal,
    updateFoodQuantity,
    updateLoggedFoodItem,
    addFoodRef,
    addBatchFoodRefs,
    editFoodRef,
    deleteFoodRef,
    updateProteinTarget,
    deleteHistoryLog,

    // Active session states
    activeTimer,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession,
    finishSession,

    // Rest timer states
    restSeconds,
    restActive,
    restInitial,
    selectRestDuration,
    startRest,
    pauseRest,
    resumeRest,
    resetRest
  };

  return (
    <PlannerContext.Provider value={value}>
      {children}
    </PlannerContext.Provider>
  );
}
