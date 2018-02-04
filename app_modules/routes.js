module.exports = function(G) {
    var sessCnt = 1;
    // // route for the main page
    // G.app.get('/', function(req, res) {
    //     res.sendFile(G.root + "/pages/home.html");
    // });

// check if session exists
    
    G.app.get('/getSession', function(req, res){
        res.json({
            err: req.session.isLogin
        });
    });
//login user
    G.app.post('/login', function(req, res){
        var form = new G.formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            G.user.findOne({name: fields.username}, 'name password', function(err, data){
                if(!err){
                    if(!data){
                        res.json({
                            err: 'INVALID_USERNAME',
                            msg: 'Username doesn\'t exit. Please register.'
                        });
                    }
                    else{
                        G.bcrypt.compare(fields.password, data.password).then(function(success) {
                            console.log(success);
                            if(success == true){
                                req.session.isLogin = true;
                                res.json({
                                    err: 'SUCCESS_LOGIN',
                                    msg: 'User successfully logged in.'
                                });
                            }
                            else{
                                res.json({
                                    err: 'INVALID_PASSWORD',
                                    msg: 'Please enter the correct password for registered user.'
                                });
                            }
                        });
                    }
                }
            });
        });
    });

// Register new user
    G.app.post('/registerUser', function(req, res){
        var form = new G.formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            G.user.findOne({name: fields.username}, 'name', function(err, data){
                if(!err){
                    if(!data){
                        // unique username
                        var saltRounds = 10;
                        G.bcrypt.hash(fields.password, saltRounds, function(err, hash) {
                            var userdata = {
                                name: fields.username,
                                password: hash
                            }
                            console.log(userdata)
                            var user = G.user(userdata);
                            user.save(function(err){
                                if(!err){
                                    console.log('Created new user.');
                                }
                            });
                        })
                        
                    }else{
                        res.json({
                            err: 'USERNAME_TAKEN',
                            msg: 'Username Taken!! Please try with a different username'
                        });
                    }
                }
            })
        });
    });


    // post comment
    // Expects [username, lat, lon, comment]
    G.app.post('/postComment', function(req, res){
        var form = new G.formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            if(fields.lat){
                fields.lat = round(fields.lat, 3)
            }
            if(fields.lon){
                fields.lon = round(fields.lon, 3)
            }
            G.location.findOne({lat: fields.lat, lon: fields.lon}, '_id', function(err, data){
                if(!err){
                    if(data){
                        // location already available on db
                        var comment_data = {
                            comment: fields.comment,
                            username: fields.username,
                            lat: fields.lat,
                            lon: fields.lon,
                            loc_id: data._id
                        }

                        createSaveComment(comment_data, function(err, data){
                            res.json(data);
                        })

                    }else{
                        // new location
                        console.log("yes");
                        var loc_data = {
                            lat: fields.lat,
                            lon: fields.lon,
                            stars:{
                                count: 0,
                                value: 0
                            },
                            ratings: [],
                            comments: []
                        }

                        var nlocation = new G.location(loc_data);
                        nlocation.save(function(err, location){
                            if(!err){
                                console.log("Created new location")
                                var comment_data = {
                                    comment: fields.comment,
                                    username: fields.username,
                                    lat: fields.lat,
                                    lon: fields.lon,
                                    loc_id: location._id
                                }

                                createSaveComment(comment_data, function(err, data){
                                    res.json(data);
                                })

                            }
                            else{
                                console.log(err);
                            }
                        })
                    }
                }
            })
        });
    });

    // get commets
    // expects [lat, lon]
    G.app.get('/getComments', function(req, res){
        console.log(req.query);
        var fields = req.query
        if(fields.lat){
            fields.lat = round(fields.lat, 3)
        }
        if(fields.lon){
            fields.lon = round(fields.lon, 3)
        }
        console.log(fields)
        G.location.find({lat: fields.lat, lon: fields.lon})
                    .populate('comments')
                    .exec(function(err, data){
                        // console.log(data);
                        res.json(data);
                    })
    })

    function createSaveComment(data, callback){
        // console.log(data)
        var comment_data = {
            text: data.comment,
            username: data.username,
            lat: data.lat,
            lon: data.lon
        }
        var ncomment = G.comment(comment_data);
        ncomment.save(function(err, comment){
            if(!err){
                console.log("New comment saved for a known location");
                // now add this comment it to location table
                console.log(comment);

                G.location.update(
                    {_id: data.loc_id},
                    {$push: {comments: comment._id}},
                    function(err, loc){
                        console.log(loc);
                    }
                    );

            }
            callback(err, {
                err: 'SUCCESS_COMMENT',
                msg: 'Your comment has been successfully posted.'
            })
        });
    }


    // Post Rating
    // Expects [username, lat, lon, rating]
    G.app.post('/postRating', function(req, res){
        var form = new G.formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            if(fields.lat){
                fields.lat = round(fields.lat, 3)
            }
            if(fields.lon){
                fields.lon = round(fields.lon, 3)
            }
            G.location.findOne({lat: fields.lat, lon: fields.lon}, '_id stars', function(err, data){
                if(!err){
                    if(data){
                        // location already available on db
                        // update location
                        r_data = {
                            loc_id: data._id,
                            stars: data.stars,
                            username: fields.username,
                            rating: fields.rating 
                        }
                        updateRatingData(r_data, function(err, data){
                            res.json(data);
                        })

                    }else{
                        // new location
                        var loc_data = {
                            lat: fields.lat,
                            lon: fields.lon,
                            stars:{
                                count: 0,
                                value: 0
                            },
                            ratings: [],
                            comments: []
                        }

                        var nlocation = new G.location(loc_data);
                        nlocation.save(function(err, location){
                            if(!err){
                                console.log("Created new location")
                                r_data = {
                                    loc_id: location._id,
                                    stars: location.stars,
                                    username: fields.username,
                                    rating: fields.rating 
                                }

                                updateRatingData(r_data, function(err, data){
                                    res.json(data);
                                })

                            }
                        })
                    }
                }
            })
        });
    });



    function updateRatingData(data, callback){
        // console.log(data)
        data.rating = parseInt(Math.abs(data.rating))
        data.rating = data.rating > 5 ? 5: data.rating
        stars = data.stars
        stars.value = (stars.count*stars.value + data.rating)/(stars.count + 1)
        stars.count++;
        G.location.update(
            {_id: data.loc_id,  'ratings.user': {$ne: data.username}},
            {
                $push: {ratings: {user: data.username, rating: data.rating}},
                $set: { stars: stars }
            },
            function(err, numofchanges){
                console.log(numofchanges);
                callback(err, {
                    err: 'SUCCESS_RATING',
                    msg: 'Your rating has been successfully posted.'
                })
            }
        );

    }

    // Route for sending json response for designs
    G.app.post('/getDesigns', function(req, res) {
        var form = new G.formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            var criteria = {};
            if (fields.sellerID) {
                criteria.sellerID = fields.sellerID;
            }
            if (fields.offset !== 0) {
                // repeat request from client so it has beforeTime
                criteria._id = {
                    $lt: G.mongoose.Types.ObjectId(fields.beforeTime)
                };
            }
            G.design.find(criteria)
                .sort([
                    ['_id', -1]
                ])
                .limit(fields.limit)
                .select('_id name cost mrp sellerID closetname fimage')
                .exec(function(e, data) {
                    console.log(data);
                    res.json(data);
                });
        });
    });

    // Route for sending json response for designers
    G.app.post('/getDesigners', function(req, res) {
        console.log("getDesigners");
        var form = new G.formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            var criteria = {};
            if (fields.offset !== 0) {
              // Next requests from the client containing the field beforeTime
              criteria._id = {
                  $lt: G.mongoose.Types.ObjectId(fields.beforeTime)
              };
            }

            G.seller.find(criteria)
              .sort([['_id', -1]])
              .limit(fields.limit)
              .select('name closetname p_pic')
              .exec(function(e, data) {
                console.log(data);
                res.json(data);
            });
        });
    });


    // // Route for desigers dashboard
    // var hb = require('handlebars');
    // var fs = require('fs');
    // var source = fs.readFileSync(G.root + "/pages/designerdashboard.html", 'utf8');
    // var template = hb.compile(source);
    // G.app.get('/designerdashboard', function(req, res) {
    //     if (req.session && req.session.seller_active === true) {
    //         // session is active. Blah !
    //         var desc = null;
    //         if (req.session.p_desc) {
    //             desc = req.session.p_desc;
    //             req.session.p_desc = null;
    //         }

    //         var data = {
    //             name: req.session.name || "You rock!",
    //             closetname: req.session.closetname || "My Closet",
    //             p_pic: 'https://storage.googleapis.com/featherscloset/' + req.session.p_pic,
    //             p_desc: desc,
    //             sellerID: req.session.seller_mongoID
    //         };
    //         res.send(template(data));
    //     } else {
    //         // Session is not active. Huston, we might have a bot!
    //         res.redirect('/designerlogin');
    //     }
    // });

    // // Route for the page of a particular designer
    // var source_designer = fs.readFileSync(G.root + "/pages/shop_designer.html", 'utf8');
    // var template_designer = hb.compile(source_designer);
    // G.app.get('/shop/:closet', function(req, res) {
    //     console.log('/shop/:closet');
    //     // some stuff here
    //     G.seller.findOne({
    //         closetname: req.params.closet
    //     }, '_id', function(err, person) {
    //         if (err) {
    //             // return error page to the client
    //         } else {
    //             var data = {
    //                 sellerID: person._id
    //             };
    //             res.send(template_designer(data));
    //         }
    //     });

    // });


    // // Route for a particular design
    // var source_design = fs.readFileSync(G.root + "/pages/design.html", 'utf8');
    // var template_design = hb.compile(source_design);
    // G.app.get('/shop/:closet/:design/:mId', function(req, res) {
    //     console.log('/:closet/:design');
    //     var id = req.params.mId;
    //     console.log(id);
    //     G.design.findOne({
    //         _id: {$eq: id}
    //     })
    //     .select('name cost mrp images tag stars availability info closetname sellerID')
    //     .exec(function(err, design) {
    //         if (err) {
    //             // return error page to the client
    //             console.log(err);
    //             console.log("result nahi aaya");
    //         } else {
    //             console.log("result aa gaya");
    //             console.log(design);
    //             var s = [
    //                 'star_inactive',
    //                 'star_inactive',
    //                 'star_inactive',
    //                 'star_inactive',
    //                 'star_inactive',
    //             ];
    //             for(var i=0;i< design.stars.value; i++){
    //               s[i] = 'design_active';
    //             }
    //             design.star = s;
    //             res.send(template_design(design));
    //         }
    //     });

    // });
    console.log(G.path.join(G.root , '../IonicProject/www'))
    G.app.use(G.express.static(G.path.join(G.root , '../IonicProject/www')));

};

var objectIdFromDate = function(date) {
    return Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000";
};

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}