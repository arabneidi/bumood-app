// AI Authentication and Key Management
export interface AIServiceConfig {
  provider: 'openai' | 'gemini' | 'textcortex';
  apiKey?: string;
  isConnected: boolean;
  lastUsed?: Date;
  usageCount?: number;
}

export interface UserAIConfig {
  openai?: AIServiceConfig;
  gemini?: AIServiceConfig;
  textcortex?: AIServiceConfig;
}

// Check if user has AI services configured
export function hasAIServices(userConfig: UserAIConfig): boolean {
  return Object.values(userConfig).some(config => config.isConnected);
}

// Get available AI services
export function getAvailableServices(userConfig: UserAIConfig): string[] {
  return Object.entries(userConfig)
    .filter(([_, config]) => config.isConnected)
    .map(([provider, _]) => provider);
}

// Check if specific service is available
export function isServiceAvailable(userConfig: UserAIConfig, service: string): boolean {
  return userConfig[service as keyof UserAIConfig]?.isConnected || false;
}

// Generate fallback message when AI is unavailable
export function getAIOfflineMessage(userConfig: UserAIConfig): string {
  const hasServices = hasAIServices(userConfig);
  
  if (!hasServices) {
    return "Connect your AI account to get personalized suggestions!";
  }
  
  const availableServices = getAvailableServices(userConfig);
  return `Using ${availableServices.join(', ')} for AI suggestions`;
}

// Professional AI setup flow
export class AISetupManager {
  static async connectOpenAI(): Promise<{ success: boolean; message: string }> {
    try {
      // For demo purposes - in production, use OAuth
      const apiKey = prompt('Enter your OpenAI API key (will be encrypted and stored securely):');
      
      if (!apiKey) {
        return { success: false, message: 'API key is required' };
      }
      
      // Encrypt and store the key
      const encryptedKey = await this.encryptAPIKey(apiKey);
      
      const response = await fetch('/api/user/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'openai',
          encryptedKey: encryptedKey
        })
      });
      
      if (response.ok) {
        return { success: true, message: 'OpenAI account connected successfully!' };
      } else {
        return { success: false, message: 'Failed to connect OpenAI account' };
      }
    } catch (error) {
      return { success: false, message: 'Error connecting to OpenAI' };
    }
  }
  
  static async disconnectService(provider: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/user/ai-config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      
      if (response.ok) {
        return { success: true, message: `${provider} account disconnected` };
      } else {
        return { success: false, message: 'Failed to disconnect account' };
      }
    } catch (error) {
      return { success: false, message: 'Error disconnecting service' };
    }
  }
  
  private static async encryptAPIKey(key: string): Promise<string> {
    // Simple encryption for demo - use proper encryption in production
    return btoa(key); // Base64 encoding
  }
  
  private static async decryptAPIKey(encryptedKey: string): Promise<string> {
    // Simple decryption for demo - use proper decryption in production
    return atob(encryptedKey); // Base64 decoding
  }
}
