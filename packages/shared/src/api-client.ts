// API client for both web and mobile
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
  }

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Mood entries
  async getMoodEntries(): Promise<any[]> {
    return this.fetch('/mood-entries');
  }

  async createMoodEntry(data: any): Promise<any> {
    return this.fetch('/mood-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMoodEntry(id: string, data: any): Promise<any> {
    return this.fetch(`/mood-entries`, {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    });
  }

  // User
  async getUser(): Promise<any> {
    return this.fetch('/user');
  }

  // Goals
  async getGoals(): Promise<any[]> {
    return this.fetch('/goals');
  }
}

export const apiClient = new ApiClient();

