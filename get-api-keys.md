# 🚀 How to Get Free AI API Keys

## **1. Google Gemini API (Recommended)**
- **URL**: https://ai.google.dev/
- **Steps**:
  1. Go to https://ai.google.dev/
  2. Click "Get API Key"
  3. Sign in with Google account
  4. Create a new project or select existing
  5. Generate API key
  6. Copy the key and add to `.env` file

**Free Tier**: 15 requests per minute, 1M tokens per day

---

## **2. TextCortex API**
- **URL**: https://textcortex.com/
- **Steps**:
  1. Go to https://textcortex.com/
  2. Sign up for free account
  3. Go to API section
  4. Get your API key
  5. Add to `.env` file

**Free Tier**: $5 credit for 30 days

---

## **3. DeepAI API**
- **URL**: https://deepai.org/
- **Steps**:
  1. Go to https://deepai.org/
  2. Sign up for free account
  3. Go to API section
  4. Get your API key
  5. Add to `.env` file

**Free Tier**: Limited free requests

---

## **🔧 How to Test Each API**

1. **Get an API key** from one of the services above
2. **Add it to `.env` file**:
   ```bash
   GEMINI_API_KEY="your_actual_key_here"
   ```
3. **Change AI_MODE** in `src/lib/aiService.ts`:
   ```typescript
   const AI_MODE = 'GEMINI_ONLY'; // or TEXTCORTEX_ONLY, DEEPAI_ONLY
   ```
4. **Refresh the app** and click the refresh button (✨) in AI Suggestions

---

## **🎯 Current Status**

- ✅ **Local AI**: Working (25+ suggestions, randomized)
- 🔄 **Gemini API**: Ready to test (needs API key)
- 🔄 **TextCortex API**: Ready to test (needs API key)  
- 🔄 **DeepAI API**: Ready to test (needs API key)

**The app will automatically fall back to local AI if any API fails!**
