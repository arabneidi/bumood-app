// Simple encryption/decryption for client-side API key storage
// Note: This is basic obfuscation for client-side storage
// For production, consider using a proper encryption library or server-side key management

const ENCRYPTION_KEY = 'moodpilot_secure_key_2024'; // This should be replaced with a more secure key

// Simple XOR encryption (obfuscation only - not for production security)
function encrypt(text: string): string {
  const key = ENCRYPTION_KEY;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
}

function decrypt(encryptedText: string): string {
  const key = ENCRYPTION_KEY;
  const text = atob(encryptedText); // Base64 decode
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Store encrypted API key
export function setEncryptedApiKey(provider: string, apiKey: string): void {
  try {
    const encrypted = encrypt(apiKey);
    localStorage.setItem(`${provider}_api_key_encrypted`, encrypted);
    localStorage.setItem(`${provider}_api_key_version`, '2'); // Version marker for encrypted keys
  } catch (error) {
    console.error('Error encrypting API key:', error);
    throw new Error('Failed to encrypt API key');
  }
}

// Get and decrypt API key
export function getDecryptedApiKey(provider: string): string | null {
  try {
    const encrypted = localStorage.getItem(`${provider}_api_key_encrypted`);
    if (!encrypted) return null;
    
    const decrypted = decrypt(encrypted);
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key:', error);
    return null;
  }
}

// Check if API key exists (encrypted or legacy)
export function hasApiKey(provider: string): boolean {
  return !!(
    localStorage.getItem(`${provider}_api_key_encrypted`) || 
    localStorage.getItem(`${provider}_api_key`) // Legacy support
  );
}

// Remove API key
export function removeApiKey(provider: string): void {
  localStorage.removeItem(`${provider}_api_key`);
  localStorage.removeItem(`${provider}_api_key_encrypted`);
  localStorage.removeItem(`${provider}_api_key_version`);
}

// Migrate legacy unencrypted keys to encrypted
export function migrateLegacyKeys(): void {
  const providers = ['openai', 'gemini', 'textcortex'];
  
  providers.forEach(provider => {
    const legacyKey = localStorage.getItem(`${provider}_api_key`);
    const hasEncrypted = localStorage.getItem(`${provider}_api_key_encrypted`);
    
    // Migrate if legacy exists but encrypted doesn't
    if (legacyKey && !hasEncrypted) {
      setEncryptedApiKey(provider, legacyKey);
      localStorage.removeItem(`${provider}_api_key`); // Remove plain text version
      console.log(`Migrated ${provider} API key to encrypted storage`);
    }
  });
}

// Initialize migration on module load
if (typeof window !== 'undefined') {
  migrateLegacyKeys();
}

// Helper function to get API key from localStorage (for client-side API calls)
// This is the SINGLE source of truth - keys are only set via profile page
export function getApiKeyForRequest(provider: string = 'openai'): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Try encrypted key first (primary storage method from profile page)
    const decrypted = getDecryptedApiKey(provider);
    if (decrypted) return decrypted;
    
    // Fallback to legacy unencrypted key
    const legacy = localStorage.getItem(`${provider}_api_key`);
    return legacy;
  } catch (error) {
    console.error(`Error getting ${provider} API key:`, error);
    return null;
  }
}
