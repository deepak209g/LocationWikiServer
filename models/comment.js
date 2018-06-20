var mongoose = require('mongoose');
var commentSchema = mongoose.Schema({
  text: String,
  username: String,
  lat: Number,
  lon: Number
});

// indexing the text values for search and retrieval
commentSchema.index({text: 'text'}) 

module.exports = mongoose.model('comment', commentSchema);