# Power Hours Diagnostic Workflow

## Name: "Analyze Power Hours Cell"

When you say **"Analyze Power Hours Cell"** or **"Power Hours Diagnostic"**, I will execute the following workflow to trace how the MC value is calculated and displayed for any specific time slot in the Power Hours chart.

## The 11-Step Workflow

**When I run this diagnostic, I will explain each step as it happens:**

### Step 1: User Opens Stats Page
- Frontend calls: `GET /api/power-hours?userId=dummy-user&window=weekly`
- 📊 **What happens**: Frontend requests Power Hours data

### Step 2: API Sets Date Window (Weekly)
- **Start Date**: 6 days ago (e.g., Oct 19 if today is Oct 25)
- **End Date**: Today (e.g., Oct 25)
- **Result**: 7-day rolling window
- 📅 **What happens**: Determine the date range to analyze

### Step 3: Fetch All Mood Entries in Window
- Query database for entries between start and end dates
- Filter: `moodComposite IS NOT NULL`
- Select: `createdAt`, `valence`, `energy`, `focus`, `stress`, `selectedTimeSlots`, `activityEntries`
- 📊 **What happens**: Get all mood entries in the weekly window

### Step 4: Fetch Historical Entries (for Z-Score)
- Query ALL entries BEFORE the target date
- Used for: Calculating z-scores (need historical data to compare against)
- 📈 **What happens**: Get historical data to compare current mood against baseline

### Step 5: Identify Target Day & Hour
- Example: "Wednesday 3pm" = `dayOfWeek='Wed'`, `hour=15`
- Determine the actual date (e.g., Oct 22, 2025)
- 🎯 **What happens**: Find which specific time slot to analyze

### Step 6: Filter Historical Entries for Specific Hour
- Check `selectedTimeSlots` for hour match (e.g., `"midday-15"`)
- OR check `activityEntries` for hour match
- Count filtered entries: `historicalDataForTimeSlot.length`
- 🔍 **What happens**: Find only entries that occurred at the same time (e.g., 3pm)

### Step 7: Check Sufficient Data
- **IF** `historicalDataForTimeSlot.length >= 5`:
  - Proceed to calculate MC
- **ELSE**:
  - Set `mcValue = null` (not enough data)
  - Return null to frontend
- ✅ **What happens**: Verify there's enough historical data (need at least 5 entries)

### Step 8: Calculate Mood Composite
**8a. Group by Date & Average**
- Average V, E, F, S for each day
- Example: If Monday, Wednesday, Thursday all have 3pm entries → 3 daily averages

**8b. Calculate Z-Scores**
- For each metric (V, E, F, S):
  - `mean = average of historical values`
  - `stdDev = sqrt(variance)`
  - `zScore = (current_value - mean) / max(stdDev, 0.5)`
  - Minimum 5 historical entries required

**8c. Calculate MC**
```
MC = 0.4×zV + 0.3×zE + 0.2×zF - 0.2×zS
```
- 🧮 **What happens**: Compute z-scores and combine into Mood Composite

### Step 9: Return Result to API
```json
{
  "day": "Wed",
  "hour": 15,
  "mcValue": 2.719  // or null
}
```
- 📤 **What happens**: Send the calculated MC back to frontend

### Step 10: Frontend Receives MC Value
- React component receives JSON array of all time slots
- Finds matching `{day: "Wed", hour: 15, mcValue: 2.719}`
- 📥 **What happens**: Frontend receives the data

### Step 11: Display Heatmap Cell
- Map `mcValue` to color intensity
- `null` = grey (insufficient data)
- Positive number = green (good mood)
- Negative number = red (poor mood)
- Higher absolute value = more intense color
- 🎨 **What happens**: Color the heatmap cell based on MC value

## Example Invocation

To run this diagnostic, simply say:
- **"Analyze Power Hours Cell for Wednesday 3pm"**
- **"Power Hours Diagnostic: Tuesday 2pm"**
- **"Analyze Wed 15:00"**
- **"Run analyze for Wednesday 3pm"**
- **"Analyze Power Hours for Wednesday 3pm"**

**Note**: When you say "analyze" or "run analyze", I will explain all 11 steps in plain English, showing you exactly what happens at each stage.

## IMPORTANT: What Happens When You Say "Analyze Power Hours"

When you say **"Analyze Power Hours for [day/time]"**, I will:

