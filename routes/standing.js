var Game = require('../models/game');

var Standing = function (teamId, teamName) {
    var self = this;
    self.teamName = teamName;
    self.leader = false;
    self.association = function (allTeams) {
        return allTeams.filter(team => team.name === self.teamName)[0].association;
    }
    self.provincial = function (allTeams) {
        return allTeams.filter(team => team.name === self.teamName)[0].provincial;
    }
    self.id = teamId;
    self.win = {
        rs: 0,
        tournament: 0,
        qualifying: 0
    };
    self.oppWin = {
        rs: 0,
        tournament: 0,
        qualifying: 0
    };

    self.loss = {
        rs: 0,
        tournament: 0,
        qualifying: 0
    };

    self.oppLoss = {
        rs: 0,
        tournament: 0,
        qualifying: 0
    };
    self.tie = {
        rs: 0,
        tournament: 0,
        qualifying: 0
    };

    self.oppTie = {
        rs: 0,
        tournament: 0,
        qualifying: 0
    };
    self.goalsFor = {
        rs: 0,
        tournament: 0
    };
    self.goalsAgainst = {
        rs: 0,
        tournament: 0
    };

    self.games = {
        rs: function () {
            return (self.win.rs) + (self.tie.rs) + self.loss.rs;
        },
        tournament: function () {
            return (self.win.tournament) + (self.tie.tournament) + self.loss.tournament;
        },
        qualifying: function () {
            return (self.win.qualifying) + (self.tie.qualifying) + self.loss.qualifying;
        }
    }
    self.points = {
        rs: function () {
            return (self.win.rs * 2) + (self.tie.rs);
        },
        tournament: function () {
            return (self.win.tournament * 2) + (self.tie.tournament);
        },
        qualifying: function () {
            return (self.win.qualifying * 2) + (self.tie.qualifying);

        }
    }
    self.winPct = {
        rs: function () {
            var pct = (self.points.rs() / ((self.games.rs()) * 2));
            return isNaN(pct) ? (0).toFixed(3) : pct.toFixed(3);
        },
        tournament: function () {
            var pct = (self.points.tournament() / ((self.games.tournament()) * 2));
            return isNaN(pct) ? (0).toFixed(3) : pct.toFixed(3);
        },
        qualifying: function () {
            var pct = (self.points.qualifying() / ((self.games.qualifying()) * 2));
            return isNaN(pct) ? (0).toFixed(3) : pct.toFixed(3);
        },
        oppositionRs: function () {
            var pts = (self.oppWin.rs * 2) + self.oppTie.rs;
            var games = self.oppWin.rs + self.oppLoss.rs + self.oppTie.rs;
            var pct = (pts / ((games) * 2));
            return isNaN(pct) ? (0).toFixed(3) : pct.toFixed(3);
        },
        oppositionTournament: function () {
            var pts = (self.oppWin.tournament * 2) + self.oppTie.tournament;
            var games = self.oppWin.tournament + self.oppLoss.tournament + self.oppTie.tournament;
            var pct = (pts / ((games) * 2));
            return isNaN(pct) ? (0).toFixed(3) : pct.toFixed(3);
        }
    }
};

