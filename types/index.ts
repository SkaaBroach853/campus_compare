export interface College {
  id: string;
  name: string;
  location: string;
  fees: number;
  rating: number;
  placement_percent: number;
  description: string;
  image_url: string;
  courses: string[];
  created_at: string;
}

export interface SavedCollege {
  id: string;
  user_id: string;
  college_id: string;
  created_at: string;
  colleges?: College;
}

export interface User {
  id: string;
  email: string;
  created_at?: string;
}
