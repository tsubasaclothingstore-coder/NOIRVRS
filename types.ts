

export enum SceneRole {
  SETUP = 'setup',
  REVEAL = 'reveal',
  CONFLICT = 'conflict',
  SHIFT = 'shift',
  ENDING = 'ending'
}

export interface StoryPage {
  page_number: number;
  scene_role: SceneRole;
  scene_summary: string;
  text: string;
  word_count_page: number;
  image_url?: string;
  image_prompt?: string;
}

export interface RitualPage {
  page_number: number;
  text: string;
  image_url?: string;
}

export interface DailyStory {
  id: string; // YYYY-MM-DD or unique case ID
  title: string;
  story_year: string;
  variant_id: string;
  location: string;
  pages: StoryPage[];
  archetype: string;
  generated_at?: any;
}

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface UserProfile {
  citizenId: string;
  installationDate: number; 
  lastLoginAt: number;
  isSubscribed: boolean;
  subscriptionTier: SubscriptionTier;
  plan?: string;
  completedStories: string[];
  total_cases: number;
  current_streak: number;
  lastCompletedDate?: string;
  threads_remaining: number;
  cycle_start: number;
  cycle_end: number;
  last_generation_at?: any;
  notificationsEnabled?: boolean;
  /** Tracks the currently active/unfinished case session */
  activeCaseId?: string;
}