var mongoose = require('mongoose');
var locationSchema = mongoose.Schema({
  lat: Number,
  lon: Number,
  stars: {count: Number, value: Number},
  comments: [{type: mongoose.Schema.Types.ObjectId, ref: 'comment'}]
});

module.exports = mongoose.model('location', locationSchema);

// https://alexanderzeitler.com/articles/mongoose-referencing-schema-in-properties-and-arrays/
