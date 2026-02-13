
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
  image_url: string;
}

export interface RitualPage {
  page_number: number;
  text: string;
  image_url?: string;
}

export interface DailyStory {
  id: string; // YYYY-MM-DD
  title: string;
  location: string;
  story_year: string;
  variant_id: string;
  archetype: string;
  pages: StoryPage[];
  dropTimestamp: number;
  activeUntil: number;
}

export interface UserProfile {
  id: string;
  installationDate: number;
  isSubscribed: boolean;
  pushToken?: string;
  completedDates: string[];
}
