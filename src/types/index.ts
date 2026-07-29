export type UserRole = 'admin' | 'officer' | 'veterinarian' | 'farmer';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  organization: string | null;
  region: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Breed {
  id: string;
  name: string;
  species: 'cattle' | 'buffalo';
  origin_state: string | null;
  color_pattern: string | null;
  description: string | null;
  characteristics: string | null;
  created_at: string;
}

export interface Animal {
  id: string;
  user_id: string;
  animal_id_tag: string | null;
  owner_name: string;
  species: 'cattle' | 'buffalo';
  breed: string | null;
  gender: 'male' | 'female' | null;
  age_years: number | null;
  weight_kg: number | null;
  village: string | null;
  district: string | null;
  state: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  photo_url: string | null;
  vaccination_notes: string | null;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TopPrediction {
  breed: string;
  confidence: number;
}

export interface Prediction {
  id: string;
  user_id: string;
  image_url: string | null;
  species: string | null;
  predicted_breed: string;
  confidence: number;
  top_predictions: TopPrediction[];
  inference_ms: number | null;
  animal_id: string | null;
  created_at: string;
}

export interface Vaccination {
  id: string;
  animal_id: string;
  user_id: string;
  vaccine_name: string;
  date_given: string | null;
  next_due: string | null;
  notes: string | null;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  animal_id: string;
  user_id: string;
  record_date: string | null;
  condition: string | null;
  treatment: string | null;
  veterinarian: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity: string | null;
  details: string | null;
  created_at: string;
}

export interface BreedRecognitionResult {
  breed: string;
  confidence: number;
  top_predictions: TopPrediction[];
  species: 'cattle' | 'buffalo';
  inference_ms: number;
}
