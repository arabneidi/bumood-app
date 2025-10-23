# 🤖 Complete AI Data Flow - ALL Data Sent to OpenAI

## ✅ COMPREHENSIVE SYSTEM - Gender, Period, Daily Habits & More!

---

## 📊 **What OpenAI Receives (Complete List)**

When you click refresh (✨), OpenAI gets this **COMPLETE PROFILE**:

### **1️⃣ Current Mood Metrics**
```
- Happiness: 7/10
- Energy: 6/10  
- Focus: 8/10
- Stress: 4/10
- Sleep: 7.5 hours
- Time of Day: afternoon
```

### **2️⃣ User Information**
```
- Gender: female
- Currently menstruating: YES (Day 2 of period)
- Average cycle length: 28 days
- Period symptoms: cramps, mood swings, fatigue
```

### **3️⃣ Today's Activities & Habits**
```
Water & Nutrition:
- Water intake: 3 glasses (dehydrated - LOW)
- Meals eaten: 2
- Meal quality: fair
- Caffeine: 4 drinks (HIGH - may affect mood/sleep)
- Alcohol: 0 drinks

Physical Activity:
- Exercise: NO (suggest gentle movement)
- Steps: 3,500 (LOW - suggest more movement)

Social & Mental:
- Social interaction: NO (suggest social activities)
- Screen time: 7 hours (HIGH - suggest screen break)
- Outdoor time: 10 minutes (LOW - suggest outdoor activity)

Self-Care:
- Meditation: NO
- Journaling: NO
- Reading: 0 minutes

Health:
- Medication: Taken
- Supplements: Vitamin D, Iron
- Symptoms: headache, fatigue
```

### **4️⃣ User Preferences (From Feedback)**
```
- Suggestions they LOVED: Morning Meditation, Evening Walk, Gratitude Journaling
- Suggestions they DIDN'T like: Cold Shower, HIIT Workout
- Preferred categories: stress, energy, wellness
- Categories to avoid: fitness (high-intensity)
```

---

## 🎯 **Example: Complete Prompt Sent to OpenAI**

```
Generate 5 personalized wellness suggestions for someone with this mood profile:

Current Mood:
- Happiness: 6/10
- Energy: 4/10  
- Focus: 5/10
- Stress: 7/10
- Sleep: 6/10
- Time of Day: afternoon

User Information (VERY IMPORTANT for personalization):
- Gender: female
- Currently menstruating: YES (Day 2 of period)
- Average cycle length: 28 days
- Current period symptoms: cramps, mood swings, fatigue
- IMPORTANT: Provide suggestions appropriate for someone on their period 
  (gentle activities, pain relief, mood support, avoid intense exercise)

Today's Activities & Habits (CRITICAL - Use this to provide relevant suggestions):
- Water intake: 3 glasses (dehydrated - LOW)
- Meals eaten: 2
- Meal quality: fair
- Caffeine: 4 drinks (HIGH - may affect mood/sleep)
- Alcohol: 0 drinks
- Exercise today: NO (suggest gentle movement)
- Steps: 3,500 (LOW - suggest more movement)
- Social interaction: NO (suggest social activities)
- Screen time: 7 hours (HIGH - suggest screen break)
- Outdoor time: 10 minutes (LOW - suggest outdoor activity)
- Medication: Taken
- Supplements: Vitamin D, Iron
- Physical symptoms: headache, fatigue (address these in suggestions)
- IMPORTANT: Consider what they've eaten, drunk, and done today. 
  Suggest hydration, gentle movement, screen breaks.

User Preferences (IMPORTANT - Use this to personalize suggestions):
- Suggestions they LOVED (suggest similar): Morning Meditation, Evening Walk
- Suggestions they DIDN'T like (avoid these): Cold Shower, HIIT Workout
- Preferred categories (focus on these): stress, energy, wellness
- Categories to avoid: fitness (high-intensity)

CRITICAL: This person is currently menstruating - be sensitive and provide 
appropriate suggestions! IMPORTANT: Personalize based on their preferences above!
```

---

## 💡 **How AI Uses ALL This Data**

### **Smart Example:**

