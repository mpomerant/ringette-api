var eloTable = {
    0: 0.5,
    20: 0.53,
    40: 0.58,
    60: 0.62,
    80: 0.66,
    100: 0.69,
    120: 0.73,
    140: 0.76,
    160: 0.79,
    180: 0.82,
    200: 0.84,
    300: 0.93,
    400: 0.97
}
var expectedScore = function (diff) {
    var inv = diff < 0;
    var abs = Math.abs(diff);
    if (abs > 400) {
        abs = 400;
    }
    for (var x in eloTable) {
        if (x >= abs) {
            if (inv) {
                return 1 - eloTable[x];
            } else {
                return eloTable[x];
            }

        }
    }
}
var eloDiff = function (score1, score2) {


    var r1 = expectedScore(score1 - score2);
    var r2 = expectedScore(score2 - score1);


    return {
        a: r1,
        b: r2
    };
}

var sortTeams = function (games, allTeams, searchTeam) {


    var elo = {};


    games.forEach(function (game) {
        var homeTeam = game.homeId;
        var visitorTeam = game.visitorId;
        var homeScore = Number(game.homeScore);
        var visitorScore = Number(game.visitorScore);
        if (!elo[homeTeam]) {
            elo[homeTeam] = {
                score: 1500,
                games: []
            };

        }

        if (!elo[visitorTeam]) {
            elo[visitorTeam] = {
                score: 1500,
                games: []
            };
        }

        var homeElo = elo[homeTeam].score;
        var visitorElo = elo[visitorTeam].score;


        var expected = eloDiff(homeElo, visitorElo);
        var homeExpected = expected.a;
        var visitorExpected = expected.b;

        var C = game.type === 'RS' ? 15 : game.type === 'GS' ? 25 : game.type === 'S1' || game.type === 'S2' ? 25 : 20;
        var eloHomeScore = 0;
        var eloVisitorScore = 0;
        var winner;
        var loser;
        if (homeScore > visitorScore) {
            eloHomeScore = 1;
            eloVisitorScore = 0;
            winner = homeElo;
            loser = visitorElo;


        } else if (homeScore < visitorScore) {
            eloHomeScore = 0;
            eloVisitorScore = 1;
            winner = visitorElo;
            loser = homeElo;
        } else {
            eloHomeScore = 0.5;
            eloVisitorScore = 0.5;
        }

        //LN(ABS(PD)+1) * (2.2/((ELOW-ELOL)*.001+2.2))


        var multiplier = winner ? Math.log((Math.abs(homeScore - visitorScore) + 1) * (2.2 / (((winner - loser) * 0.001) + 2.2))) : 1;
        //console.log('homeElo: ' + homeElo + ' visitorElo: ' + visitorElo + ' diff: ' + (homeScore - visitorScore) + ' multipler: ' + multiplier);
        var newHomeElo = homeElo + (C * (eloHomeScore - homeExpected));
        var homeDelta = (newHomeElo - homeElo) * multiplier;
        newHomeElo = newHomeElo + homeDelta;
        var newVisitorElo = visitorElo + (C * (eloVisitorScore - visitorExpected));
        var visitorDelta = (newVisitorElo - visitorElo) * multiplier;
        newVisitorElo = newVisitorElo + visitorDelta;

        elo[homeTeam].score = newHomeElo;
        var homeGame = {
            score: Number(newHomeElo).toFixed(0),
            date: game.gameDate,
            result: homeScore - visitorScore
        }
        elo[homeTeam].games.push(homeGame);

        //console.log(homeTeam + ': ' + newHomeElo);
        elo[visitorTeam].score = newVisitorElo;
        var visitorGame = {
            score: Number(newVisitorElo).toFixed(0),
            date: game.gameDate,
            result: visitorScore - homeScore
        }
        elo[visitorTeam].games.push(visitorGame);
        //console.log(visitorTeam + ': ' + newVisitorElo);


    });
    //console.log(elo);
    var eloArray = [];
    for (var team in elo) {
        var teamMatch = allTeams.find(function (myTeam) {
            return myTeam.name === team;
        });
        var teamId;
        var teamAssociation;
        if (teamMatch) {
            teamId = teamMatch._id;
            teamAssociation = teamMatch.association;
        } else {
            console.log('cannot find team ' + team + ' in the list');
        }

        if (!searchTeam || searchTeam == teamId) {
            console.log('searchTeam: ' + searchTeam + ' compare: ' + teamId);
            eloArray.push({
                id: teamId,
                team: team,
                image: '/css/images/team/' + team + '.png',
                association: teamAssociation,
                rating: elo[team].score.toFixed(1),
                games: elo[team].games
            })
        }

    }

    eloArray.sort(function (a, b) {
        return b.rating - a.rating;

    });


    return eloArray;


}

module.exports = {
    sortTeams: sortTeams
};
