# 📊 Profile & Tracking System - Complete Guide

## ✅ NEW FEATURES ADDED!

---

## 🎯 **Where to Find Everything**

### **Profile Page** (`/profile`)
- New navigation button: **"Profile"** (cyan/teal button in top menu)
- Click on it to access ALL your personal settings and tracking!

---

## 📝 **1. Profile Information Tab**

### **What You Can Fill In:**

✅ **Name** - Your display name  
✅ **Gender** - Female / Male / Non-binary / Prefer not to say  
✅ **Age** - Your age in years  
✅ **Height** - In centimeters (e.g., 170 cm)  
✅ **Weight** - In kilograms (e.g., 65 kg)  

### **How AI Uses This:**
```
Example Prompt to OpenAI:
"Generate suggestions for:
- Gender: Female, Age: 28, Height: 165cm, Weight: 60kg
- Currently menstruating (Day 2)
- Only drank 3 glasses of water today
- Had 4 coffees (too much caffeine)"

AI Response:
→ "Gentle hydration walk" (age-appropriate, period-friendly)
→ "Herbal tea instead of coffee" (considers caffeine intake)
→ "Light stretching" (appropriate for someone on period)
```

---

## 🩸 **2. Period Tracking Tab**

### **How to Log Your Period:**

1. **Click "Period Tracking" tab**
2. **Fill in:**
   - **Start Date** - First day of period (required)
   - **End Date** - Last day (optional, leave empty if ongoing)
   - **Flow Intensity** - Light / Moderate / Heavy
   - **Symptoms** - Click buttons to select (cramps, mood swings, fatigue, etc.)
   - **Notes** - Any additional notes
3. **Click "Log Period"**

### **Period History:**
- See all your past periods
- Track patterns and cycle length
- AI automatically calculates your average cycle length (e.g., 28 days, 30 days)

### **How AI Uses Period Data:**

#### **If Currently On Period:**
```
AI receives:
- Gender: Female
- Currently menstruating: YES (Day 2 of period)
- Average cycle: 28 days
- Symptoms: cramps, fatigue
- Mood: Low energy (3/10), Stressed (7/10)

AI generates PERIOD-APPROPRIATE suggestions:
✅ "Gentle walking meditation" (no intense exercise)
✅ "Heat pack therapy" (for cramps)
✅ "Magnesium-rich snack" (helps with period symptoms)
✅ "Restorative yoga" (gentle, supportive)

AI AVOIDS:
❌ HIIT workouts
❌ Intense cardio
❌ Core exercises
❌ Cold therapy
```

#### **If NOT On Period:**
```
AI receives:
- Gender: Female
- Not currently on period (average cycle: 28 days)

AI can suggest:
✅ More intense activities
✅ Regular exercise routines
✅ No period-specific accommodations
```

---

## 📊 **3. Daily Tracking Tab**

### **What You Can Track Today:**

#### **💧 Water & Nutrition:**
- **Water intake** - Number of glasses (AI suggests more if < 4)
- **Meals eaten** - How many meals today
- **Meal quality** - Poor / Fair / Good / Excellent
- **Caffeine** - Number of caffeinated drinks (AI warns if > 3)
- **Alcohol** - Number of alcoholic drinks (AI considers if > 2)

#### **🏃 Physical Activity:**
- **Exercise** - Yes/No checkbox
- **Exercise type** - Running, yoga, walking, etc.
- **Duration** - Minutes exercised
- **Steps** - Daily steps count (AI suggests more if < 5,000)

#### **👥 Social & Screen Time:**
- **Social interaction** - Yes/No (AI suggests social activities if No)
- **Screen time** - Hours (AI suggests breaks if > 6)
- **Outdoor time** - Minutes (AI suggests outdoor activities if < 30)

#### **🧘 Self-Care:**
- **Meditation** - Yes/No + duration
- **Journaling** - Yes/No
- **Reading** - Minutes spent reading

### **How AI Uses Daily Tracking:**

#### **Example 1: Dehydrated + Stressed**
```
Daily Tracking:
- Water: 2 glasses (DEHYDRATED)
- Caffeine: 4 drinks (TOO MUCH)
- Screen time: 8 hours (HIGH)
- Outdoor time: 0 minutes (NONE)
- Mood: Stressed (8/10), Low energy (3/10)

AI Suggests:
✅ "Hydration break" - "Drink 2 glasses of water now, you're dehydrated"
✅ "Caffeine-free outdoor walk" - "Replace coffee with herbal tea, step outside for 15 min"
✅ "Screen-free breathing exercise" - "Close laptop, do 5-min breathing"
```

