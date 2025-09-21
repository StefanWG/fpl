let LEAGUE_ID = 106254;
let LEAGUE_DETAILS = null;
let PLAYER_STATS = {};
let SEASON_STATS = null;
let CURRENT_GW = 2;


const proxyUrl = 'https://corsproxy.io/?url=';

async function getLeagueDetails() {
    let url = `https://draft.premierleague.com/api/league/${LEAGUE_ID}/details`;
    const data = await fetch(proxyUrl+ url)
        .then((response) => response.json())
        .then((data) => data);
    LEAGUE_DETAILS = data;
    return data;
}


async function getLineup(entry_id, gw) {
    let url = `https://draft.premierleague.com/api/entry/${entry_id}/event/${gw}`;
    const data = await fetch(proxyUrl + url)
        .then((response) => response.json())
        .then((data) => data.picks);
    return data;
}

async function getLiveStats(gameweek) {
    if (gameweek in PLAYER_STATS) {
        return PLAYER_STATS[gameweek];
    }
    let url = `https://draft.premierleague.com/api/event/${gameweek}/live`;
    const data = await fetch(proxyUrl + url)
        .then((response) => response.json())
        .then((data) => data);
    PLAYER_STATS[gameweek] = data["elements"];
    return PLAYER_STATS[gameweek];
}

async function getSeasonStats() {
    if (SEASON_STATS != null) {
        return SEASON_STATS;
    } 
    let url = `https://draft.premierleague.com/api/bootstrap-static`;
    const data = await fetch(proxyUrl + url)
        .then((response) => response.json())
        .then((data) => data);
    SEASON_STATS = data
    return SEASON_STATS;
}