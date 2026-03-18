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

    // 5. Send Email via Resend
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
        to: ['alerts@cnbcode.com'], // Primary recipient
        bcc: bccList, // Real responders BCC'd
        subject: `[Kaa-Rada] ${subject}`,
        html: `
          <div style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 16px; border: 1px solid #334155;">
            <p style="color: #fb7185; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Kaa-Rada Critical Alert</p>
            <h2 style="margin-top: 0; color: #f8fafc;">${subject}</h2>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; margin: 20px 0; line-height: 1.6;">
              ${message}
            </div>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8;">
              This is an automated system notification from your command center.
              <br />Log in to the <a href="https://kaarada.cnbcode.com" style="color: #38bdf8; text-decoration: none;">Responder Dashboard</a> for full details.
            </p>
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
