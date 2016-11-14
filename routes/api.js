var express = require('express');
var game = require('./games');
var team = require('./team');
var TeamModel = require('../models/team');
var standings = require('./standings');
var router = express.Router();

router.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  //res.setHeader('Access-Control-Allow-Headers', 'headers_you_want_to_accept');
  next();
});
var reduceTeams = function(result, team) {

  result[team.name] = team._id;

  return result;
}

var reduceAssociations = function(result, team) {
  if (!this[team.association]) {
    this[team.association] = 1;
    result.push(team.association);

  }
  return result;
}
router.use(function(req, res, next) {
  var allTeams = TeamModel.find().exec().then(function(teams) {
    req.teams = teams;


    req.teamMap = teams.reduce(reduceTeams, {});
    var test = {};
    req.associations = teams.reduce(reduceAssociations.bind(test), [])
    next();
  });

});


router.use('/game', game);
router.use('/team', team);
router.use('/standings', standings);

module.exports = router;
