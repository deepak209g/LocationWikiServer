var mongoose = require('mongoose');
var productSchema = mongoose.Schema({
  name: String,
  cost: Number,
	mrp: Number,
  fimage: String,
  images: [String],
  tag: [String],
  stars: {count: Number, value: Number},
  availability: [{size: String, quantity: Number}],
	reviews: [{name: String, text: String}],
	wishers: [mongoose.Schema.Types.ObjectId],
  info: [String],
  closetname: String,
  sellerID: {type: mongoose.Schema.Types.ObjectId, ref: 'seller'}
});

module.exports = mongoose.model('design', productSchema);
