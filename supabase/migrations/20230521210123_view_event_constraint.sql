CREATE OR REPLACE FUNCTION check_recent_view_event(session_id UUID, initial_page TEXT, origin TEXT) 
RETURNS BOOLEAN AS $$
DECLARE
    recent_event_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM "public"."paradaux_analytics" 
        WHERE "paradaux_analytics"."id" = session_id
        AND "event_type" = 'view'
        AND "event_message"->>'initial_page' = initial_page
        AND "event_message"->>'origin' = origin
        AND "created" > NOW() - INTERVAL '15 minutes'
    ) INTO recent_event_exists;
    
    RETURN recent_event_exists;
END;
$$ LANGUAGE plpgsql;
