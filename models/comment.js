var mongoose = require('mongoose');
var commentSchema = mongoose.Schema({
  text: String,
  username: String,
  lat: Number,
  lon: Number
});

module.exports = mongoose.model('comment', commentSchema);