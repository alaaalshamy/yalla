var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var bodyparser = require('body-parser');
var midparse = bodyparser.urlencoded();
var fs = require('fs'); //for stream
var multer = require('multer');// for upload img
var mongoose = require('mongoose'); // for model database
var passwordHash = require('password-hash'); //for generet pass and verifiy

var valid = require('./validationuser'); // use validation function
var NodeGeocoder = require('node-geocoder');
require("../model/users");
require("../model/stores");

var UserModel = mongoose.model('users');
var StoreModel = mongoose.model('stores');
const path = require('path');


var options = {
    provider: 'google',

    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: 'AIzaSyARP_rGAxnm5haEe88zKlNfEl9TmPUbGfs', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};



var geocoder = NodeGeocoder(options);


var upload=multer({
    dest:"./public/img"
});


// /* GET users listing. */
// router.get('/all', function(req, res, next) {
//         var tokenKey = req.header("Authorization");
//         jwt.verify(tokenKey,'mysecret-key',function (err,data) {
//             if(data){
//                 var admin = true;
//                 var admintoken = data.user.admin;
//                 if( admintoken == admin) {
//                     UserModel.find({}, function(err, user) {
//                         res.json({ users: user});
//                     });
//                 }else{
//                     res.json({msg:"Auth Faild"});
//                 }
//             }
//         });
// });

/*
    if(req.file){
        fs.renameSync(req.file.path,req.file.destination+"/"+req.file.originalname);
         file = req.file.path;

    }else{
         file = "";
        console.log("err");
    }
*/

router.get('/user',function (req,res) {

    res.render('add');
});
router.post('/user',upload.any(),function (req,res) {
    let imgs = [];
    if(req.files && req.files.length > 0){

        var files =req.files;

        for (var i=0;i<files.length;i++){
            fs.renameSync(files[i].path,files[i].destination+"/"+files[i].originalname);
        }

        imgs.push(files);
    }
    if(imgs.length > 0) {
        for (var i = 0; i < imgs.length;i++){
            if(imgs[i].fieldname === "personalimg"){
                var img = imgs[i].path;

            }else if(imgs[i].fieldname === "coverimg"){
                var imgcover=  imgs[i].path;

            }else {
                var img = "";
                var imgcover = "";
            }
        }

    }
res.json(imgs);





});


router.get('/img/:img',midparse,function (req,res) {
    var userimg = req.params.img;
    res.sendFile(path.join(__dirname, '../public/img/'+userimg));
//    res.sendFile(path.join(__dirname, 'public/img/'+userimg));


});

/*
router.get('/getsession',midparse,function (req,res) {
   if(req.session.username){
       res.json({session:true,username:req.session.username,userid:req.session.userid});
   }else{
       res.json({session:false});
   }
});

router.get('/logout',midparse,function(req,res){
    req.session.destroy();
    res.json({session:false});
});
*/


router.post('/login', midparse,function(req, res, next) {

    if(!valid.emailvalid(req.body.email)[1])
    {
        res.json(valid.emailvalid(req.body.email));
    }else{

    UserModel.findOne({ email: valid.emailvalid(req.body.email) }, function(err, user) {
        if(err){
            console.log(err);
            return;
        }

        if(user == null){
            res.json([{err:"Email Not Found "},false]);
        }else {

            if(user.activation == true){
            if(passwordHash.verify(req.body.password,user.password))
            {
                const jsontoken = jwt.sign({user: user},'mysecret-key');
/*
                req.session.username = user.username;
                req.session.userid = user._id;
*/
                res.json({ user: user, token:jsontoken});

            }else {
                res.json([{err:"password not valid"},false]);
            }


            }else{
                res.json([{err:"your not active send us your email for active"},false]);

            }

        }
    });
    }
});

///////////////////** */

router.get('/getuser/:id', midparse,function(req, res, next) {
    var id=req.params.id;
    UserModel.findOne({ _id:mongoose.Types.ObjectId(id),},{password:0}, function(err, user) {
        if(err){
            console.log(err);
            return;
        }
        if(user == null){
            res.json([{err:"user Not Found "},false]);
        }else {

            
                res.json({ user: user});

        }
    });
    
});


////////////////////** */

