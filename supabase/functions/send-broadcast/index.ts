import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subject, message, targetUserIds, targetEmails } = await req.json()
    console.log(`Broadcast Request: subject="${subject}", targets=${targetUserIds?.length || 0} IDs, ${targetEmails?.length || 0} emails`)

    // 1. Initialize Supabase Admin Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 2. Determine recipient user IDs
    let bccList: string[] = []

    if (targetEmails && targetEmails.length > 0) {
      bccList.push(...targetEmails)
    }

    if (targetUserIds && targetUserIds.length > 0) {
      // Fetch specifically requested users
      const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      })
      if (usersError) throw usersError
      const targetUsers = users.filter((u: any) => targetUserIds.includes(u.id) && u.email)
      bccList.push(...targetUsers.map((u: any) => u.email))
    }

    // 3. Fallback: If no targets provided, find ALL responders/admins
    if (bccList.length === 0 && (!targetUserIds || targetUserIds.length === 0) && (!targetEmails || targetEmails.length === 0)) {
      const { data: profiles, error: profileError } = await supabaseClient
        .from('profiles')
        .select('user_id')
        .in('role', ['responder', 'admin'])

      if (profileError) throw profileError
      const responderIds = profiles.map((p: any) => p.user_id)

      const { data: { users }, error: usersError } = await supabaseClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      })
      if (usersError) throw usersError
      
      const matchedEmails = users
        .filter((u: any) => responderIds.includes(u.id) && u.email)
        .map((u: any) => u.email)
      
      bccList.push(...matchedEmails)
    }

    // 4. De-duplicate emails
    bccList = [...new Set(bccList)]

    if (bccList.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No recipients found matching criteria.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Build Dynamic Recipients
    const to = bccList.length === 1 ? [bccList[0]] : ['alerts@cnbcode.com']
    const bcc = bccList.length === 1 ? [] : bccList

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set")

    const resRequest = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Kaa-Rada Alerts <alerts@cnbcode.com>',
        to: to,
        bcc: bcc,
        subject: `[Kaa-Rada] ${subject}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; border-radius: 20px; border: 1px solid #1e293b; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="background: ${subject.toLowerCase().includes('safety') ? '#38bdf8' : '#ef4444'}; color: #fff; padding: 6px 12px; border-radius: 99px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                ${subject.toLowerCase().includes('safety') ? 'Responder Coordinated Guide' : 'Priority Action Required'}
              </span>
              <h2 style="margin-top: 15px; color: #fff; font-size: 24px;">Kaa-Rada Hub Notification</h2>
            </div>
            
            <div style="border-left: 4px solid ${subject.toLowerCase().includes('safety') ? '#38bdf8' : '#ef4444'}; background: rgba(255,255,255,0.03); padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <p style="margin-top: 0; color: #94a3b8; font-size: 13px; text-transform: uppercase; font-weight: bold;">${subject}</p>
              <div style="color: #f1f5f9; font-size: 16px; line-height: 1.7; white-space: pre-wrap;">
                ${message}
              </div>
            </div>

            <div style="text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p>This message was dispatched via the Kaa-Rada Central Command System.</p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #1e293b;">
                <p>Stay updated and share live situation reports via our official portal:</p>
                <a href="https://kaarada.cnbcode.com" style="display: inline-block; background: #38bdf8; color: #000; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">Open Hub Dashboard</a>
              </div>
            </div>
          </div>
        `
      })
    })

    if (!resRequest.ok) {
      const err = await resRequest.json()
      throw new Error(err.message || 'Failed to send via Resend API')
    }

    return new Response(JSON.stringify({ success: true, recipients: bccList.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
