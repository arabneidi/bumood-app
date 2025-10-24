# 📊 DSS (Daily Success Score) Formulas

## 🎯 Overview
The DSS is calculated using 3 components with the formula:
**DSS = 0.5 × zLM + 0.3 × zRI + 0.2 × zCN**

Where z-scores are calculated as: **z = (value - historical_average) / standard_deviation**

---

## 1️⃣ Learning Momentum (LM)
**Formula:** `LM = deepworkMinutes + (10 × tasksCompleted)`

**Data Sources:**
- `deepworkMinutes` - Minutes spent in deep work
- `tasksCompleted` - Number of tasks completed

**Z-Score Calculation:**
- Compare today's LM to last 14 days of LM values
- zLM = (todayLM - averageLM) / stdDevLM

**Weight in DSS:** 50% (0.5)

---

## 2️⃣ Recovery Index (RI)
**Formula:** `RI = sleepHours + (recoveryAction ? 1 : 0)`

**Data Sources:**
- `sleepHours` - Hours of sleep
- `recoveryAction` - Boolean (true/false) for recovery activities

**Z-Score Calculation:**
- Compare today's RI to last 14 days of RI values
- zRI = (todayRI - averageRI) / stdDevRI

**Weight in DSS:** 30% (0.3)

---

## 3️⃣ Connection Score (CN)
**Formula:** `CN = positiveSocialTouchpoints`

**Data Sources:**
- `positiveSocialTouchpoints` - Number of positive social interactions

**Z-Score Calculation:**
- Compare today's CN to last 14 days of CN values
- zCN = (todayCN - averageCN) / stdDevCN

**Weight in DSS:** 20% (0.2)

---

## 📈 Z-Score Interpretation
- **Positive z-score** = Above your personal average
- **Negative z-score** = Below your personal average
- **Zero z-score** = Exactly at your personal average

## 🔄 Fallback for New Users
If < 5 days of historical data:
- Use normalized raw scores (0-1 range) instead of z-scores
- DSS = 0.5 × (LM/maxLM) + 0.3 × (RI/maxRI) + 0.2 × (CN/maxCN)

## 📊 Database Schema
```sql
DailyTracking {
  deepworkMinutes: Int
  tasksCompleted: Int
  sleepHours: Float
  recoveryAction: Boolean
  positiveSocialTouchpoints: Int
}
```