router.post('/register', [midparse,upload.single('photo')],function(req, res, next) {


    var imgs = [];



    var username  = req.body.username;
    var email     = req.body.email;
    var password  = req.body.password;
    var firstname =  req.body.firstname;
    var lastname  =  req.body.lastname;
    var phone     = req.body.phone ;
    var lat  = req.body.lat;
    var long =    req.body.lng;
    var img = req.body.img;
    var imgcover = "1.png";
    /** Image **/
 /*   if(req.files && req.files.length > 0){
        var files =req.files;
        for (var i=0;i<files.length;i++){
            fs.renameSync(files[i].path,files[i].destination+"/"+files[i].originalname);
        }

        imgs.push(files);
    }
    if(imgs.length > 0) {
        for (var i = 0; i < imgs.length;i++){
            if(imgs[i].fieldname === "personalimg"){
                var img = imgs[i].path;

            }else if(imgs[i].fieldname === "coverimg"){
                var imgcover=  imgs[i].path;

            }else {
                var img = "";
                var imgcover = "";
            }
        }

    }
*/


    /**End Image**/
    var resultvalid = valid.checkvalid(username,email,password,firstname,lastname,phone,lat,long,true,false,img,imgcover);

/*     if(imgs.length <= 0){
        res.json({err:"image not empty"})
    }else*/
    if(resultvalid[1] === false){
        res.json(resultvalid);
    }else{
        geocoder.reverse({lat:resultvalid.lat, lon:resultvalid.long}, function(err, result) {

        //Register Data
           UserModel.findOne({ email: resultvalid.email }, function(err, user) {
                    if (user) {
                        return res.status(400).json(
                            [{ msg: 'The email address you have entered is already associated with another account.' }]
                        );
                    }
                    user = new UserModel({
                        username: resultvalid.username,
                        email:    resultvalid.email,
                        password: resultvalid.password,
                        firstname:resultvalid.firstname,
                        lastname: resultvalid.lastname,
                        address:"zagazig",
                        img: resultvalid.img,
                        imgcover: resultvalid.imgcover,
                        phone: resultvalid.phone,
                        date:new Date(),
                        activation: resultvalid.activation,
                        admin: resultvalid.admin,
                        date:new Date()
                    });
                    user.save(function(err) {
                        if(err){
                            console.log(err);
                            return;
                        }
                        const jsontoken = jwt.sign({user: user},'mysecret-key');
                        res.json({ user: user, token:jsontoken});

                    });
                });
        });
    }
});
router.put('/edit/:id',[midparse,upload.any()],function (req,res,next) {
    var id = req.params.id;
    var username  = req.body.username;
    var email     = req.body.email;
    var password  = req.body.password;
    var firstname =  req.body.firstname;
    var lastname  =  req.body.lastname;
    var phone     = req.body.phone ;
    var lat  = "30.6546565666";
    var long =    "30.6546565666";
    var tokenKey = req.body.token;
    var Userimg = req.files[0];
    if(Userimg){

            ext=Userimg.originalname;
            ext2=ext.split('.');
            fs.renameSync(Userimg.path,Userimg.destination+"/"+Userimg.filename+'.'+ext2[1] );
            Userimg = Userimg.filename+'.'+ext2[1];
            console.log(Userimg);
    }
            //return console.log(Userimg);
    // let imgs = [];
  
    //     var files =req.body.img;
       
    //     for (var i=0;i<files.length;i++){
    
    //         imgs.push(files[i].filename+'.'+ext2[1]);
    //     }

    // let imgerr = [];
    // for (let i=0;i < imgs.length;i++) {
    //     
    // }


    // if(imgerr.length > 0 ){
    //     res.json(imgerr);

    // }else{
    //     res.json(imgs);
    // }



    var resultvalid = valid.checkvalidV2(username,email,firstname,lastname,phone,lat,long);
    
     if(resultvalid[1] === false){
        res.json(resultvalid);
    }else {

        jwt.verify(tokenKey,'mysecret-key',function (err,data) {

                if(data){
                    if(!Userimg) {
                        Userimg = data.img;
                    }
                    UserModel.findOne({ email: data.user.email }, function(err, user) {
                                if(err){
                                    console.log(err);
                                    return;
                                }
                                if(user == null){
                                    res.json({msg:"Email Not Found "});
                                }else {
                                    if(passwordHash.verify(password,user.password))
                                    {
                                        
                                        UserModel.update({_id:mongoose.Types.ObjectId(id)},{$set:{
                                                username: resultvalid.username,
                                                email: resultvalid.email,
                                                firstname: resultvalid.firstname,
                                                lastname: resultvalid.lastname,
                                                // location: {
                                                //     long: resultvalid.long,
                                                //     lat: resultvalid.lat
                                                // },
                                                img: Userimg,
                                                phone: resultvalid.phone,

                                            }},function (err,user) {
                                            if(err){
                                                console.log(err);
                                                return;
                                            }
                                            UserModel.findOne({ email: resultvalid.email }, function(err, user) {
                                                if(err){
                                                    console.log(err);
                                                    return;
                                                }
                                                if(user == null){
                                                    res.json({msg:"Email Not Found "});
                                                }else {
                                                    const jsontoken = jwt.sign({user: user}, 'mysecret-key');
                                                    res.json({user: user, token: jsontoken});
                                                }});

                                        });

                                    }else {
                                        res.json({msg:"password not valid"});
                                    }


                                }
                            });

                        }

        });
    }

});