var getStandings = function (allTeams) {
    return new Promise(function (resolve, reject) {
        var standings = {}
        Game.find({}).sort({
            gameDate: 1
        }).exec(function (err, games) {
            if (err) throw err;
            games.forEach(function (game) {

                var homeTeam = game.homeId;
                var visitorTeam = game.visitorId;
                var homeTeamObj = allTeams.filter(team => team.name === homeTeam)[0];
                var homeId = homeTeamObj ? homeTeamObj._id : undefined;
                if (!homeId) {

                    console.log(`ERROR: could not find ${homeTeam} from game ${game._id}.`);
                }
                var visitorTeamObj = allTeams.filter(team => team.name === visitorTeam)[0];
                var visitorId = visitorTeamObj ? visitorTeamObj._id : undefined;
                if (!visitorId) {
                    console.log(`ERROR: could not find ${visitorTeam} from game ${game._id}.`);
                }
                var home;
                if (standings.hasOwnProperty(homeTeam)) {
                    home = standings[homeTeam]
                } else {
                    home = standings[homeTeam] = new Standing(homeId, homeTeam);

                }
                var visitor;
                if (standings.hasOwnProperty(visitorTeam)) {
                    visitor = standings[visitorTeam]
                } else {
                    visitor = standings[visitorTeam] = new Standing(visitorId, visitorTeam);
                }

                var homeScore = game.homeScore;
                var visitorScore = game.visitorScore;

                var isTournament = true;
                var isQualifying = false;
                var type = 'tournament'
                if (game.type === 'RS') {
                    type = 'rs';
                    isTournament = false;
                } else if (game.type === 'RR') {
                    if ((game.homeAssociation != 'Other') && (game.visitorAssociation != 'Other')) {
                        isQualifying = true;
                    }

                }
                home.goalsFor[type] += homeScore;
                home.goalsAgainst[type] += visitorScore;

                visitor.goalsFor[type] += visitorScore;
                visitor.goalsAgainst[type] += homeScore;

                if (homeScore == visitorScore) {
                    home.tie[type]++;
                    visitor.tie[type]++;
                    if (isQualifying) {
                        home.tie['qualifying']++;
                        visitor.tie['qualifying']++;
                    }
                } else if (homeScore > visitorScore) {
                    home.win[type]++;
                    visitor.loss[type]++;
                    if (isQualifying) {
                        home.win['qualifying']++;
                        visitor.loss['qualifying']++;
                    }
                } else {
                    home.loss[type]++;
                    visitor.win[type]++;
                    if (isQualifying) {
                        home.loss['qualifying']++;
                        visitor.win['qualifying']++;
                    }
                }


            })

            games.forEach(function (game) {
                var homeTeam = game.homeId;
                var visitorTeam = game.visitorId;
                var homeId = allTeams.filter(team => team.name === homeTeam)[0]._id;
                var visitorId = allTeams.filter(team => team.name === visitorTeam)[0]._id;
                var home;
                if (standings.hasOwnProperty(homeTeam)) {
                    home = standings[homeTeam]
                } else {
                    home = standings[homeTeam] = new Standing(homeId, homeTeam);

                }
                var visitor;
                if (standings.hasOwnProperty(visitorTeam)) {
                    visitor = standings[visitorTeam]
                } else {
                    visitor = standings[visitorTeam] = new Standing(visitorId, visitorTeam);
                }


                if (game.type === 'RS') {
                    home.oppWin.rs += visitor.win.rs;
                    visitor.oppWin.rs += home.win.rs;

                    home.oppLoss.rs += visitor.loss.rs;
                    visitor.oppLoss.rs += home.loss.rs;

                    home.oppTie.rs += visitor.tie.rs;
                    visitor.oppTie.rs += home.tie.rs;
                } else {
                    home.oppWin.tournament += visitor.win.tournament;
                    visitor.oppWin.tournament += home.win.tournament;

                    home.oppLoss.tournament += visitor.loss.tournament;
                    visitor.oppLoss.tournament += home.loss.tournament;

                    home.oppTie.tournament += visitor.tie.tournament;
                    visitor.oppTie.tournament += home.tie.tournament;

                }

            })

            var keyNames = Object.keys(standings);

            var results = keyNames.map(function (team) {
                var standing = standings[team];
                return {

                    team: team,
                    image: '/css/images/team/' + team + '.png',
                    association: standing.association(allTeams),
                    provincial: standing.provincial(allTeams),
                    leader: false,
                    id: standing.id,
                    links: {
                        rel: "team",
                        href: "api/team/" + standing.id
                    },
                    rs: {
                        games: standing.games.rs(),
                        win: standing.win.rs,
                        loss: standing.loss.rs,
                        tie: standing.tie.rs,
                        goalsFor: standing.goalsFor.rs,
                        goalsAgainst: standing.goalsAgainst.rs,
                        goalsAgainst: standing.goalsAgainst.rs,
                        points: standing.points.rs(),
                        winPct: standing.winPct.rs(),
                        oppWin: standing.oppWin.rs,
                        oppLoss: standing.oppLoss.rs,
                        oppTie: standing.oppTie.rs,
                        oppWinPct: standing.winPct.oppositionRs()
                    },
                    tournament: {
                        games: standing.games.tournament(),
                        win: standing.win.tournament,
                        loss: standing.loss.tournament,
                        tie: standing.tie.tournament,
                        goalsFor: standing.goalsFor.tournament,
                        goalsAgainst: standing.goalsAgainst.tournament,
                        winPct: standing.winPct.tournament(),
                        oppWin: standing.oppWin.tournament,
                        oppLoss: standing.oppLoss.tournament,
                        oppTie: standing.oppTie.tournament,
                        oppWinPct: standing.winPct.oppositionTournament()

                    },
                    qualifying: {
                        games: standing.games.qualifying(),
                        win: standing.win.qualifying,
                        loss: standing.loss.qualifying,
                        tie: standing.tie.qualifying,
                        points: standing.points.qualifying(),
                        winPct: standing.winPct.qualifying()
                    }

                }
            }).filter(function (team) {
                return team.provincial;
            }).sort(function (a, b) {
                var result = b.qualifying.winPct - a.qualifying.winPct;
                if (result === 0) {
                    result = b.qualifying.games - a.qualifying.games;
                }
                return result;
            });


            resolve(results);

        });
    })

};

module.exports = {
    Standing: Standing,
    getStandings: getStandings

};
