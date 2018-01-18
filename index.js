var G = {};
G.express = require("express");
G.formidable = require('formidable');
G.util = require('util');
G.path = require('path')
//G.fs = require('fs-extra');
G.mongoose = require('mongoose');
G.constants = require('./config');
G.routes = require('./app_modules/routes');
G.app = G.express();
// G.request = require('request');
G.bcrypt = require('bcrypt');
var session = require('client-sessions');
G.root = __dirname;



G.app.use(session({
  cookieName: 'session',
  secret: 'eg[isfd-8yF9-7w2315df{}+Ijqdf;;to8',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: true,
  secure: true,
  ephemeral: true
}));





G.mongoose.connect(G.constants.mongodb, {
  useMongoClient : true
});
var locationdb = G.mongoose.connection;


// Desing schema form desings
G.comment = require('./models/comment.js');

// New Designer/Seller Schema for seller data in mongodb
G.location = require('./models/location.js');
G.user = require('./models/user.js');


// DB initialization
locationdb.on('error', function(err){
   console.log(err);
});
locationdb.once('open',function(callback){
   console.log('Location database opened !');
});



G.routes(G);
// require('./app_modules/registerDesigner')(G);
// require('./app_modules/loginDesigner')(G);


G.app.use(function(req, res) {
   res.status(404).send('404: Page not Found');
});

// Handle 500
G.app.use(function(error, req, res, next) {
   res.status(500).send('500: Page not Found');
});
G.app.listen('8080', function(){
  console.log("running");
});
