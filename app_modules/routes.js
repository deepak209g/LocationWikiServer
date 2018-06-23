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
            console.log(fields);
            var post_data ={
                    secret : '6LdLQF8UAAAAACOq5bNlxOLt2pqC2L0Etr4BkgZr',
                    response : fields.captchaResponse
            }
            G.request.post('https://www.google.com/recaptcha/api/siteverify?&secret=6LdLQF8UAAAAACOq5bNlxOLt2pqC2L0Etr4BkgZr&response='+fields.captchaResponse, function(err, captchaRes, body){
                console.log(body);
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
                                    res.json({
                                        err: 'NEW_USER',
                                        msg: 'User ' + fields.username + ' has been successfully registered.'
                                    });
                                }
                            });
                        })
                        
                    }else{
                        res.json({
                            err: 'USERNAME_TAKEN',
                            msg: 'Username Taken!! Please try with a different username.'
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
                        if(data[0] && data[0].comments.length!=0)
                            res.json(data[0].comments);
                        else{
                            res.json({
                                    err: 'NO_COMMENT',
                                    msg: 'Sorry!! No comments found at this location.'
                                });
                        }
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

    //getRating
    G.app.get('/getRating', function(req, res){
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
                    .exec(function(err, data){
                        if(data[0])
                            res.json(data[0].stars);
                        else{
                            res.json({
                                    err: 'NO_RATING',
                                    msg: 'Sorry!! No Rating found at this location.'
                                });
                        }
                    })
    })

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
                        console.log(data.ratings);
                        G.location.findOne({_id:data._id, 'ratings.user':fields.username}, 'ratings.$._id', function(err, out){
                            if(!err){
                                if(out){
                                    var stars = data.stars;
                                    stars.value = (stars.value*stars.count-out.ratings[0].rating+fields.rating)/stars.count;
                                    G.location.update(
                                        {_id: data._id,  'ratings.user': fields.username},
                                        {
                                            $set: { 
                                                stars: stars,
                                                'ratings.$.rating':fields.rating
                                             }
                                        },
                                        function(err, numofchanges){
                                            console.log(numofchanges);
                                            res.json({
                                                err: 'SUCCESS_RATING',
                                                msg: 'Your rating has been successfully posted.'
                                            });
                                        }
                                    );
                                }
                                else{
                                    r_data = {
                                        loc_id: data._id,
                                        stars: data.stars,
                                        username: fields.username,
                                        rating: fields.rating 
                                    }
                                    updateRatingData(r_data, function(err, data){
                                        res.json(data);
                                    })
                                }
                            }
                        });

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


    // Expects a search string
    G.app.get('/search', function(req, res){
        console.log('Making a search query !')
        var search_query = req.query.param;
        var lat = req.query.lat;
        var lon = req.query.lon;
        console.log(lat)
        lat = round(lat, 3)
        lon = round(lon, 3)

        lat_two_km = {$lt: lat + 0.02, $gt : lat - 0.02}
        lon_two_km = {$lt: lon + 0.02, $gt : lon - 0.02}

        // console.log(fields);
        G.comment.find(
            {
                $text: {$search: search_query},
                'lat': lat_two_km,
                'lon': lon_two_km
            }).limit(5) .exec(function(err, docs) { res.json(docs);
            console.log(docs) });
    }); 
    // .skip(20) 

    function updateRatingData(data, callback){
        // console.log(data)
        console.log(data.rating)
        data.rating = parseInt(Math.abs(data.rating))
        data.rating = data.rating > 5 ? 5: data.rating
        stars = data.stars
        stars.value = (stars.count*stars.value + data.rating)/(stars.count + 1)
        stars.count++;
        console.log(stars)
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


    // Route for sending json response for designers


    console.log(G.path.join(G.root , '../IonicProject/www'))
    G.app.use(G.express.static(G.path.join(G.root , '../IonicProject/www')));

};

var objectIdFromDate = function(date) {
    return Math.floor(date.getTime() / 1000).toString(16) + "0000000000000000";
};

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}