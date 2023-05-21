import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";
import log from "../_shared/log.ts"
import { respondJson } from "../_shared/respond.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { duplicateError, invalidBody } from "../_shared/errors.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const handleBodyData = async (req: any): Promise<any> => {
  const body = await req.json();
  body.agent = req.headers.get("user-agent");
  return body;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const body = await handleBodyData(req);
  log('New Request at /analytics:\n' + JSON.stringify(body));

  if (body.event_type === "start") {
    const { data, error } = await supabase.rpc('get_start_count_past_15_minutes');
    log(data);
    log(error, true);
    if (data.some((obj: any) => obj.id === body.id)) {
      return respondJson(duplicateError, 409);
    }
  }

  if (body.event_type === "view") {
    const { data, error } = await supabase.rpc('check_recent_view_event', {
      session_id: body.id,
      initial_page: body.event_message.initial_page,
      origin: body.event_message.origin,
      path: body.event_message.path
    });
    log(data);
    log(error, true);
    if (data === true) {
      return respondJson(duplicateError, 409);
    }
  }

  const { error } = await supabase.from("paradaux_analytics").insert(body);

  if (error) {
    return respondJson(invalidBody, 400);
  }

  return respondJson({
    "message": "Created event entry succesfully."
  }, 201)
});