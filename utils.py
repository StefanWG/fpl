import requests
import pandas as pd

LEAGUE_ID = "106254"


def get_league_details():
    return requests.get(f"https://draft.premierleague.com/api/league/{LEAGUE_ID}/details").json()


def get_league_matches(league_details):
    matches = {}
    for match in league_details["matches"]:
        gw = match["event"]
        if gw not in matches:
            matches[gw] = []
        matches[gw].append(match)

    return matches

def get_league_standings(matches):
    standings = {}
    for gw in matches:
        for match in matches[gw]:
            if match["finished"] == False:
                continue
            # Team 1
            team1_id = match["league_entry_1"]
            team1_points = match["league_entry_1_points"]

            # Team 2
            team2_id = match["league_entry_2"]
            team2_points = match["league_entry_2_points"]

            # Initialize teams in standings if not present
            if team1_id not in standings:
                standings[team1_id] = {
                    "id": team1_id,
                    "GF": 0,
                    "GA": 0,
                    "won": 0,
                    "drawn": 0,
                    "lost": 0,
                    "total_points": 0,

                }
            if team2_id not in standings:
                standings[team2_id] = {
                    "id": team2_id,
                    "GF": 0,
                    "GA": 0,
                    "won": 0,
                    "drawn": 0,
                    "lost": 0,
                    "total_points": 0,

                }
            # Update standings for team 1
            standings[team1_id]["GF"] += team1_points
            standings[team1_id]["GA"] += team2_points
            points1 = 3 if team1_points > team2_points else 1 if team1_points == team2_points else 0
            standings[team1_id]["total_points"] += points1
            if points1 == 3:
                standings[team1_id]["won"] += 1
            elif points1 == 1:
                standings[team1_id]["drawn"] += 1
            else:
                standings[team1_id]["lost"] += 1    

            # Update standings for team 2
            standings[team2_id]["GF"] += team2_points
            standings[team2_id]["GA"] += team1_points
            points2 = 3 if team2_points > team1_points else 1 if team2_points == team1_points else 0
            standings[team2_id]["total_points"] += points2
            if points2 == 3:
                standings[team2_id]["won"] += 1
            elif points2 == 1:
                standings[team2_id]["drawn"] += 1
            else:
                standings[team2_id]["lost"] += 1

    # Convert to list and sort by total points descending
    standings = pd.DataFrame(standings).T
    standings = standings.sort_values(by="total_points", ascending=False)


    return standings


def get_teams(league_details):
    teams = {}
    for entry in league_details["league_entries"]:
        teams[entry["id"]] = entry["entry_name"]
    return teams

def add_team_names(standings, teams):
    standings["Team"] = standings["id"].map(teams)
    standings["Team"] = standings["Team"].fillna("Average")
    return standings[["Team", "total_points", "won", "drawn", "lost", "GF", "GA"]]

if __name__ == "__main__":
    league_details = get_league_details()
    matches = get_league_matches(league_details)
    standings = get_league_standings(matches)
    teams = get_teams(league_details)
    standings = add_team_names(standings, teams)
    print(matches[5])
