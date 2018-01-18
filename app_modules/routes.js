module.exports = function(G) {
    var sessCnt = 1;

    // // route for the main page
    // G.app.get('/', function(req, res) {
    //     res.sendFile(G.root + "/pages/home.html");
    // });



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
                            msg: 'Please try with a different username'
                        });
                    }
                }
            })
        });
    });


    // Add Comment
    G.app.post('/postComment', function(req, res){
        var form = new G.formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {

        });
    })

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