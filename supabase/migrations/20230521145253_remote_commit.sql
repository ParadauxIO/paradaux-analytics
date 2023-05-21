set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_start_count_past_15_minutes()
 RETURNS TABLE(id uuid, start_count bigint)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
    SELECT public.paradaux_analytics.id, COUNT(*) AS start_count
    FROM public.paradaux_analytics
    WHERE event_type = 'start' AND created >= NOW() - INTERVAL '15 minutes'
    GROUP BY public.paradaux_analytics.id;
END;
$function$
;