router.put('/disactive/:id',midparse,function (req,res) {
    var id = req.params.id;
    var password = req.body.password;
    var tokenKey = req.body.token;

    jwt.verify(tokenKey,'mysecret-key',function (err,data) {


        UserModel.findOne({ email: data.user.email }, function(err, user) {
            if(err){
                console.log(err);
                return;
            }

            if(user == null){
                res.json({msg:"Email Not Found "});
            }else {

                if(passwordHash.verify(password,user.password))
                {
                    UserModel.update({_id:mongoose.Types.ObjectId(id)},{$set:{
                            activation: false

                        }},function (err,user) {
                        if(err){
                            console.log(err);
                            return;
                        }
                    res.json({msg:"your not active send us your email to active"})

                    });
                }else {
                    res.json({msg:"password not valid"});
                }

            }
        });


    });

});


// router.put('/admin/activation',midparse,function (req,res) {

//     var useremail = valid.emailvalid(req.body.email);
//     var passwordadmin = req.body.password;
//     var tokenKey = req.body.token;

//     var activation =  ( valid.activevaild(req.body.activation) === 'true');

//     jwt.verify(tokenKey,'mysecret-key',function (err,data) {

//         var admin = true
//         if(admin == data.user.admin){


//             UserModel.findOne({ email: data.user.email }, function(err, user) {
//                 if(err){
//                     console.log(err);
//                     return;
//                 }

//                 if(user == null){
//                     res.json({msg:"Email Not Found "});
//                 }else {

//                     if(passwordHash.verify(passwordadmin,user.password))
//                     {

//                         UserModel.findOne({ email: useremail }, function(err, user) {
//                             if(err){
//                                 console.log(err);
//                                 return;
//                             }

//                             if(user == null){
//                                 res.json({msg:"Email Not Found "});
//                             }else {
//                                 UserModel.update({email: useremail}, {
//                                     $set: {
//                                         activation: activation

//                                     }
//                                 }, function (err, user) {
//                                     if (err) {
//                                         console.log(err);
//                                         return;
//                                     }
//                                     if (activation)
//                                         res.json({msg: "user email has been active"});
//                                     else
//                                         res.json({msg: "user email has been disactive"});


//                                 });
//                             }

//                         });
//                     }
//                     else {
//                         res.json({msg:"password not valid"});
//                     }

//                 }
//             });

//         }

//     });

// });

// router.put('/admin/makeadmin',midparse,function (req,res) {

//     var useremail = valid.emailvalid(req.body.email);
//     var passwordadmin = req.body.password;
//     var tokenKey = req.body.token;

//     var adminvalid =  ( valid.activevaild(req.body.admin) === 'true');

//     jwt.verify(tokenKey,'mysecret-key',function (err,data) {

//         var admin = true
//         if(admin == data.user.admin){


//             UserModel.findOne({ email: data.user.email }, function(err, user) {
//                 if(err){
//                     console.log(err);
//                     return;
//                 }

//                 if(user == null){
//                     res.json({msg:"Email Not Found "});
//                 }else {

//                     if(passwordHash.verify(passwordadmin,user.password))
//                     {
//                         UserModel.findOne({ email: useremail }, function(err, user) {
//                             if(err){
//                                 console.log(err);
//                                 return;
//                             }

//                             if(user == null){
//                                 res.json({msg:"Email Not Found "});
//                             }else {
//                                 UserModel.update({email: useremail}, {
//                                     $set: {
//                                         admin: adminvalid

//                                     }
//                                 }, function (err, user) {
//                                     if (err) {
//                                         console.log(err);
//                                         return;
//                                     }
//                                     if (adminvalid)
//                                         res.json({msg: "user has been admin"});
//                                     else
//                                         res.json({msg: "user not be admin"});


//                                 });
//                             }

//                         });
//                     }else {
//                         res.json({msg:"password not valid"});
//                     }

//                 }
//             });

//         }

//     });

// });


