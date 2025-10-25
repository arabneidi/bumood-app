# Clean Slate API

## Overview
The Clean Slate API provides a way to reset a user's data while preserving their profile information. This is useful for testing, giving users a fresh start, or preparing for data migration.

## Endpoint
```
POST /api/clean-slate
```

## Request Body
```json
{
  "userId": "dummy-user"
}
```

## What Gets Removed
- ✅ **All mood entries** - All logged mood data
- ✅ **All daily tracking data** - DSS calculations and tracking
- ✅ **All goals** - Both active and completed goals
- ✅ **All achieved badges** - Removes achievements, badges return to locked state
- ✅ **All AI-related data** - Actions, preferences, suggestions, connections
- ✅ **User activity data** - Recent activities list

## What Gets Preserved
- ✅ **User profile** - Name, age, gender, height, weight, etc.
- ✅ **User preferences** - Personality, interests, favorites
- ✅ **User settings** - All profile configuration

## Response
```json
{
  "success": true,
  "message": "Clean slate completed successfully - all entries, goals, and achieved badges removed",
  "data": {
    "deleted": {
      "moodEntries": 0,
      "dailyTracking": 0,
      "goals": 0,
      "achievements": 0,
      "aiActions": 0,
      "aiPreferences": 0,
      "aiSuggestions": 0,
      "learnConnections": 0
    },
    "verification": {
      "isClean": true,
      "remaining": {
        "moodEntries": 0,
        "dailyTracking": 0,
        "goals": 0,
        "achievements": 0
      }
    }
  }
}
```

## Usage Example
```javascript
const response = await fetch('/api/clean-slate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'dummy-user'
  })
});

const result = await response.json();
console.log('Clean slate completed:', result.success);
```

## Use Cases
1. **Testing** - Reset data between test runs
2. **Fresh Start** - Give users a clean slate while keeping their profile
3. **Data Migration** - Prepare for importing new data
4. **Development** - Clear test data during development

## Important Notes
- ⚠️ **Irreversible** - This action cannot be undone
- ⚠️ **Profile Preserved** - User profile information is kept intact
- ⚠️ **Badges Reset** - All badges return to locked state and can be earned again
- ⚠️ **Goals Removed** - All goals (active and completed) are deleted
- ⚠️ **Entries Cleared** - All mood entries and tracking data is removed

## Error Handling
The API gracefully handles missing database models and provides detailed error information if something goes wrong.
