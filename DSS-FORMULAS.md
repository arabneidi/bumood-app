# 📊 DSS (Daily Success Score) - Official Formula

## 🎯 Goal
"Summarize how well the day was set up for learning and well-being."

## 📋 Components and Raw Formulas

### 1️⃣ Learning Momentum (LM)
**Formula:** `LM = deepwork_minutes + 10 * tasks_completed`

### 2️⃣ Recovery Index (RI)  
**Formula:** `RI = sleep_hours + (recovery_action ? 1 : 0)`

### 3️⃣ Connection (CN)
**Formula:** `CN = positive_social_touchpoints`

## 📊 Z-Score Calculation
**Principle:** "Compute z-scores from last ~14 day-level values (non-null only, sigma floor 0.5)"

### Z-Score Formulas:
- `zLM = (LM_today - mean(LM_last14)) / sigmaLM`
- `zRI = (RI_today - mean(RI_last14)) / sigmaRI`  
- `zCN = (CN_today - mean(CN_last14)) / sigmaCN`

**Where:**
- `LM_today`, `RI_today`, `CN_today` = Current day's raw values
- `mean(LM_last14)`, `mean(RI_last14)`, `mean(CN_last14)` = 14-day averages
- `sigmaLM`, `sigmaRI`, `sigmaCN` = 14-day standard deviations (with 0.5 floor)

## 🎯 Final DSS Formula
**DSS = 0.5 * zLM + 0.3 * zRI + 0.2 * zCN**

**Weights:**
- Learning Momentum (zLM): **50%**
- Recovery Index (zRI): **30%**  
- Connection (zCN): **20%**

## 📈 Z-Score Interpretation
- **Positive z-score** = Above your personal 14-day average
- **Negative z-score** = Below your personal 14-day average
- **Zero z-score** = Exactly at your personal 14-day average

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
