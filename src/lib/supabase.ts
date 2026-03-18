import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  role: 'citizen' | 'responder' | 'admin';
  county: string;
  phone: string | null;
  created_at: string;
};

export type Incident = {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  incident_type: string;
  severity_self: number;
  ai_severity: number | null;
  ai_safety_guide: string | null;
  lat: number | null;
  lng: number | null;
  county: string;
  photo_url: string | null;
  status: 'pending' | 'assigned' | 'resolved';
  created_at: string;
  profiles?: Profile;
};

export type Assignment = {
  id: string;
  incident_id: string;
  responder_id: string;
  assigned_at: string;
  notes: string | null;
};

export type Message = {
  id: string;
  incident_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans-Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga',
  'Wajir', 'West Pokot'
];

export const INCIDENT_TYPES = [
  'Flood',
  'Landslide',
  'Displacement',
  'Infrastructure Damage',
  'Medical Emergency',
];

export function getSeverityColor(severity: number): string {
  if (severity >= 5) return 'severity-critical';
  if (severity >= 4) return 'severity-high';
  if (severity >= 3) return 'severity-medium';
  return 'severity-low';
}

export function getSeverityLabel(severity: number): string {
  if (severity >= 5) return 'Critical';
  if (severity >= 4) return 'High';
  if (severity >= 3) return 'Medium';
  if (severity >= 2) return 'Low';
  return 'Minimal';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'warning';
    case 'assigned': return 'primary';
    case 'resolved': return 'success';
    default: return 'muted';
  }
}

// Mock AI triage
export async function triageIncident(_incident: Partial<Incident>): Promise<{ severity: number; safetyGuide: string }> {
  await new Promise(resolve => setTimeout(resolve, 2500));
  const severity = Math.floor(Math.random() * 3) + 3;
  const guides: Record<number, string> = {
    3: "Move to higher ground if near water. Avoid walking through flowing water. Stay informed via local radio. Prepare an emergency kit with water, food, and medication.",
    4: "Evacuate immediately if water levels are rising. Do not attempt to cross flooded roads. Contact emergency services. Move important documents to waterproof containers.",
    5: "CRITICAL: Evacuate NOW. Move to the nearest designated shelter. Avoid all contact with floodwater — it may be contaminated. Call 999 or your county emergency hotline immediately.",
  };
  return { severity, safetyGuide: guides[severity] || guides[3] };
}
