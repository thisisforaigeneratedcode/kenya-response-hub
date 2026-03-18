import { triageIncident } from './src/lib/supabase.js'
import dotenv from 'dotenv'

dotenv.config()

async function testTriage() {
  console.log('Testing AI Triage with Gemini...')
  const incident = {
    title: 'Severe Flooding in Nyando',
    description: 'The river has burst its banks and many houses are submerged. People are trapped on rooftops and need immediate evacuation.',
    incident_type: 'Flood',
    county: 'Kisumu'
  }

  try {
    const result = await triageIncident(incident)
    console.log('AI Triage Result:', JSON.stringify(result, null, 2))
    if (result.severity >= 4) {
      console.log('✅ AI correctly identified high severity.')
    } else {
      console.log('⚠️ AI severity was lower than expected, check prompt.')
    }
  } catch (error) {
    console.error('❌ Triage test failed:', error)
  }
}

testTriage()
