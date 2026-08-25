import os
import json
import urllib.request
from datetime import datetime

# Add all your league IDs here
LEAGUE_IDS = [10982, 93782] 

def fetch_json(url):
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode('utf-8'))

try:
    print(f"[{datetime.now()}] Fetching FPL static stats...")
    
    # 1. Fetch Season Bootstrap Static Stats (Global)
    os.makedirs("data", exist_ok=True)
    bootstrap = fetch_json("https://draft.premierleague.com/api/bootstrap-static")
    with open("data/bootstrap-static.json", "w") as f:
        json.dump(bootstrap, f)

    # 2. Fetch live stats per gameweek (Global)
    for gw in range(1, 39):
        try:
            live_stats = fetch_json(f"https://draft.premierleague.com/api/event/{gw}/live")
            with open(f"data/live_gw_{gw}.json", "w") as f:
                json.dump(live_stats, f)
        except Exception:
            break

    # 3. Loop through individual leagues and namespace their storage
    for league_id in LEAGUE_IDS:
        print(f"Fetching data for league {league_id}...")
        base_dir = f"data/leagues/{league_id}"
        lineups_dir = f"{base_dir}/lineups"
        os.makedirs(lineups_dir, exist_ok=True)

        league_details = fetch_json(f"https://draft.premierleague.com/api/league/{league_id}/details")
        with open(f"{base_dir}/league_details.json", "w") as f:
            json.dump(league_details, f)

        for gw in range(1, 39):
            # Check if gameweek exists/started for this league's matches
            gw_matches = [m for m in league_details.get("matches", []) if m["event"] == gw]
            if not gw_matches and gw > 5: # skip far future empty weeks if desired
                pass

            for entry in league_details.get("league_entries", []):
                entry_id = entry.get("entry_id")
                if not entry_id:
                    continue
                try:
                    lineup = fetch_json(f"https://draft.premierleague.com/api/entry/{entry_id}/event/{gw}")
                    with open(f"{lineups_dir}/entry_{entry_id}_gw_{gw}.json", "w") as f:
                        json.dump(lineup, f)
                except Exception:
                    pass

    print("Data update successful for all leagues!")

except Exception as e:
    print(f"Error updating data: {e}")
    exit(1)