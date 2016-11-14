var express = require('express');
var Game = require('../models/game');
var elo = require('./elo')
var router = express.Router();
var async = require('async');


var Standing = function(teamId, teamName) {
  var self = this;
  self.teamName = teamName;
  self.association = function(allTeams) {
    return allTeams.filter(team => team.name === self.teamName)[0].association;
  }
  self.id = teamId;
  self.win = {
    rs: 0,
    tournament: 0,
    qualifying: 0
  };
  self.loss = {
    rs: 0,
    tournament: 0,
    qualifying: 0
  };
  self.tie = {
    rs: 0,
    tournament: 0,
    qualifying: 0
  }
  self.goalsFor = {
    rs: 0,
    tournament: 0
  };
  self.goalsAgainst = {
    rs: 0,
    tournament: 0
  };

  self.games = {
    rs: function() {
      return (self.win.rs) + (self.tie.rs) + self.loss.rs;
    },
    tournament: function() {
      return (self.win.tournament) + (self.tie.tournament) + self.loss.tournament;
    },
    qualifying: function() {
      return (self.win.qualifying) + (self.tie.qualifying) + self.loss.qualifying;
    }
  }
  self.points = {
    rs: function() {
      return (self.win.rs * 2) + (self.tie.rs);
    },
    tournament: function() {
      return (self.win.tournament * 2) + (self.tie.tournament);
    },
    qualifying: function() {
      return (self.win.qualifying * 2) + (self.tie.qualifying);

    }
  }
  self.winPct = {
    rs: function() {
      var pct = (self.points.rs() / ((self.games.rs()) * 2));
      return isNaN(pct) ? (0).toFixed(3) : pct.toFixed(3);
    },
    tournament: function() {
      var pct = (self.points.tournament() / ((self.games.tournament()) * 2));
      return isNaN(pct) ? (0).toFixed(3) : pct.toFixed(3);
    },
    qualifying: function() {
      var pct = (self.points.qualifying() / ((self.games.qualifying()) * 2));
      return isNaN(pct) ? (0).toFixed(3) : pct.toFixed(3);
    }
  }
}
router.get('/elo/:teamId', function(req, res, next) {
  var searchTeam = req.params.teamId;
  Game.find({}).sort({
    gameDate: 1
  }).exec(function(err, games) {
    if (err) throw err;
    var eloArray = elo.sortTeams(games, req.teams, searchTeam);
    res.json(eloArray);
  });
});


router.get('/elo', function(req, res, next) {
  Game.find({}).sort({
    gameDate: 1
  }).exec(function(err, games) {
    if (err) throw err;
    var eloArray = elo.sortTeams(games, req.teams);
    res.json(eloArray);
  });
});

var getStandings = function(allTeams) {
  return new Promise(function(resolve, reject) {
    var standings = {

    }
    Game.find({}).sort({
      gameDate: 1
    }).exec(function(err, games) {
      if (err) throw err;
      games.forEach(function(game) {

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

        var homeScore = game.homeScore;
        var visitorScore = game.visitorScore;

        var isTournament = true;
        var isQualifying = false;
        var type = 'tournament'
        if (game.type === 'RS') {
          type = 'rs';
          isTournament = false;
        } else if (game.type === 'RR') {
          isQualifying = true;
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

      var keyNames = Object.keys(standings);

      var results = keyNames.map(function(team) {
        var standing = standings[team];
        return {

          team: team,
          association: standing.association(allTeams),
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
            winPct: standing.winPct.rs()
          },
          tournament: {
            games: standing.games.tournament(),
            win: standing.win.tournament,
            loss: standing.loss.tournament,
            tie: standing.tie.tournament,
            goalsFor: standing.goalsFor.tournament,
            goalsAgainst: standing.goalsAgainst.tournament,
            winPct: standing.winPct.tournament()

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
      }).sort(function(a, b) {
        return b.qualifying.points - a.qualifying.points;
      })
      resolve(results);

    });
  })

}
router.get('/:associationId', function(req, res, next) {
  var id = req.params.associationId;
  getStandings(req.teams).then(function(results) {
    var filter = results.filter(function(team) {
      return team.association.toLowerCase() === id.toLowerCase();
    })
    res.json(filter);
  });
});
/* GET team listing. */
router.get('/', function(req, res, next) {

  getStandings(req.teams).then(function(results) {
    res.json(results);
  });

});



module.exports = router;
