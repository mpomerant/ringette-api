var express = require('express');
var Game = require('../models/game');
var Team = require('../models/team');
var router = express.Router();
var async = require('async');

/* GET game listing. */
router.get('/', function(req, res, next) {
  var limit = req.query.limit;
  var query = Game.find({}).sort({
    gameDate: -1
  });

  if (limit) {
    query.limit(parseInt(limit));
  }

  query.exec(function(err, games) {
    if (err) throw err;

    res.json(games);
  });

});

/* PUT game. */
router.put('/:gameId', function(req, res, next) {
  var id = req.params.gameId;
  var body = req.body;
  Game.findById(id, function(err, game) {
    if (err) return err;

    game.set(body);
    game.save(function(err, updatedGame) {
      if (err) return err;
      res.send(updatedGame);
    });
  });
});


var addGame = function(game) {
  var teams = this.teams;
  return new Promise(function(resolve, reject) {
    Game.find({
      'gameId': game.gameId
    }, function(err, existingGames) {
      if (!err) {
        if (existingGames.length === 0) {
          var homeAssociation = teams.filter(function(team) {
            //console.log("Team: " + team.name + " game: " + game.homeId);
            return team.name.trim() === game.homeId.trim();
          })[0];

          if (!homeAssociation) {
            console.log('problem with game: ' + JSON.stringify(game, null, 4));
            homeAssociation = {};
          }
          var visitorAssocation = teams.filter(function(team) {
            return team.name.trim() === game.visitorId.trim();
          })[0];

          if (!visitorAssocation) {
            console.log('problem with game: ' + JSON.stringify(game, null, 4));
            visitorAssocation = {};
          }

          var gameModel = new Game({
            home: game.home,
            visitor: game.visitor,
            homeScore: game.homeScore,
            visitorScore: game.visitorScore,
            type: game.type,
            tournament: game.tournament,
            homeAssociation: homeAssociation.association,
            visitorAssociation: visitorAssocation.association,
            division: game.division,
            gameId: game.gameId,
            gameDate: new Date(game.gameDate),
            homeId: game.homeId,
            visitorId: game.visitorId
          });
          gameModel.save(function(err, savedGame, numAffected) {
            if (err) {
              reject(err);
            }
            //console.log('created: ' + savedGame.gameId);
            resolve(savedGame);
          });



        } else {
          console.log('game ' + game.gameId + ' already exists');
          resolve(existingGames[0]);
        }
      }

    });

  });
}
var addGames = function(games) {
    return new Promise(function(resolve, reject) {

      var gameModels = [];

      var toSave = [];
      var allTeams = Team.find().exec().then(function(teams) {
        var addGameBind = addGame.bind({
          teams: teams
        });

        var promises = games.map(function(game) {

          return addGameBind(game);
        })

        Promise.all(promises).then(function(values) {
          resolve(values);
        })

      });

    });
  }
  /* GET users listing. */
router.post('/', function(req, res, next) {
  var games = req.body;
  addGames(games).then(function(gameModels) {
    res.json(gameModels);
  })


});



module.exports = router;
