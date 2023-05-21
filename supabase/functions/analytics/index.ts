import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PostgrestError, createClient } from "https://esm.sh/@supabase/supabase-js@2.22.0";
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const dateToSimpleTS = (date: Date): string => {
  return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
}

const log = (data: string|object|PostgrestError|null, error: boolean = false): void => {
  if (data == null) return;
  const message = `[${dateToSimpleTS(new Date())}] Analytics: ${JSON.stringify(data)}`;
  error ? console.error(message) : console.log(message);
}

const createErrorResponse = (message: string, status: number): Response => {
  return new Response(JSON.stringify({error: message}), {
    status: status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

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

  const duplicateErrorMessage = 'Duplicate entry, this event has already been submitted in the past 15 mins';
  
  if (body.event_type === "start") {
    const { data, error } = await supabase.rpc('get_start_count_past_15_minutes');
    log(data);
    log(error, true);
    if (data.some((obj: any) => obj.id === body.id)) {
      return createErrorResponse(duplicateErrorMessage, 409);
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
      return createErrorResponse(duplicateErrorMessage, 409);
    }
  }

  const {error} = await supabase.from("paradaux_analytics")
                                .insert(body);

  if (error) {
    return createErrorResponse("Invalid data provided", 400);
  }

  return new Response(
    JSON.stringify(body),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 },
  );  
});