var mongoose = require('mongoose');

// define our game model
// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('Team', {
  name: {
    type: String,
    default: ''
  },
  association: {
    type: String,
    default: ''
  },
  division: {
    type: String,
    default: ''
  },
  provincial: {
    type: Boolean,
    default: true
  }

});