1. **Print all 11 steps** with detailed explanations
2. **Execute each step** while explaining what's happening
3. **Query the database** to show historical entries
4. **Call the API** to get the actual MC value
5. **Explain the result** (why it's null or a number)
6. **Show historical data** used in the calculation
7. **Display the complete flow** from frontend to heatmap

**The explanation format will be:**
- Clear step-by-step breakdown
- Plain English explanations of what each step does
- Visual indicators (✅, ❌, ⏸️) showing status
- Summary table with results
- Conclusion explaining the final MC value

This gives you **complete visibility** into how each Power Hours cell's MC is calculated.

## What This Diagnostic Shows

1. **Date Window**: What date range was used for weekly window
2. **Historical Entries**: How many entries match the specific hour
3. **Data Sufficiency**: Whether enough data exists (5+ entries required)
4. **Historical Data Points**: The exact V, E, F, S values used in calculation
5. **Z-Scores**: Individual z-scores for each metric
6. **Final MC Value**: The calculated Mood Composite
7. **Why Null**: If MC is null, shows reason (insufficient data)

## Key Files Involved

- `src/app/api/power-hours/route.ts`: Main API endpoint
- `src/lib/moodCompositeCalculator.ts`: MC calculation logic
- `src/components/charts/PowerHoursHeatmap.tsx`: Display component

## Current Debug Logs

The code now logs the following for each time slot analysis:
```javascript
📊 Wed 15:00 - Historical entries: X (need 5+), currentDate: YYYY-MM-DD
📊 Wed 15:00 - historicalDataForTimeSlot: [array of entries with V, E, F, S]
📊 Wed 15:00 - Calculated MC: X.XX using exact hour matching
```

Or if insufficient data:
```javascript
📊 Wed 15:00 - Insufficient historical data (X), setting to null
```

---

## Example Analysis: Wednesday 3pm (Oct 22, 2025)

### **Result:** `mcValue: null` ❌

### Why MC is Null:
- **Historical entries found**: 12 entries
- **Weekly window**: Oct 19-25 (no entry for Wednesday Oct 22)
- **Problem**: The only Wednesday 3pm entry is from **Oct 15** (outside the weekly window)

### Historical Entries for Wednesday 3pm (before Oct 22):

| Date | Day | Valence | Energy | Focus | Stress |
|------|-----|---------|--------|-------|--------|
| 2025-10-04 | Saturday | 4 | 4 | 3 | 8 |
| 2025-10-04 | Saturday | 5 | 4 | 8 | 5 |
| 2025-10-06 | Monday | 4 | 4 | 7 | 5 |
| 2025-10-07 | Tuesday | 7 | 7 | 7 | 5 |
| 2025-10-11 | Saturday | 4 | 3 | 5 | 7 |
| 2025-10-13 | Monday | 9 | 10 | 10 | 2 |
| 2025-10-14 | Tuesday | 4 | 3 | 3 | 8 |
| 2025-10-15 | **Wednesday** | 8 | 8 | 8 | 4 |
| 2025-10-17 | Friday | 5 | 7 | 6 | 6 |
| 2025-10-18 | Saturday | 5 | 3 | 8 | 5 |
| 2025-10-19 | Sunday | 2 | 4 | 4 | 10 |
| 2025-10-21 | Tuesday | 10 | 10 | 10 | 1 |

### Key Insight:
- Although there are 12 historical entries (more than the required 5)
- **There is NO entry for Wednesday Oct 22 in the current weekly window (Oct 19-25)**
- Therefore, the API returns `mcValue: null` because there's no current entry to calculate MC for

### Summary:
```
📅 Target Date: Wednesday, Oct 22, 2025 at 3pm
📊 Historical Entries: 12 (sufficient for z-score calculation)
❌ Current Entry: None in weekly window (Oct 19-25)
🎯 Result: null (no data to calculate MC for this time slot)
```

### Conclusion:
The Power Hours API needs **both**:
1. ✅ Sufficient historical data (5+ entries) - **MET**
2. ❌ A current entry in the weekly window to calculate MC for - **NOT MET**

Therefore, `mcValue = null` is the correct result.

---

## How I Explain the 11 Steps

When you ask me to analyze, I will explain each step like this:

### Example Explanation Format:

**"Step 1: User Opens Stats Page"**
- Frontend calls: `GET /api/power-hours?userId=dummy-user&window=weekly`
- **What happens**: Browser requests Power Hours data

**"Step 2: API Sets Date Window (Weekly)"**
- Today is Saturday, Oct 25, 2025
- Weekly window = last 7 days = Oct 19 to Oct 25
- **What happens**: API calculates which dates to analyze

Each step gets this treatment:
- **What it does**: Clear description
- **Why it matters**: Purpose/context
- **What happens**: The actual process
- **Result**: What comes out of this step

Plus visual indicators:
- ✅ = Success/completed
- ❌ = Failed/problem
- ⏸️ = Skipped
- 🎯 = Key decision point
