var mongoose = require('mongoose');
var commentSchema = mongoose.Schema({
  text: String, 
  username: String,
  lat: Number,
  lon: Number
});
<<<<<<< HEAD

// indexing the text values for search and retrieval
commentSchema.index({text: 'text'}) 

=======
commentSchema.index({text: 'text'});
>>>>>>> 6a59612e3b561990815e1c94a67a564f9f27b07e
module.exports = mongoose.model('comment', commentSchema);