**Input:**
- Stressed (7/10)
- Low energy (4/10)
- On period (Day 2, with cramps)
- Only drank 3 glasses of water (dehydrated)
- Had 4 coffees (too much caffeine)
- No exercise today
- 7 hours screen time
- User loves: Meditation, Walking
- User hates: HIIT, Cold showers

**AI Generates:**
1. ✅ **"Gentle Hydration Walk"** - "Take a 10-minute slow walk while drinking water. Helps with cramps and hydration."
2. ✅ **"Period-Friendly Breathing Exercise"** - "5-minute gentle breathing to reduce stress without physical strain."
3. ✅ **"Screen Break Nature Moment"** - "Step outside for 5 minutes to reduce screen fatigue."
4. ✅ **"Warm Herbal Tea Ritual"** - "Replace caffeine with calming tea to help with period symptoms."
5. ✅ **"Heat Pack Meditation"** - "Combine heat therapy for cramps with 10-minute meditation."

**Notice AI Avoided:**
- ❌ High-intensity exercise (user on period + hates HIIT)
- ❌ Cold showers (user hates them)
- ❌ More caffeine (already had too much)
- ❌ Indoor activities (user needs outdoor time)

---

## 🗄️ **Database Models**

### **User Model:**
```prisma
model User {
  gender        String?  // male, female, non-binary, prefer-not-to-say
  periodTracking PeriodTracking[]
  dailyTracking DailyTracking[]
}
```

### **PeriodTracking Model:**
```prisma
model PeriodTracking {
  startDate     DateTime  // First day of period
  endDate       DateTime? // Last day (null if ongoing)
  flowIntensity String?   // light, moderate, heavy
  symptoms      String?   // JSON: cramps, mood swings, etc.
}
```

### **DailyTracking Model:**
```prisma
model DailyTracking {
  date        DateTime  // One entry per day
  
  // Water & Nutrition
  waterIntake Int?      // glasses
  mealsEaten  Int?      // number of meals
  mealQuality String?   // poor, fair, good, excellent
  caffeine    Int?      // drinks
  alcohol     Int?      // drinks
  
  // Physical Activity
  exercise         Boolean
  exerciseType     String?
  exerciseDuration Int?
  steps            Int?
  
  // Social & Mental
  socialInteraction Boolean
  screenTime        Int?  // hours
  outdoorTime       Int?  // minutes
  
  // Self-Care
  meditation         Boolean
  meditationDuration Int?
  journaling         Boolean
  readingTime        Int?
  
  // Health
  medicationTaken Boolean
  supplements     String?  // JSON array
  symptoms        String?  // JSON array
}
```

---

## 🚀 **API Endpoints**

### **User Profile:**
- `GET /api/user?userId=dummy-user` - Get user profile & gender
- `PUT /api/user` - Update gender/profile

### **Period Tracking:**
- `GET /api/period-tracking?userId=dummy-user` - Get all periods
- `POST /api/period-tracking` - Log new period
- `PUT /api/period-tracking/[id]` - Update period entry

### **Daily Tracking:**
- `GET /api/daily-tracking?userId=dummy-user` - Get today's tracking
- `POST /api/daily-tracking` - Create/update today's tracking

---

## 📝 **Summary**

**OpenAI receives:**
✅ Current mood (valence, energy, focus, stress, sleep)  
✅ Gender  
✅ Period status (is on period, which day, symptoms)  
✅ Water intake (how many glasses)  
✅ Food intake (meals eaten, quality)  
✅ Caffeine & alcohol consumption  
✅ Exercise status (type, duration, steps)  
✅ Social interaction status  
✅ Screen time & outdoor time  
✅ Self-care activities (meditation, journaling, reading)  
✅ Medication & supplements  
✅ Physical symptoms  
✅ User feedback (what they loved/hated)  
✅ Preferred categories  

**Result:** Hyper-personalized suggestions that consider:
- Your biological state (period, gender)
- What you've consumed today (water, food, caffeine)
- Your activity level (exercise, steps, outdoor time)
- Your mental state (screen time, social interaction)
- Your past preferences (what worked before)

**This is the MOST comprehensive mood tracking AI!** 🚀

