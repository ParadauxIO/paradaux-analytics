// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { PostgrestError, createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0"
import { corsHeaders } from '../_shared/cors.ts'
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const dateToSimpleTS = (date: Date) => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${day}-${month} ${hours}:${minutes}:${seconds}`;
}

const log = (data: string|object|PostgrestError|null, error: boolean) => {
  if (data == null) return;

  if (error) {
    console.error(`[${dateToSimpleTS(new Date())}] Analytics: `, data)
    return;
  }

  console.log(`[${dateToSimpleTS(new Date())}] Analytics: `, data)
}

serve(async (req) => {
  // Handle CORS requests from the browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Parse the body and stick the user agent into it.
  const body = await req.json()
  body.agent = req.headers.get("user-agent");

  // Log
  log('New Request at /analytics:\n' + JSON.stringify(body), false)

  // Run checks
  if (body.event_type == "start") {
    const { data, error } = await supabase.rpc('get_start_count_past_15_minutes')
    if (data.some(obj => obj.id === body.id)) {
      return new Response(JSON.stringify({error: 'Duplicate entry, this event has already been submitted in the past 15 mins'}), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    log(JSON.stringify(data), false);
    log(JSON.stringify(error), true);

    // todo
  }

  if (body.event_type == "view") {
    const { data, error } = await supabase.rpc('check_recent_view_event', {
      session_id: body.id,
      initial_page: body.event_message.initial_page,
      origin: body.event_message.origin,
      path: body.event_message.path
    })

    if (data === true) {
      return new Response(JSON.stringify({error: 'Duplicate entry, this event has already been submitted in the past 15 mins'}), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    };
    
    log(data, false);
    log(error, true);

    // check_recent_view_event(id UUID, initial_page TEXT, origin TEXT, path TEXT) 
    // todo
  }

  const {error} = await supabase.from("paradaux_analytics")
                                .insert(body);

  if (error) {
    return new Response(JSON.stringify({
      "error": "Invalid data provided"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 418 },
  )  
})

// To invoke:
