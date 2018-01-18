var mongoose = require('mongoose');
var sellerSchema = mongoose.Schema({
  closetname: String,
  name: String,
  contact: [String],
  address: [{location: String, pin: String, state: String }],
  email: String,
  verified: Boolean,
  active: Boolean,
  designs: [{type: mongoose.Schema.Types.ObjectId, ref: 'design'}],
  p_pic: String,
  p_desc: String,
  password: String,
  cpsid: String
});
module.exports =  mongoose.model('seller', sellerSchema);