#### **Example 2: No Exercise + Poor Meals**
```
Daily Tracking:
- Exercise: NO
- Steps: 1,200 (VERY LOW)
- Meals: 1 (only one meal)
- Meal quality: Poor
- Mood: Low energy (2/10)

AI Suggests:
✅ "Energizing snack + short walk" - "Eat a healthy snack (nuts, fruit) then take a 10-min walk"
✅ "Light stretching" - "Gentle movement to boost energy"
✅ "Meal planning" - "Prepare a nutritious meal"
```

#### **Example 3: Too Much Screen Time + No Social**
```
Daily Tracking:
- Screen time: 10 hours (EXCESSIVE)
- Social interaction: NO
- Outdoor time: 5 minutes
- Mood: Low happiness (4/10), Stressed (6/10)

AI Suggests:
✅ "Digital detox walk" - "Leave phone at home, walk for 20 minutes"
✅ "Call a friend" - "Have a 10-minute phone conversation"
✅ "Outdoor lunch break" - "Eat outside, away from screens"
```

---

## 🤖 **Complete Data Sent to AI**

### **When You Click Refresh on AI Suggestions:**

```
User Profile:
- Name: Sarah
- Gender: Female, Age: 28, Height: 165cm, Weight: 60kg

Period Status:
- Currently menstruating: YES (Day 2)
- Cycle length: 28 days
- Symptoms: cramps, fatigue

Today's Activities:
- Water: 3 glasses (dehydrated - LOW)
- Meals: 2 (fair quality)
- Caffeine: 4 drinks (HIGH - too much)
- Alcohol: 0
- Exercise: NO
- Steps: 3,500 (LOW)
- Social: NO
- Screen time: 7 hours (HIGH)
- Outdoor: 10 min (LOW)
- Meditation: NO
- Journaling: NO

Current Mood:
- Happiness: 5/10
- Energy: 4/10
- Stress: 7/10
- Sleep: 6 hours
- Time: afternoon

User Preferences (from feedback):
- Loved: Meditation, Walking, Journaling
- Hated: HIIT, Cold showers
- Preferred: stress, wellness
- Avoid: intense fitness
```

### **AI Generates:**
1. ✅ **"Gentle Hydration Walk"** - "Walk slowly for 10 min while drinking water. Period-friendly, addresses dehydration."
2. ✅ **"Caffeine-Free Herbal Tea Break"** - "Replace coffee #5 with calming chamomile tea. Reduce caffeine, help with period."
3. ✅ **"Screen-Free Breathing"** - "Close laptop, do 5-min breathing. You've been on screens 7 hours."
4. ✅ **"Outdoor Meditation"** - "You love meditation + need outdoor time. Meditate outside for 10 min."
5. ✅ **"Light Journaling"** - "You love journaling + haven't done it today. Write for 10 min about your day."

---

## 📱 **How to Use the Profile Page**

### **Step-by-Step:**

1. **Click "Profile" button** in top navigation (cyan button)
2. **Fill in Profile Information** (first tab)
   - Enter name, gender, age, height, weight
   - Click "Save Profile"
3. **Log Your Period** (second tab)
   - If currently on period, log the start date
   - Select symptoms, flow intensity
   - Click "Log Period"
4. **Track Today's Habits** (third tab)
   - Update water intake throughout the day
   - Log meals, exercise, screen time
   - Check off meditation, journaling, etc.
   - Click "Save Today's Tracking"

---

## 🎯 **Why This Makes AI Better**

### **Before (Generic AI):**
```
"Try meditation" - generic
"Go for a walk" - generic
"Drink water" - generic
```

### **After (Personalized AI):**
```
"Gentle meditation for period cramps" - specific to YOUR state
"Hydration walk (you only drank 3 glasses)" - addresses YOUR actual need
"Outdoor screen break (7 hours screen time)" - fixes YOUR actual problem
```

---

## ✨ **Summary**

**Your AI now knows:**
✅ Your age, gender, physical metrics  
✅ If you're on your period (and which day)  
✅ Exactly what you've eaten and drunk today  
✅ How much you've exercised (or not)  
✅ Your screen time and outdoor time  
✅ What self-care you've done  
✅ What suggestions you loved before  

**Result:**
🎯 **Hyper-personalized suggestions** that address YOUR actual situation, not generic advice!

---

## 🚀 **Try It Now!**

1. Go to **http://localhost:3000/profile**
2. Fill in your information
3. Log today's water, meals, activities
4. Go back to dashboard
5. Click refresh (✨) on AI Suggestions
6. See how suggestions change based on YOUR actual data!

**This is the most comprehensive mood tracking + AI system!** 🎉

