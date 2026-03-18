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

// Real AI triage using Gemini 1.5 Flash
export async function triageIncident(incident: Partial<Incident>): Promise<{ severity: number; safetyGuide: string }> {
  try {
    const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured.");
    }

    const prompt = `
      You are an emergency disaster response AI for Kenya. 
      Analyze the following incident report and provide:
      1. A severity score from 1 (minor) to 5 (critical/life-threatening).
      2. Life-saving safety guidance for the citizen in 2-3 short, clear sentences.

      Title: ${incident.title}
      Description: ${incident.description}
      Type: ${incident.incident_type}
      County: ${incident.county}

      Return only a JSON object like this:
      {"severity": 4, "safetyGuide": "Your guide here..."}
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: "application/json" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error("Failed to reach AI triage service.");
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("AI failed to generate a response.");
    }

    const result = JSON.parse(textResult);
    return {
      severity: Number(result.severity) || 3,
      safetyGuide: result.safetyGuide || "Stay safe and wait for responder contact."
    };
  } catch (error) {
    console.error("Triage error:", error);
    // Fallback to minimal safety info if AI fails
    return { 
      severity: incident.severity_self || 3, 
      safetyGuide: "Stay calm. We have received your report. If in immediate danger, move to the nearest safe ground and contact local authorities." 
    };
  }
}

export async function sendBroadcast(subject: string, message: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('send-broadcast', {
      body: { subject, message }
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Edge function returned failure');
    }

    return { success: true };
  } catch (err: any) {
    console.error("Broadcast error:", err);
    return { success: false, error: err.message };
  }
}
