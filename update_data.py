import os
import json
import urllib.request
from datetime import datetime

LEAGUE_ID = 10982
os.makedirs("data/lineups", exist_ok=True)

def fetch_json(url):
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

try:
    print(f"[{datetime.now()}] Fetching FPL data...")
    
    # 1. Fetch League Details
    league_details = fetch_json(f"https://draft.premierleague.com/api/league/{LEAGUE_ID}/details")
    with open("data/league_details.json", "w") as f:
        json.dump(league_details, f)

    # 2. Fetch Season Bootstrap Static Stats
    bootstrap = fetch_json("https://draft.premierleague.com/api/bootstrap-static")
    with open("data/bootstrap-static.json", "w") as f:
        json.dump(bootstrap, f)

    # 3. Determine current gameweek and fetch live stats/lineups
    # (or loop through relevant gameweeks like current + recent)
    for gw in range(1, 39):
        try:
            live_stats = fetch_json(f"https://draft.premierleague.com/api/event/{gw}/live")
            with open(f"data/live_gw_{gw}.json", "w") as f:
                json.dump(live_stats, f)
        except Exception:
            # Stop if gameweek hasn't started or doesn't exist yet
            break

        # Fetch lineups for all entries for this gameweek
        for entry in league_details.get("league_entries", []):
            entry_id = entry.get("entry_id")
            if not entry_id:
                continue
            try:
                lineup = fetch_json(f"https://draft.premierleague.com/api/entry/{entry_id}/event/{gw}")
                with open(f"data/lineups/entry_{entry_id}_gw_{gw}.json", "w") as f:
                    json.dump(lineup, f)
            except Exception:
                pass

    print("Data update successful!")

except Exception as e:
    print(f"Error updating data: {e}")
    exit(1)