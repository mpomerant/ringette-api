var express = require('express');
var Team = require('../models/team');
var Game = require('../models/game');
var router = express.Router();
var async = require('async');

/* GET team listing. */
router.get('/', function(req, res, next) {
  if (req.query.type !== 'tree') {

    Team.find({}, function(err, teams) {
      if (err) throw err;



      res.json(teams);

    });
  } else {
    Team.aggregate([{
        $group: {
          _id: "$association",
          "teams": {
            $push: "$$ROOT"
          }
        }
      }],
      function(err, teams) {
        res.json(teams);
      }
    );
  }


});
router.use('/:teamId', function(req, res, next) {
  var teamId = req.params.teamId;
  req.teamId = teamId;
  next();
});

var reduceRecord = function(result, game) {
    var isHome = game.homeId === this.name;
    var forScore = isHome ? game.homeScore : game.visitorScore;
    var againstScore = isHome ? game.visitorScore : game.homeScore;
    result.for += forScore;
    result.against += againstScore;
    if (forScore > againstScore) {
      result.win++;
    } else if (forScore < againstScore) {
      result.loss++;
    } else {
      result.tie++;
    }
    result.games++;

    return result;
  }
  /* GET team listing. */
router.get('/:teamId', function(req, res, next) {
  var teamId = req.teamId;
  var teamMap = req.teamMap;
  Team.find({
    _id: teamId
  }, function(err, teams) {
    if (err) throw err;
    if (teams.length > 0) {

      var team = teams[0];
      var response = {
        team: team
      }
      Game.find({
        $or: [{
          "homeId": team.name
        }, {
          "visitorId": team.name
        }]
      }).exec(function(err, games) {
        if (err) throw err;

        var rsGames = games.filter(function(game) {
          return game.type === 'RS';
        }).map(function(game) {
          var homeId = game.homeId;
          var visitorId = game.visitorId;
          var _homeId = teamMap[homeId];
          var _visitorId = teamMap[visitorId];
          game._homeId = _homeId;
          game._visitorId = _visitorId;
          return game;
        });
        rsGames.sort(function(a, b) {
          a = new Date(a.gameDate);
          b = new Date(b.gameDate);
          return a > b ? -1 : a < b ? 1 : 0;
        })
        response.regularSeason = rsGames;
        var tournamentGames = games.filter(function(game) {
          return game.type != 'RS';
        }).map(function(game) {
          var homeId = game.homeId;
          var visitorId = game.visitorId;
          var _homeId = teamMap[homeId];
          var _visitorId = teamMap[visitorId];
          game._homeId = _homeId;
          game._visitorId = _visitorId;
          return game;
        })
        tournamentGames.sort(function(a, b) {
          a = new Date(a.gameDate);
          b = new Date(b.gameDate);
          return a > b ? -1 : a < b ? 1 : 0;
        })
        response.tournament = tournamentGames;
        var rsRecord = rsGames.reduce(reduceRecord.bind({
          name: team.name
        }), {
          win: 0,
          loss: 0,
          tie: 0,
          games: 0,
          for: 0,
          against: 0


        });

        var tournamentRecord = tournamentGames.reduce(reduceRecord.bind({
          name: team.name
        }), {
          win: 0,
          loss: 0,
          tie: 0,
          games: 0,
          for: 0,
          against: 0
        });


        rsRecord.pct = (((rsRecord.win * 2) + rsRecord.tie) / (rsRecord.games * 2)).toFixed(3);
        tournamentRecord.pct = (((tournamentRecord.win * 2) + tournamentRecord.tie) / (tournamentRecord.games * 2)).toFixed(3);
        response.regularSeasonRecord = rsRecord;
        response.tournamentRecord = tournamentRecord;
        res.json(response);
      });

    }

  });
});
router.post('/', function(req, res, next) {
  var team = req.body;
  var teamModel = new Team(team);
  teamModel.save(function(err, saveTeam, numAffected) {
    console.log('created: ' + saveTeam.name);
    res.json(saveTeam);
  });


});



module.exports = router;
