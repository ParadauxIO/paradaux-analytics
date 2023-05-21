import { corsHeaders } from '../_shared/cors.ts';

const respondJson = (json: any, status: number): Response => {
    return new Response(JSON.stringify(json), {
      status: status,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
}

export {respondJson}