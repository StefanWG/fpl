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

    // 1. Process regular match results and record weekly scores
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

        if (!(t1 in standings)) {
            standings[t1] = { "total_points": 0, "x_points": 0, "won": 0, "drawn": 0, "lost": 0, "GF": 0, "GA": 0 };
        }
        if (!(t2 in standings)) {
            standings[t2] = { "total_points": 0, "x_points": 0, "won": 0, "drawn": 0, "lost": 0, "GF": 0, "GA": 0 };
        }

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

    // 2. Compute xPoints (All-Play against all other teams for every finished gameweek)
    for (let gw in weeklyScores) {
        let teamsInGW = Object.keys(weeklyScores[gw]);
        if (teamsInGW.length < 2) continue;

        // Check if this gameweek has finished scores
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
    standings_table.innerHTML = ""; // Clear old rows if reloading

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

        // Format xPoints neatly to 1 decimal place (e.g. 14.5 pts)
        let xPtsCell = row.insertCell(2);
        xPtsCell.innerHTML = (team.x_points).toFixed(1);


        row.insertCell(3).innerHTML = team.won;
        row.insertCell(4).innerHTML = team.lost;
        row.insertCell(5).innerHTML = team.drawn;
        row.insertCell(6).innerHTML = team.GF;
        row.insertCell(7).innerHTML = team.GA;
    }

    sessionStorage.setItem('currentGW', CURRENT_GW);
    return data;
});