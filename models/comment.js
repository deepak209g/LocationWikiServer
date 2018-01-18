var mongoose = require('mongoose');
var commentSchema = mongoose.Schema({
  text: String,
  commentor: {type: mongoose.Schema.Types.ObjectId, ref: 'user'},
  location:  {type: mongoose.Schema.Types.ObjectId, ref: 'location'}
});

module.exports = mongoose.model('comment', commentSchema);