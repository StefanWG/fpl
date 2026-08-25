getLeagueDetails().then(async data => {
    let matches = data["matches"];
    let standings = {};
    
    // Track weekly scores per team to calculate xPoints
    // Structure: { gameweek: { teamId: points } }
    let weeklyScores = {};

    let latestFinishedGW = 1;
    let inProgressGW = null;

    for (let match of matches) {
        if (match["finished"]) {
            latestFinishedGW = Math.max(latestFinishedGW, match["event"]);
        } else {
            inProgressGW = match["event"];
            break; // Stop at the first in-progress match, as we only care about the latest
        }
    }

    CURRENT_GW = inProgressGW !== null ? inProgressGW : latestFinishedGW;

    // Initialize standings for all entries
    for (let entry of data["league_entries"]) {
        let entryId = entry["id"];
        standings[entryId] = { 
            "total_points": 0, 
            "x_points": 0, 
            "sub_points": 0, 
            "won": 0, 
            "drawn": 0, 
            "lost": 0, 
            "GF": 0, 
            "GA": 0 
        };
    }

    // Process matches & calculate bench metrics across finished gameweeks
    for (let match of matches) {
        let gw = match["event"];
        let t1 = match["league_entry_1"];
        let t2 = match["league_entry_2"];
        let p1 = match["league_entry_1_points"];
        let p2 = match["league_entry_2_points"];

        // Initialize weekly score tracker
        if (!weeklyScores[gw]) weeklyScores[gw] = {};
        weeklyScores[gw][t1] = p1;
        weeklyScores[gw][t2] = p2;

        if (!match["finished"]) continue;

        standings[t1]["GF"] += p1;
        standings[t1]["GA"] += p2;
        standings[t2]["GF"] += p2;
        standings[t2]["GA"] += p1;

        if (p1 > p2) {
            standings[t1]["won"] += 1;
            standings[t2]["lost"] += 1;
            standings[t1]["total_points"] += 3;
        } else if (p1 < p2) {
            standings[t2]["won"] += 1;
            standings[t1]["lost"] += 1;
            standings[t2]["total_points"] += 3;
        } else {
            standings[t1]["drawn"] += 1;
            standings[t2]["drawn"] += 1;
            standings[t1]["total_points"] += 1;
            standings[t2]["total_points"] += 1;
        }
    }

    // Calculate sub points using the 'subs' array in the lineup JSON for each finished gameweek up to CURRENT_GW
    for (let gw = 1; gw <= CURRENT_GW; gw++) {
        let liveStats = await getLiveStats(gw);
        
        for (let entry of data["league_entries"]) {
            let entryId = entry["id"];
            let entryDbId = entry["entry_id"];
            if (!entryDbId) continue;

            let lineupData = await getLineup(entryDbId, gw);
            // lineupData could be an array (picks only) or an object containing both picks and subs depending on your data structure.
            // Let's safely handle fetching the lineup JSON object.
            let subsList = [];
            
            try {
                const response = await fetch(`data/lineups/entry_${entryDbId}_gw_${gw}.json`);
                const jsonContent = await response.json();
                if (jsonContent && jsonContent["subs"]) {
                    subsList = jsonContent["subs"];
                }
            } catch (e) {
                // Fallback if file fetch fails or structure differs
                continue;
            }

            let gwSubPoints = 0;

            // Loop through the explicit automatic substitutions stored in the JSON
            subsList.forEach(sub => {
                let elementIn = sub["element_in"];
                // Verify if this substitution happened in the current gameweek
                if (sub["event"] === gw || !sub["event"]) {
                    let playerStats = liveStats[elementIn] ? liveStats[elementIn]["stats"] : {};
                    let points = playerStats["total_points"] || 0;
                    gwSubPoints += points;
                }
            });

            if (standings[entryId]) {
                standings[entryId]["sub_points"] += gwSubPoints;
            }
        }
    }

    // Compute xPoints (All-Play)
    for (let gw in weeklyScores) {
        let teamsInGW = Object.keys(weeklyScores[gw]);
        let gwFinished = matches.some(m => m["event"] == parseInt(gw) && m["finished"]);
        if (!gwFinished) continue;

        for (let i = 0; i < teamsInGW.length; i++) {
            let teamA = teamsInGW[i];
            let scoreA = weeklyScores[gw][teamA];
            if (!standings[teamA]) continue;

            for (let j = 0; j < teamsInGW.length; j++) {
                if (i === j) continue;
                let teamB = teamsInGW[j];
                let scoreB = weeklyScores[gw][teamB];

                if (scoreA > scoreB) {
                    standings[teamA]["x_points"] += 3 / (teamsInGW.length - 1);
                } else if (scoreA === scoreB) {
                    standings[teamA]["x_points"] += 1 / (teamsInGW.length - 1);
                }
                // Loss = 0 points added
            }
        }
    }
    
    let standings_ = [];
    for (let team in standings) {
        standings_.push({ "id": team, ...standings[team] });
    }
    // Sort primarily by real total points, then goal difference / GF, then xPoints
    standings_.sort((a, b) => b["total_points"] - a["total_points"] || (b["GF"] - a["GF"]) || (b["x_points"] - a["x_points"]));
    
    let standings_table = document.getElementById("standings").getElementsByTagName('tbody')[0];
    standings_table.innerHTML = "";

    for (let team of standings_) {
        let row = standings_table.insertRow();
        let found = false;
        for (let entry of data["league_entries"]) {
            if (entry["id"] == team["id"]) {
                if (entry["entry_name"] == null) {
                    entry["entry_name"] = "AVERAGE";
                }
                row.insertCell(0).innerHTML = entry["entry_name"];
                found = true;
                break;
            }
        }

        let totalPtsCell = row.insertCell(1);
        totalPtsCell.innerHTML = team.total_points;
        totalPtsCell.style.fontWeight = "600";
        totalPtsCell.style.color = "#0284c7";

        // Format xPoints neatly to 2 decimal place (e.g. 14.50 pts)
        let xPtsCell = row.insertCell(2);
        xPtsCell.innerHTML = (team.x_points).toFixed(2);
        xPtsCell.style.fontWeight = "600";
        if (team.x_points > team.total_points) {
            xPtsCell.style.color = "#16a34a"; // green for overperforming
        } else if (team.x_points < team.total_points) {
            xPtsCell.style.color = "#dc2626"; // red for underperforming
        } else {
            xPtsCell.style.color = "#0284c7"; // blue for matching performance
        }

        row.insertCell(3).innerHTML = team.won;
        row.insertCell(4).innerHTML = team.lost;
        row.insertCell(5).innerHTML = team.drawn;
        row.insertCell(6).innerHTML = team.GF;
        row.insertCell(7).innerHTML = team.GA;

         // Sub Points Column
        let subCell = row.insertCell(8);
        subCell.innerHTML = team.sub_points;
    }

    sessionStorage.setItem('currentGW', CURRENT_GW);
    return data;
});