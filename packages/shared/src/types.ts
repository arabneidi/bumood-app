// Shared types between web and mobile
export interface MoodEntry {
  id: string;
  userId: string;
  valence: number;
  energy: number;
  focus: number;
  stress: number;
  sleep?: number;
  notes?: string;
  activities: string;
  onPeriod?: boolean;
  periodDay?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  gender?: string;
  age?: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetValue?: number;
  currentValue: number;
  category: string;
  completed: boolean;
  createdAt: string;
}

