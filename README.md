# Paradaux Analytics 

A custom blog analytics software built for Astro / React using Supabase with Privacy in Mind. 

I'll be documenting this, providing a setup guide and explaining the thought process behind it in a blog post, eventually.
I sorta need this to be done before launching my blog again.

## Architecture
- Supabase [or a Postgres offering of your choosing]
**N.B**: If you end up ditching supabase you'll need to re-implement the edge function. 
- An API, in our case a Supabase Edge function which takes events from the client libraries
    - Checks to see if its a duplicate event
        - If the same session ID created an identical event in the past 15 minutes, dup and rej
    - Checks for abuse [sending fake analytics]
- Client libraries
    - Sends events to the API

## Event Structure

An event looks like this:
POST /analytics
Bearer <anon token>
```json
{
  "event_type": "start|view",
  "id": "<uuid4>",
  "event_message": { "initial_page": "??", "origin": "???", "path": "????" },
  "agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/113.0"
}
```

The anon token is to permit access to the edge function, it is safe to distrobute publicly by design, the edge function itself makes use of the priviliged equivalent (in Supabase lingo it's the service role)

The event type is used to distinguish between a new session vs a follow up on a previously existing session. The first event
sent by a session id should be of type start and all subsequent should be view. These two events are used for pageviews, it's 
free to extend across multiple different types of metrics. 

`id` is a uuidv4 which should be completely random and not seeded with any personal information. 

event message is abitrary jsonb however it should be consitent by event type to allow for querying the contents of the json directly. 

The agent is the user agent of the client, it might be interesting to have. 

In a perfect world you should null out the session IDs and fuzzy the created timestamps after the 15 minute duplication checking period 
as there's realistically no reason to have second by second analytics, and it helps anonymise clients as theoritcally the server could
identify users by matching connection times. This currently isn't accounted for. 

## Todo
- Astro/React client lib -> to actually create the metrics
   - This sorta already exists in the paradaux.io repo it could easily be taken.
- Privacy Policy template for users (not legal advice) 
    - This already sorta exists in the form of the paradaux.io privacy policy
- Dashboard to actually see the metrics 
    - probably a ways away, I will get my own metrics via sql queries for now ;]