router.put('/reset',midparse,function (req,res) {


    var oldpassword = req.body.oldpassword;
    var newpassword = req.body.newpassword;
    var againpassword = req.body.againpassword;
    var tokenKey = req.body.token;

    jwt.verify(tokenKey,'mysecret-key',function (err,data) {

        UserModel.findOne({email: data.user.email}, function (err, user) {
            if (err) {
                console.log(err);
                return;
            }

            if (user == null) {
                res.json({msg: "Email Not Found "});
            } else {

                if (passwordHash.verify(oldpassword, user.password)) {
                    if (newpassword === againpassword) {
                        newpassword = valid.passwordVaild(newpassword);
                        UserModel.update({email: data.user.email}, {
                            $set: {
                                password: newpassword

                            }
                        }, function (err, user) {
                            if (err) {
                                console.log(err);
                                return;
                            }

                            res.json({msg:"password Changed"});
                        });
                    }
                }
                else {
                    res.json({msg: "password not valid"});
                }
            }
        });
    });

    });


router.get('/newusers',midparse,function (req,res,next){
    UserModel.find({},{password:0,email:0},function(err, users) {
        if(err){
            console.log(err);
            return;
        }
        if(users == null ){
            res.json({msg:"Not Found content"});
        }else {

            res.json(users);

        }
    }).sort({date:-1}).limit(2);
});
//////////////////////*//////////////////////
router.put('/admin/activation',midparse,function (req,res) {

    var useremail = valid.emailvalid(req.body.email);
    var passwordadmin = req.body.password;
    var tokenKey = req.body.token;

    var activation = req.body.activation;// ( valid.activevaild(req.body.activation) === 'true');


     jwt.verify(tokenKey,'mysecret-key',function (err,data) {

        var admin = true
        if(admin == data.user.admin){


            UserModel.findOne({ email: data.user.email }, function(err, user) {
                if(err){
                    console.log(err);
                    return;
                }

                if(user == null){
                    res.json({msg:"Email Not Found "});
                }else {

                    if(passwordHash.verify(passwordadmin,user.password))
                    {

                        UserModel.findOne({ email: useremail }, function(err, user) {
                            if(err){
                                console.log(err);
                                return;
                            }

                            if(user == null){
                                res.json({msg:"Email Not Found "});
                            }else {
                                UserModel.update({email: useremail}, {
                                    $set: {
                                        activation: activation
                                    }
                                }, function (err, user) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    if (activation)
                                        res.json({msg: "user email has been active"});
                                    else
                                        res.json({msg: "user email has been disactive"});


                                });
                            }

                        });
                    }
                    else {
                        res.json({msg:"password not valid"});
                    }

                }
            });

        }

    });

});

router.put('/admin/makeadmin',midparse,function (req,res) {

    var useremail = valid.emailvalid(req.body.email);
    var passwordadmin = req.body.password;
    var tokenKey = req.body.token;

    var activation =  req.body.activation ;//( valid.activevaild(req.body.admin) === 'true');

    jwt.verify(tokenKey,'mysecret-key',function (err,data) {

        var admin = true
        if(admin == data.user.admin){


            UserModel.findOne({ email: data.user.email }, function(err, user) {
                if(err){
                    console.log(err);
                    return;
                }

                if(user == null){
                    res.json({msg:"Email Not Found "});
                }else {

                    if(passwordHash.verify(passwordadmin,user.password))
                    {
                        UserModel.findOne({ email: useremail }, function(err, user) {
                            if(err){
                                console.log(err);
                                return;
                            }

                            if(user == null){
                                res.json({msg:"Email Not Found "});
                            }else {
                                UserModel.update({email: useremail}, {
                                    $set: {
                                        admin: activation

                                    }
                                }, function (err, user) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    if (activation)
                                        res.json({msg: "user has been admin"});
                                    else
                                        res.json({msg: "user not be admin"});


                                });
                            }

                        });
                    }else {
                        res.json({msg:"password not valid"});
                    }

                }
            });

        }

    });

});
router.get('/all', function(req, res, next) {
        var tokenKey = req.header("Authorization");
        jwt.verify(tokenKey,'mysecret-key',function (err,data) {
            if(err){
                console.log(err);
                res.json({msg:"Auth Faild"});

            }else{
                if(data){
                    var admin = true;
                    var admintoken = data.user.admin;
                    if( admintoken == admin) {
                        UserModel.find({}, function(err, user) {
                            res.json({ users: user});
                        });
                    }else{
                        res.json({msg:"Auth Faild"});
                    }
                }
            }

        });
});

module.exports = router;
