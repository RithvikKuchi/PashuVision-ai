/*
# PashuVision AI — Core Schema

## Purpose
Breed recognition system for Indian cattle and buffaloes (SIH25004).
Stores user profiles, breed master data, animal records, predictions,
vaccinations, medical records, and activity logs.

## 1. New Tables
- `profiles` — extends auth.users with role (admin/officer/veterinarian/farmer) and full name.
- `breeds` — master data for all recognized Indian cattle & buffalo breeds.
- `animals` — digital animal profiles (owner, species, breed, gender, age, weight, location, photo).
- `predictions` — AI breed prediction history (image, breed, confidence, top-3, latency).
- `vaccinations` — vaccination records linked to animals.
- `medical_records` — medical notes linked to animals.
- `activity_logs` — audit trail of user actions.

## 2. Security (RLS)
- All tables have RLS enabled.
- Owner-scoped CRUD on animals, predictions, vaccinations, medical_records, activity_logs.
- Admins (role='admin' in profiles) can read/update/delete all rows.
- breeds table is readable by all authenticated users (master reference data).
- profiles: each user reads/updates own profile; admins read all.

## 3. Notes
- owner columns default to auth.uid() so client inserts omitting user_id succeed.
- breed seeding is performed separately after table creation.
*/

-- Profiles: role + display name extension of auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'farmer' CHECK (role IN ('admin','officer','veterinarian','farmer')),
  organization text,
  region text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "profiles_insert_self" ON profiles;
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Breeds master data
CREATE TABLE IF NOT EXISTS breeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  species text NOT NULL CHECK (species IN ('cattle','buffalo')),
  origin_state text,
  color_pattern text,
  description text,
  characteristics text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE breeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "breeds_read_all" ON breeds;
CREATE POLICY "breeds_read_all" ON breeds FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "breeds_admin_write" ON breeds;
CREATE POLICY "breeds_admin_write" ON breeds FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Animals
CREATE TABLE IF NOT EXISTS animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  animal_id_tag text,
  owner_name text NOT NULL DEFAULT '',
  species text NOT NULL CHECK (species IN ('cattle','buffalo')),
  breed text,
  gender text CHECK (gender IN ('male','female')),
  age_years numeric,
  weight_kg numeric,
  village text,
  district text,
  state text,
  gps_lat numeric,
  gps_lng numeric,
  photo_url text,
  vaccination_notes text,
  medical_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "animals_select_own_or_admin" ON animals;
CREATE POLICY "animals_select_own_or_admin" ON animals FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "animals_insert_own" ON animals;
CREATE POLICY "animals_insert_own" ON animals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "animals_update_own_or_admin" ON animals;
CREATE POLICY "animals_update_own_or_admin" ON animals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "animals_delete_own_or_admin" ON animals;
CREATE POLICY "animals_delete_own_or_admin" ON animals FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE INDEX IF NOT EXISTS animals_user_id_idx ON animals(user_id);
CREATE INDEX IF NOT EXISTS animals_breed_idx ON animals(breed);

-- Predictions
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text,
  species text,
  predicted_breed text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  top_predictions jsonb NOT NULL DEFAULT '[]'::jsonb,
  inference_ms integer,
  animal_id uuid REFERENCES animals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "predictions_select_own_or_admin" ON predictions;
CREATE POLICY "predictions_select_own_or_admin" ON predictions FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "predictions_insert_own" ON predictions;
CREATE POLICY "predictions_insert_own" ON predictions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "predictions_delete_own_or_admin" ON predictions;
CREATE POLICY "predictions_delete_own_or_admin" ON predictions FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE INDEX IF NOT EXISTS predictions_user_id_idx ON predictions(user_id);
CREATE INDEX IF NOT EXISTS predictions_created_at_idx ON predictions(created_at desc);

-- Vaccinations
CREATE TABLE IF NOT EXISTS vaccinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  vaccine_name text NOT NULL,
  date_given date,
  next_due date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vacc_select_own_or_admin" ON vaccinations;
CREATE POLICY "vacc_select_own_or_admin" ON vaccinations FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "vacc_insert_own" ON vaccinations;
CREATE POLICY "vacc_insert_own" ON vaccinations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "vacc_update_own_or_admin" ON vaccinations;
CREATE POLICY "vacc_update_own_or_admin" ON vaccinations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "vacc_delete_own_or_admin" ON vaccinations;
CREATE POLICY "vacc_delete_own_or_admin" ON vaccinations FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Medical records
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id uuid NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  record_date date,
  condition text,
  treatment text,
  veterinarian text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "med_select_own_or_admin" ON medical_records;
CREATE POLICY "med_select_own_or_admin" ON medical_records FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "med_insert_own" ON medical_records;
CREATE POLICY "med_insert_own" ON medical_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "med_update_own_or_admin" ON medical_records;
CREATE POLICY "med_update_own_or_admin" ON medical_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "med_delete_own_or_admin" ON medical_records;
CREATE POLICY "med_delete_own_or_admin" ON medical_records FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  entity text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select_own_or_admin" ON activity_logs;
CREATE POLICY "logs_select_own_or_admin" ON activity_logs FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "logs_insert_own" ON activity_logs;
CREATE POLICY "logs_insert_own" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS logs_user_id_idx ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS logs_created_at_idx ON activity_logs(created_at desc);
