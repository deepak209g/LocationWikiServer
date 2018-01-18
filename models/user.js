var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
  name: String,
  password: String,
  comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'comment'}]
});

module.exports = mongoose.model('user', userSchema);
