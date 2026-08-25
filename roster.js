document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const leagueId = params.get("league");
    const entryId = params.get("entry"); // Note: This is usually the entry_id or league_entry ID
    const currentGW = sessionStorage.getItem('currentGW') || 1;

    if (!leagueId || !entryId) {
        document.getElementById("team-title").innerText = "Error: No team specified.";
        return;
    }

    try {
        // 1. Fetch league details to find the correct team/entry name
        let teamName = "Team Roster";
        try {
            // Assuming league details can be fetched similar to your standings script
            const leagueResponse = await fetch(`data/leagues/${leagueId}/league_details.json`); // Adjust path if needed
            const leagueData = await leagueResponse.json();
            
            if (leagueData && leagueData["league_entries"]) {
                const matchedEntry = leagueData["league_entries"].find(
                    entry => entry["entry_id"] == entryId || entry["id"] == entryId
                );
                if (matchedEntry && matchedEntry["entry_name"]) {
                    teamName = matchedEntry["entry_name"];
                }
            }
        } catch (e) {
            console.warn("Could not fetch league details for team name mapping.", e);
        }

        // 2. Fetch bootstrap-static or master player database
        const bootstrapResponse = await fetch(`data/bootstrap-static.json`).catch(() => null);
        let playersMeta = {};
        let positionsMeta = {
            1: "GK",
            2: "DEF",
            3: "MID",
            4: "FWD"
        };

        if (bootstrapResponse && bootstrapResponse.ok) {
            const bootstrapData = await bootstrapResponse.json();
            if (bootstrapData["elements"]) {
                bootstrapData["elements"].forEach(el => {
                    playersMeta[el["id"]] = el;
                });
            }
        }

        // 3. Fetch the lineup for the gameweek
        const lineupResponse = await fetch(`data/leagues/${leagueId}/lineups/entry_${entryId}_gw_${currentGW-1}.json`);
        const rosterData = await lineupResponse.json();

        // 4. Fetch live stats if available
        let liveStats = {};
        try {
            const liveResponse = await fetch(`data/live_gw_${currentGW-1}.json`);
            const liveData = await liveResponse.json();
            if (liveData["elements"]) {
                liveData["elements"].forEach(item => {
                    liveStats[item["id"]] = item["stats"];
                });
            }
        } catch (e) {}

        // Set the dynamic team title with the gameweek
        document.getElementById("team-title").innerText = `${teamName} — Gameweek ${currentGW-1}`;
        
        let tbody = document.getElementById("roster-table").getElementsByTagName('tbody')[0];
        tbody.innerHTML = "";

        let picks = rosterData["picks"] || [];
        
        if (picks.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem;">No players found for this gameweek.</td></tr>`;
            return;
        }

        picks.forEach(pick => {
            let playerId = pick["element"] || pick["player_id"];
            let playerInfo = playersMeta[playerId] || {};
            
            let playerName = playerInfo["web_name"] || playerInfo["second_name"] || `Player #${playerId}`;
            let positionId = playerInfo["element_type"];
            let positionName = positionsMeta[positionId] || "-";
            
            let totalPoints = playerInfo["total_points"] ?? pick["total_points"] ?? 0;

            let row = tbody.insertRow();
            row.insertCell(0).innerHTML = playerName;
            row.insertCell(1).innerHTML = positionName;
            row.insertCell(2).innerHTML = totalPoints;
        });

    } catch (error) {
        console.error("Failed to load roster data:", error);
        document.getElementById("team-title").innerText = "Could not load roster details.";
    }
});