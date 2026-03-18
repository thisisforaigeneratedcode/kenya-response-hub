-- Drop existing tables in reverse dependency order (safe re-run)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.assignments CASCADE;
DROP TABLE IF EXISTS public.incidents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can upload incident photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read incident photos" ON storage.objects;

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'responder', 'admin')),
  county TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

-- ─── INCIDENTS ──────────────────────────────────────────────
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_type TEXT NOT NULL,
  severity_self INT NOT NULL DEFAULT 1 CHECK (severity_self BETWEEN 1 AND 5),
  ai_severity INT CHECK (ai_severity BETWEEN 1 AND 5),
  ai_score INT CHECK (ai_score BETWEEN 1 AND 5),
  ai_reasoning TEXT,
  ai_flood_type TEXT,
  ai_affected_count INT,
  ai_safety_guide TEXT,
  safety_tips JSONB,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  county TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Citizens can insert incidents" ON public.incidents;
DROP POLICY IF EXISTS "Citizens can read own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Responders can read all incidents" ON public.incidents;
DROP POLICY IF EXISTS "Responders can update incidents" ON public.incidents;

CREATE POLICY "Citizens can insert incidents" ON public.incidents
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Citizens can read own incidents" ON public.incidents
  FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Responders can read all incidents" ON public.incidents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('responder', 'admin'))
  );
CREATE POLICY "Responders can update incidents" ON public.incidents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('responder', 'admin'))
  );

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.incidents;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── ASSIGNMENTS ─────────────────────────────────────────────
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  responder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Responders can insert assignments" ON public.assignments;
DROP POLICY IF EXISTS "Responders can read assignments" ON public.assignments;
DROP POLICY IF EXISTS "Citizens can read own incident assignments" ON public.assignments;

CREATE POLICY "Responders can insert assignments" ON public.assignments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('responder', 'admin'))
  );
CREATE POLICY "Responders can read assignments" ON public.assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('responder', 'admin'))
  );
CREATE POLICY "Citizens can read own incident assignments" ON public.assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id AND i.reporter_id = auth.uid())
  );

-- ─── MESSAGES ────────────────────────────────────────────────
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert messages on their incidents" ON public.messages;
DROP POLICY IF EXISTS "Citizens can read messages on own incidents" ON public.messages;
DROP POLICY IF EXISTS "Responders can read all messages" ON public.messages;

CREATE POLICY "Users can insert messages on their incidents" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Citizens can read messages on own incidents" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.incidents i WHERE i.id = incident_id AND i.reporter_id = auth.uid())
  );
CREATE POLICY "Responders can read all messages" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role IN ('responder', 'admin'))
  );

-- ─── SHELTERS ────────────────────────────────────────────────
CREATE TABLE public.shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  county TEXT NOT NULL,
  capacity INT,
  contact TEXT,
  type TEXT CHECK (type IN ('shelter', 'hospital', 'relief_centre')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shelters" ON public.shelters
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage shelters" ON public.shelters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

-- ─── ALERTS ──────────────────────────────────────────────────
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('email', 'sms')),
  recipient TEXT,
  sent_at TIMESTAMPTZ,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read alerts" ON public.alerts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
  );

-- ─── REALTIME ────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;

-- ─── STORAGE ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-photos', 'incident-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload incident photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'incident-photos');
CREATE POLICY "Anyone can read incident photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'incident-photos');

-- ─── SEED: SHELTERS ──────────────────────────────────────────
INSERT INTO public.shelters (name, lat, lng, county, capacity, contact, type) VALUES
  ('Nairobi Red Cross Centre', -1.2921, 36.8219, 'Nairobi', 500, '0800720601', 'relief_centre'),
  ('Kenyatta National Hospital', -1.3010, 36.8073, 'Nairobi', 200, '0202726300', 'hospital'),
  ('Kisumu Social Hall Shelter', -0.1022, 34.7617, 'Kisumu', 300, '0572021000', 'shelter'),
  ('Mombasa Relief Centre', -4.0435, 39.6682, 'Mombasa', 400, '0412230000', 'relief_centre'),
  ('Nakuru County Shelter', -0.3031, 36.0800, 'Nakuru', 250, '0512212000', 'shelter'),
  ('Eldoret Regional Hospital', 0.5200, 35.2699, 'Uasin Gishu', 150, '0532033000', 'hospital'),
  ('Kisumu District Hospital', -0.0917, 34.7680, 'Kisumu', 180, '0572021500', 'hospital'),
  ('Mombasa County Shelter', -4.0500, 39.6600, 'Mombasa', 350, '0412231000', 'shelter');