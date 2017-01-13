var express = require('express');
var Game = require('../models/game');
var elo = require('./elo')
var router = express.Router();
var async = require('async');
var StandingsHelper = require('./standing');




router.get('/elo/:teamId', function (req, res, next) {
    var searchTeam = req.params.teamId;
    Game.find({}).sort({
        gameDate: 1
    }).exec(function (err, games) {
        if (err) throw err;
        var eloArray = elo.sortTeams(games, req.teams, searchTeam);
        res.json(eloArray);
    });
});


router.get('/elo', function (req, res, next) {
    Game.find({}).sort({
        gameDate: 1
    }).exec(function (err, games) {
        if (err) throw err;
        var eloArray = elo.sortTeams(games, req.teams);
        res.json(eloArray);
    });
});


router.get('/:associationId', function (req, res, next) {
    var id = req.params.associationId;
    var results = req.app.locals.standings;
    var filter = results.filter(function (team) {
        return team.association.toLowerCase() === id.toLowerCase();
    })
    res.json(filter);

});
/* GET team listing. */
router.get('/', function (req, res, next) {

    var results = req.app.locals.standings;
    req.associations.forEach(function (association) {
        var assoc = association;
        var _standing = results.find(function (standing) {
            //console.log('standing: ' + standing.association + ' assoc: ' + association + ' yes: ' + (standing.association === association));
            return standing.association === association;
        });
        if (_standing) {

            _standing.leader = true;
        }

    });
    res.json(results);


});


module.exports = router;
