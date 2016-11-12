var mongoose = require('mongoose');

// define our game model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Game', {
  homeAssociation: {
    type: String,
    default: ''
  },
  visitorAssociation: {
    type: String,
    default: ''
  },
  gameDate: {
    type: Date
  },
  gameId: {
    type: String,
    default: ''
  },
  home: {
    type: String,
    default: ''
  },
  homeId: {
    type: String,
    default: ''
  },
  _homeId: {
    type: String,
    default: ''
  },
  homeScore: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    default: 'RS'
  },
  visitor: {
    type: String
  },
  visitorId: {
    type: String
  },
  _visitorId: {
    type: String,
    default: ''
  },
  visitorScore: {
    type: Number,
    default: 0
  },
  division: {
    type: String,
    default: 'U14A'
  },
  tournament: {
    type: String,
    default: ''
  }
});
