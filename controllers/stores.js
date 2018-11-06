var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

var bodyparser = require('body-parser');
var passwordHash = require('password-hash'); //for generet pass and verifiy

var midparse = bodyparser.urlencoded();
var fs = require('fs');

var valid = require('./validationstore');

var multer = require('multer');
var NodeGeocoder = require('node-geocoder');
var mongoose = require('mongoose');

require("../model/users");
require("../model/stores");
require("../model/feedback");
require("../model/categories");
require("../model/favour");
require("../model/social");
require("../model/content");
require("../model/rate");




var UserModel = mongoose.model('users');
var StoreModel = mongoose.model('stores');
var FeedbackModel = mongoose.model('feedbacks');
var CategoryModel = mongoose.model('categories');
var FavourModel = mongoose.model('favours');
var SocialModel = mongoose.model('socials');
var ContentModel = mongoose.model('contents');
var RateModel = mongoose.model('rates');


var upload=multer({
    dest:"./public/img"
});

var options = {
    provider: 'google',

    // Optional depending on the providers
    httpAdapter: 'https', // Default
    apiKey: 'AIzaSyARP_rGAxnm5haEe88zKlNfEl9TmPUbGfs', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};



var geocoder = NodeGeocoder(options);



router.post('/register',midparse,function (req,res) {
    var categoryid = req.body.categoryid;
    var email = req.body.email;
    var name = req.body.name;
    var password = req.body.password;
    var imgcover = '1.png';
    var long = req.body.lng;
    var lat = req.body.lat;
    var describe = req.body.describe;
    var img = req.body.img;

/*
    var storeimg = req.files[0];

    ext=storeimg.originalname;
    ext2=ext.split('.');
    fs.renameSync(storeimg.path,storeimg.destination+"/"+storeimg.filename+'.'+ext2[1] );
    storeimg = storeimg.filename+'.'+ext2[1];

     res.json(req.body);
*/
    console.log(lat);
    var result_valid = valid.checkstorevalid(name,email,password,describe,0,lat,long,true,img,imgcover);


    if(result_valid[1] === false){
        res.json(result_valid);
    }
    else {
        geocoder.reverse({lat:parseFloat(result_valid.lat), lon:parseFloat(result_valid.long)}, function(err, result) {
            let location =  result[0].formattedAddress;
            if(location){
                 StoreModel.findOne({ email: result_valid.email,name: result_valid.name }, function(err, store) {

                            if (store) {
                                return res.status(400).json(
                                    [{ msg: 'The email address you have entered is already associated with another account.' }]
                                );
                            }
                            store = new StoreModel({
                                category:categoryid,
                                email:result_valid.email,
                                name:result_valid.name,
                                password:result_valid.pass,
                                img:result_valid.img,
                                imgcover:result_valid.imgcover,
                                address:location,
                                describe:result_valid.describe,
                                date:new Date(),
                                status:result_valid.status

                            });
                            store.save(function(err) {
                                if(err){
                                    console.log(err);
                                    return;
                                }
                                const jsontoken = jwt.sign({store: store},'mysecret-key');
                                res.json({ store: store, token:jsontoken});

                            });
                 });

            }else {
                res.json({ err: "error by server"});
            }
        });
    }

});

router.post('/login', midparse,function(req, res, next) {

    if(!valid.emailvalid(req.body.email)[1])
    {
        res.json(valid.emailvalid(req.body.email));
    }else{

        StoreModel.findOne({ email: valid.emailvalid(req.body.email) }, function(err, store) {
            if(err){
                console.log(err);
                return;
            }

            if(store == null){
                res.json([{err:"Email Not Found "},false]);
            }else {

                if(store.status == true){
                    if(passwordHash.verify(req.body.password,store.password))
                    {
                        const jsontoken = jwt.sign({store: store},'mysecret-key');
                        res.json({ store: store, token:jsontoken});

                    }else {
                        res.json([{msg:"password not valid"},false]);
                    }


                }else{
                    res.json([{msg:"your not active send us your email for active"},false]);

                }


            }
        });
    }
});

router.post('/addcategory', midparse,function(req, res, next) {

    var id = isNaN(req.body.id);
    var name = valid.namevalid(req.body.name);

    if(!id === false){
        res.json({err:"plz write number"});
    }else if(name[1] === false){
        res.json(valid.namevalid(req.body.name));
    }
    else {

        id =Number(req.body.id);
        CategoryModel.findOne({name: name,id :id }, function (err, cate) {
            if (cate) {
                return res.status(400).json([{msg: 'The name you have entered is already associated with another name of category.'}]);
            }
            cate = new CategoryModel({
                id: id,
                name: name
            });
            cate.save(function (err) {
                if (err) {
                    console.log(err);
                    return;
                }

                res.json({category: cate});
            });
        });
    }


});


router.post('/addcontent',[ midparse,upload.any()],function(req, res, next) {
    var storeid = req.body.storeid;
    var categoryid = parseInt(req.body.categoryid);
    var name = valid.namevalid(req.body.name);
    var describe = valid.describevalid(req.body.describe);

    let imgs = [];
    if(req.files && req.files.length > 0){
        var files =req.files;
        for (var i=0;i<files.length;i++){
            ext=files[i].originalname;
            ext2=ext.split('.');

            fs.renameSync(files[i].path,files[i].destination+"/"+files[i].filename+'.'+ext2[1] );
            imgs.push(files[i].filename+'.'+ext2[1]);
        }

    }
    let imgerr = [];
    for (let i=0;i < imgs.length;i++) {
        if(!valid.imgvalid(imgs[i])[1]){
                     imgerr.push([valid.imgvalid(imgs[i]),"index num "+i]);
                 }
    }

    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1; //January is 0!
    let yyyy = today.getFullYear();

    if(dd<10) {
        dd = '0'+dd
    }

    if(mm<10) {
        mm = '0'+mm
    }

    let todaydate = mm + '/' + dd + '/' + yyyy;
    let todaytime = today.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });


     if(imgerr.length > 0 ){
         res.json(imgerr);

     }else if(!valid.describevalid(req.body.describe)[1]) {
        res.json(valid.describevalid(req.body.describe));

    }else{
         var contents = new ContentModel({
             storeid:storeid,
             categoryid:categoryid,
             img:imgs,
             name:valid.namevalid(req.body.name),
             description:valid.describevalid(req.body.describe),
             date:new Date(),
             like:0
        });
        contents.save(function(err) {
            if(err){
                console.log(err);
                return;
            }
            res.json({ contents: contents});

        });




    }




});

router.get('/getfeedback/:id',function(req, res){
    var id  = req.params.id;
    console.log(id);
    FeedbackModel.find({contentid:id,status:0}, function(err, feedback) {
        if(err){
            console.log(err);
           res.json({err:err});
            return;
        }else{    
            if(feedback == null || feedback.length <= 0){
                return;            }else {
                UserModel.populate(feedback,{path:"userid",select:["username","img"]},function (err,data2) {
                    //console.log({feedbacks:data2});
                    res.json(data2);        
                });
            };
            }
        }
    );
 });
 router.post('/addfeedback', midparse,function(req, res, next) {
    var storeid = req.body.storeid;
    var userid = req.body.userid;
    var contentid = req.body.contentid;
    var content = valid.describevalid(req.body.content);
    console.log(req.body);
    // return res.json(req.body);
    if(!valid.describevalid(req.body.content)[1]) {
        res.json(valid.describevalid(req.body.content));
    }else {
        var feedback = new FeedbackModel({
            storeid: storeid,
            userid: userid,
            contentid:contentid,
            content: content,
            status:0,
            report:0
        });
        feedback.save(function (err) {
            if (err) {
                console.log(err);
                return;
            }
            res.json({feedback: feedback});

        });

    }
});



router.put('/addlike/:idcontent',midparse,function (req,res) {
        let contentid = req.params.idcontent;
        let status = req.body.status;
        let userid = req.body.userid;

        ContentModel.find({_id:mongoose.Types.ObjectId(contentid)},function (err,result) {
           if(err){
               console.log(err);
               return;
           }else{
                let like = result[0].like;
                if(status == 1){
                    let newlike = ++like;
                    ContentModel.update({_id:mongoose.Types.ObjectId(contentid)},{$set:{like:newlike},$push: {userslikes:userid}},function (err,result2) {
                       if(err){
                           console.log(err);
                           return;
                       }else {
                           res.json({msg:"Liked"});
                       }
                    });
                }
                //mins like
                else if(status == 0) {
                    if(like <= 0){
                        let newlike = 0;
                        res.json({msg:"dislike"});
                    }else {
                        let newlike = --like;
                        ContentModel.update({_id:mongoose.Types.ObjectId(contentid)},{$set:{like:newlike},$pull:{userslikes:userid}},function (err,result2) {
                            if(err){
                                console.log(err);
                                return;
                            }else {
                                res.json({msg:"disLiked"});
                            }
                        });
                    }
                }else {
                    res.json({err:"status must be 0 or 1"});

                }
           }
        });

});

router.post('/addsocial', midparse,function(req, res, next) {
        var storeid = req.body.storeid;
        var socials = req.body.socials;
        var phone = req.body.phone;
        var Socials = new SocialModel({
            storeid:storeid,
            socials:socials,
             phone:phone
        });
        Socials.save(function(err) {
            if(err){
                console.log(err);
                return;
            }
            res.json({ socials: Socials});

        });


});

router.post('/addfeedback', midparse,function(req, res, next) {
    var storeid = req.body.storeid;
    var userid = req.body.userid;
    var contentid = req.body.contentid;
    var content = valid.describevalid(req.body.content);

    if(!valid.describevalid(req.body.content)[1]) {
        res.json(valid.describevalid(req.body.content));

    }else {

        var feedback = new FeedbackModel({
            storeid: storeid,
            userid: userid,
            contentid:contentid,
            content: content,
            status:0,
            report:0
        });
        feedback.save(function (err) {
            if (err) {
                console.log(err);
                return;
            }
            res.json({feedback: feedback});

        });

    }
});

router.post('/makefavour', midparse,function(req, res, next) {
    var storeid = req.body.storeid;
    var userid = req.body.userid;

        var favour = new FavourModel({
            storeid: storeid,
            userid: userid
        });
        favour.save(function (err) {
            if (err) {
                console.log(err);
                return;
            }
            res.json({favour: favour});

        });
});

router.get('/favour/:id', midparse,function(req, res, next) {
    var userid = req.params.id;


    FavourModel.find({userid:userid}, function(err, favour) {
        if(err){
            console.log(err);
            return;
        }else{

            if(favour == null || favour.length <= 0){
                return;

            }else {
                StoreModel.populate(favour,{path:"storeid",select:"name"},function (err,result) {
                    res.json({allfavorite:result});
                });

            }
        }
            });
});



router.post('/addrate',midparse,function (req,res,next) {
    var storeid = req.body.storeid;
    var userid = req.body.userid;
    var rateuser = req.body.rate;


    if(!valid.ratevalid(req.body.rate)[1] === false) {
        res.json(valid.ratevalid(req.body.rate));

    }else {



        RateModel.find({'storeid':storeid}, function(err, rate) {
            if(err){
                console.log(err);
                return;
            }else{

                if(rate == null || rate.length <= 0){

                    /**not found store so make new object of store**/

                    var rate = new RateModel({
                        storeid: storeid,
                        rates:[{_id:'rateing',userid:userid,rate:rateuser}]
                    });

                    rate.save(function (err) {
                        if (err) {
                            console.log(err);
                            return;
                        }

                        res.json({rates: rate});

                    });

                }else {
                    /**found store**/

                    RateModel.find({'storeid':storeid,'rates.userid':userid}, function(err, rate) {
                        if(err){
                            console.log(err);
                            return;
                        }else{
                            if(rate == null || rate.length <= 0){

                                /**if found store but not found user**/
                                /** add new user**/
                                RateModel.update({'storeid':storeid},{
                                    $push:{
                                        rates:{_id:'rateing',userid:userid,rate:rateuser}
                                    }
                                },function(err, rate) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }else {
                                        /** return new data**/
                                        RateModel.find({'storeid':storeid}, function(err, rate) {
                                            if (err) {
                                                console.log(err);
                                                return;
                                            }else {
                                                res.json({rates: rate});
                                            }
                                        });

                                    }

                                });

                            }else {
                                /**if found store but not user**/
                                /** add old user**/

                                RateModel.update({'rates.userid':userid},
                                    {'$set': {'rates.$.rate':rateuser}},function (err,rate) {
                                        if (err) {
                                            console.log(err);
                                            return;
                                        }else {
                                            /** return new data**/
                                            RateModel.find({'storeid':storeid}, function(err, rate) {
                                                if (err) {
                                                    console.log(err);
                                                    return;
                                                }else {
                                                    res.json({rates: rate});
                                                }
                                            });

                                        }

                                    });
                            }
                        }
                    });

                }
            }
        });
    }

});

router.get('/getrate/:id',midparse,function (req,res) {
    let idstore = req.params.id;
    RateModel.aggregate(
        [
            { "$match": { "storeid": idstore } },
            { "$group": {
                    _id :{ '$sum':'$rates.rate'},
                    "countuser": { "$sum": { "$size": "$rates" } },

                }
            },

        ],
        function (err, sumrate) {
            if (err) {
                console.log(err);
                return;
            }else {
                if(sumrate == null || sumrate.length <= 0){
                    res.json({rates:{sumrates: 0,sumuser: 0}});
                }else{
                    res.json({rates:{sumrates: parseInt( sumrate[0]._id / sumrate[0].countuser) ,sumuser: sumrate[0].countuser}});
                }

            }
        }
    );
});

router.get('/getrates',midparse,async function(req,res)  {

    RateModel.find({},async function(err,allstores)  {
        if (err) {
            console.log(err);
            return;
        }else {
            let len_Store = allstores.length;

            const toprate = [];

            for(let x = 0 ;x <= len_Store-1 ; x++  ){
               RateModel.aggregate(
                    [
                        { "$match": { "storeid": allstores[x].storeid } },
                        { "$group": {
                                _id :{ '$sum':'$rates.rate'},
                                "countuser": { "$sum": { "$size": "$rates" } },

                            }
                        },

                    ],
                    async function (err, sumrate) {
                        if (err) {
                            console.log(err);
                            return;
                        }else {
                            if(sumrate == null || sumrate.length <= 0){
                                res.json({err:"error"});
                            }else{

                                toprate.push(
                                    [allstores[x].storeid , parseInt( sumrate[0]._id / sumrate[0].countuser)]
                                    /*{
                                        storeid:allstores[x].storeid,
                                        sumrates: parseInt( sumrate[0]._id / sumrate[0].countuser) ,
                                        sumuser: sumrate[0].countuser}*/
                                    );
                                if(x == len_Store-1){
                                    res.json(toprate);
                                }
                            }

                        }

                    }

                );

            }

        }
    });
});
/**********get one post */

router.get('/onecollection/:id',midparse,function (req,res) {

    // let catid = parseInt(req.header("category"));
    let contentid = req.params.id;
    // return res.json(contentid);
    ContentModel.find({_id: contentid},function(err, content) {
        if(err){
            console.log(err);
            return;
        }
        if(content == null ){
            res.json({msg:"Not Found content"});
        }else {
            StoreModel.populate(content,{path:"storeid",select:["name","img","address","status","storeid","date"]}
            ,function (err,data2) {
                    if(err){
                        console.log(err);
                        return;
                    }

                    res.json(data2);
            });

        }
    });
});


router.get('/getstoredata/:id',midparse,function (req,res,next) {

    let id = req.params.id;
    StoreModel.find({ _id:mongoose.Types.ObjectId(id) },{_id:0,password:0},function(err, stores)
    {
        if(err){
            console.log(err);
            return;
        }

        if(stores == null){
            res.json({msg:"Not Found Stores"});
        }else {

            res.json({stores:stores})

        }
    });
});


router.get('/getall',midparse,function (req,res,next) {

    StoreModel.find({} ,{password:0},function(err, stores) {
        if(err){
            console.log(err);
            return;
        }

        if(stores == null){
            res.json({msg:"Not Found Stores"});
        }else {

            res.json(stores)

        }
    });
});



router.get('/newcollection',midparse,function (req,res) {

    let catid = parseInt(req.header("category"));
    ContentModel.find({categoryid:catid},function(err, content) {
        if(err){
            console.log(err);
            return;
        }
        if(content == null ){
            res.json({msg:"Not Found content"});
        }else {
            StoreModel.populate(content,{path:"storeid",select:["name","img","address","status"]}
            ,function (err,data2) {
                    if(err){
                        console.log(err);
                        return;
                    }

                    res.json(data2);
            });

        }
    }).sort({date:-1}).limit(3);
});

router.get('/newyalla',midparse,function (req,res,next){
    let catid = parseInt(req.header("category"));
        StoreModel.find({category:catid},function(err, content) {
        if(err){
            console.log(err);
            return;
        }
        if(content == null ){
            res.json({msg:"Not Found content"});
        }else {

                    res.json(content);

        }
    }).sort({date:-1}).limit(2);
});




router.get('/getstore/:id',midparse,async (req,res,next) =>{
    //var id  = mongoose.Types.ObjectId(toString(req.params.id));
    var id  = req.params.id;
    const data = [];

    
    /**Content**/
    ContentModel.find({storeid:id}, function(err, content) {
        if(err){
            console.log(err);
            return;
        }

        if(content == null || content.length <= 0){
            return;


        }else {
            const contentdata=   {contents:content};
            data.push( contentdata);
        }
    });


    /**Socail**/
    SocialModel.find({storeid:id}, function(err, social) {
        if(err){
            console.log(err);
            return;
        }else{

            if(social == null || social.length <= 0){
                return;

            }else {
               // console.log({socials:social[0].socials});
                data.push({socials:social[0].socials})
            }
        }

    });

    /**Rates**/
    RateModel.find({storeid:id}, function(err, rate) {
        if(err){
            console.log(err);
            return;
        }else{

            if(rate == null || rate.length <= 0) {
                return
            }else {

                var x = 0;
                var y = rate.length;

                for(var i =0;i<rate.length;i++){
                    x += rate[i].rate;

                }
                data.push({rates: parseInt( x/y)});

            }
        }});


    /**Feedback**/
    FeedbackModel.find({storeid:id}, function(err, feedback) {
        if(err){
            console.log(err);
//            res.json({err:err});
            return;
        }else{

            if(feedback == null || feedback.length <= 0){
                return;

            }else {
                UserModel.populate(feedback,{path:"userid",select:"username"},function (err,data2) {
                    //console.log({feedbacks:data2});
                    data.push({feedbacks:data2})
                });

            }
        }

    });
    StoreModel.find({ _id:mongoose.Types.ObjectId(id) },{_id:0,password:0}, function(err, store) {
        if(err){
            console.log(err);
            return;
        }

        if(store == null || store.length <= 0){
            res.json({msg:"store Not Found "});
        }else {
            const storedata = {store:store};
            data.push(storedata);
            res.json(data);

        }
    });


});





router.get('/getonlystore/:id',midparse,function (req,res,next) {


    StoreModel.find({ _id:mongoose.Types.ObjectId(req.params.id) },{password:0}, function(err, store) {
        if(err){
            console.log(err);
            return;
        }

        if(store == null || store.length <= 0){
            res.json({msg:"store Not Found "});
        }else {

            res.json(store);

        }
    });


});

router.get('/getsocialmedia/:id',midparse,function (req,res,next) {

SocialModel.find({storeid:req.params.id}, function(err, social) {
    if(err){
        console.log(err);
        return;
    }else{

        if(social == null || social.length <= 0){
            return;

        }else {
            // console.log({socials:social[0].socials});
            res.json(social);
        }
    }

});

});



router.get('/getcontentstore/:id',midparse,function (req,res,next) {

    ContentModel.find({storeid:req.params.id}, function(err, content) {
        if(err){
            console.log(err);
            return;
        }else{

            if(content == null || content.length <= 0){
                return;

            }else {
                // console.log({socials:social[0].socials});
                res.json(content);
            }
        }

    }).sort({date:-1});

});


router.get('/getstoreofcategory/:id',midparse,function (req,res,next) {
 var id = Number(req.params.id);

   StoreModel.find({ category:id },{password:0}, function(err, store) {
        if(err){
            console.log(err);
            return;
        }

        if(store == null || store.length <= 0){
            res.json({msg:"store Not Found "});
        }else {
            const storedata = {store:store};
            res.json(storedata);
        }
    });
});

router.get('/editstore/:id',midparse,function (req,res,next){
    var id  = req.params.id;


    StoreModel.find({ _id:mongoose.Types.ObjectId(id) },{password:0}, function(err, store) {
        if(err){
            console.log(err);
            return;
        }

        if(store == null || store.length <= 0){
            res.json({msg:"store Not Found "});
        }else {
            const storedata = {store:store};
            res.json(storedata);
        }
    });

});

router.get('/getcontent/:id',midparse,function (req,res,next) {

    let id = req.params.id;

    ContentModel.find({_id:mongoose.Types.ObjectId(id)},function(err, content) {
        if(err){
            console.log(err);
            return;
        }

        if(content == null){
            res.json({msg:"Not Found content"});
        }else {

            res.json({contents:content})

        }
    });
});


router.put('/editstore/:id',[midparse,upload.any()],function (req,res,next) {
    var id = req.params.id;
    var tokenKey = req.body.token;
    var categoryid = req.body.category;
    var Semail = req.body.email;
    var Sname = req.body.name;
    var password = req.body.password;
    var img = req.body.img;
    var imgcover = req.body.img;
    var lat  = "30.6546565666";
    var long =    "30.6546565666";
    var Sdescribe = req.body.describe;
    var status = "true";
    Storeimg = req.files[0];
    ext=Storeimg.originalname;
        ext2=ext.split('.');
        fs.renameSync(Storeimg.path,Storeimg.destination+"/"+Storeimg.filename+'.'+ext2[1] );
        Storeimg = Storeimg.filename+'.'+ext2[1];
    // var result_valid = valid.checkstorevalid(name,email,password,describe,lat,long,status,img,imgcover);

    jwt.verify(tokenKey,'mysecret-key',function (err,data) {

        if(data){
            console.log(data);
            StoreModel.findOne({ email: data.store.email }, function(err, store) {
                if(err){
                    console.log(err);
                    return;
                }
              
                        StoreModel.update({_id:mongoose.Types.ObjectId(id)},{$set:{

                                category:categoryid,
                                email:Semail,
                                name:Sname,
                                password:data.store.password,
                                img:Storeimg,
                                imgcover:Storeimg,
                                date:new Date,
                                describe:Sdescribe,

                            }},function (err,store) {
                            if(err){
                                console.log(err);
                                return;
                            }
                            StoreModel.findOne({ email:Semail }, function(err, store) {
                                if(err){
                                    console.log(err);
                                    return;
                                }

                                if(store == null || store.length <=0){
                                    res.json({msg:"Email Not Found "});
                                }else {

                                    const jsontoken = jwt.sign({store: store}, 'mysecret-key');
                                   return res.json({store: store, token: jsontoken});
                                }});

                        });

            });

        }

    });

});
router.put('/reset',midparse,function (req,res) {


    var oldpassword = req.body.oldpassword;
    var newpassword = req.body.newpassword;
    var againpassword = req.body.againpassword;
    var tokenKey = req.body.token;

    jwt.verify(tokenKey,'mysecret-key',function (err,data) {

        StoreModel.findOne({email: data.store.email}, function (err, store) {
            if (err) {
                console.log(err);
                return;
            }

            if (store == null) {
                res.json({msg: "Email Not Found "});
            } else {

                if (passwordHash.verify(oldpassword, store.password)) {
                    if (newpassword === againpassword) {
                        newpassword = valid.passwordVaild(newpassword);
                        UserModel.update({email: data.store.email}, {
                            $set: {
                                password: newpassword

                            }
                        }, function (err, store) {
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

router.post('/getlocation',midparse,function (req,res) {

    geocoder.reverse({lat:parseFloat(req.body.lat), lon:parseFloat(req.body.long)}, function(err, result) {
        let location =  result[0].formattedAddress;
        res.json(location);
    });
});
////////////////////*store/////////////////////

router.put('/editstore/:id',[midparse,upload.any()],function (req,res,next) {
    var id = req.params.id;
    var tokenKey = req.body.token;
    var categoryid = req.body.category;
    var Semail = req.body.email;
    var Sname = req.body.name;
    var password = req.body.password;
    var img = req.body.img;
    var imgcover = req.body.img;
    var lat  = "30.6546565666";
    var long =    "30.6546565666";
    var Sdescribe = req.body.describe;
    var status = "true";
    Storeimg = req.files[0];
    if(Storeimg.length>0){
    ext=Storeimg.originalname;
        ext2=ext.split('.');
        fs.renameSync(Storeimg.path,Storeimg.destination+"/"+Storeimg.filename+'.'+ext2[1] );
        Storeimg = Storeimg.filename+'.'+ext2[1];
    }
    jwt.verify(tokenKey,'mysecret-key',function (err,data) {

        if(data){
            console.log(data);
            if(Storeimg.length<1) {
                Storeimg = data.img;
            }
            StoreModel.findOne({ email: data.store.email }, function(err, store) {
                if(err){
                    console.log(err);
                    return;
                }
                        StoreModel.update({_id:mongoose.Types.ObjectId(id)},{$set:{

                                category:categoryid,
                                email:Semail,
                                name:Sname,
                                password:data.store.password,
                                img:Storeimg,
                                imgcover:Storeimg,
                                date:new Date,
                                describe:Sdescribe,

                            }},function (err,store) {
                            if(err){
                                console.log(err);
                                return;
                            }
                            StoreModel.findOne({ email:Semail }, function(err, store) {
                                if(err){
                                    console.log(err);
                                    return;
                                }

                                if(store == null || store.length <=0){
                                    res.json({msg:"Email Not Found "});
                                }else {

                                    const jsontoken = jwt.sign({store: store}, 'mysecret-key');
                                    res.json({store: "user updated", token: jsontoken});
                                }});
                        });                
            });

        }

    });

});

/////////////////*post*/////////////////////////

router.put('/editContent/:id',[midparse,upload.any()],function (req,res,next) {
    var id = req.params.id;
    var tokenKey = req.body.token;
    var storeid = req.body.storeid;
    var categoryid = parseInt(req.body.categoryid);
    var name = valid.namevalid(req.body.name);
    var describe = valid.describevalid(req.body.describe);
    let imgs = [];

    if(req.files && req.files.length > 0){
        var files =req.files;
        for (var i=0;i<files.length;i++){
            ext=files[i].originalname;
            ext2=ext.split('.');

            fs.renameSync(files[i].path,files[i].destination+"/"+files[i].filename+'.'+ext2[1] );
            imgs.push(files[i].filename+'.'+ext2[1]);
        }

    }
    let imgerr = [];
    for (let i=0;i < imgs.length;i++) {
        if(!valid.imgvalid(imgs[i])[1]){
                     imgerr.push([valid.imgvalid(imgs[i]),"index num "+i]);
                }
    }
    jwt.verify(tokenKey,'mysecret-key',function (err,data) {
        if(data){
            console.log(data);
            ContentModel.findOne({ _id: data.store._id }, function(err, store) {
                if(err){
                    console.log(err);
                    return;
                }
                        ContentModel.update({_id:mongoose.Types.ObjectId(id)},{$set:{

                            storeid:storeid,
                            categoryid:categoryid,
                            img:imgs,
                            name:name,
                            description:describe

                            }},function (err,store) {
                            if(err){
                                console.log(err);
                                return;
                            }
                            
                });                
            });
        }
    });
});

router.get('getContent/:id',midparse,function(req,res,next){
    var id =req.params.id;
    ContentModel.find({_id:id}, function(err, content) {
        if(err){
            console.log(err);
            return;
        }

        if(content == null || content.length <= 0){
            return;


        }else {
            const contentdata=   {contents:content};
            data.push( contentdata);
            res.json(data);
        }
    });

});



/** alaa Comment***/


router.put('/editComment/:id',function(req, res){
    var id  = req.params.id;
    var content =req.body.content
    console.log(req.body);
    FeedbackModel.find({_id:id}, function(err, feedback) {
        if(err){
            console.log(err);
            res.json({err:err});
            return;
        }else
        {
            if(feedback == null || feedback.length <= 0){
                return;
            }else {
                FeedbackModel.update({_id:mongoose.Types.ObjectId(id)},{$set:{
                    content:content,

                }},function (err,store) {
                    if(err){
                        console.log(err);
                        return;
                    }
                });
            }}
    });
});
router.get('/getComment/:id',function(req, res){
    var id  = req.params.id;
    console.log(id);
    FeedbackModel.find({_id:id}, function(err, feedback) {
            if(err){
                console.log(err);
                res.json({err:err});
                return;
            }else{
                if(feedback == null || feedback.length <= 0){
                    return;
                }else {
                    UserModel.populate(feedback,{path:"userid",select:["username","img"]},function (err,data2) {
                        //console.log({feedbacks:data2});
                        res.json({feedback:data2});
                    });
                };
            }
        }
    );
});

///////////////////*store*///////////////// */

router.get('/getallfeedback',function(req, res){

    FeedbackModel.find({}, function(err, feedback) {
            if(err){
                console.log(err);
                res.json({err:err});
                return;
            }else{
                if(feedback == null || feedback.length <= 0){
                return;            }else {
                UserModel.populate(feedback,{path:"userid",select:["username","img"]},function (err,data2) {
                    //console.log({feedbacks:data2});
                    res.json(data2);
                });
            };
            }
        }
    );
});

router.put('/admin/activetioncomment',midparse,function (req,res) {

    var id = req.body.id;
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
                        FeedbackModel.findOne({ _id:mongoose.Types.ObjectId(id) }, function(err, content) {
                            if(err){
                                console.log(err);
                                return;
                            }

                            if(content == null){
                                res.json({msg:"id Not Found "});
                            }else {
                                FeedbackModel.update({_id:mongoose.Types.ObjectId(id)}, {
                                    $set: {
                                        status: activation

                                    }
                                }, function (err, content) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    if (activation === 0)
                                        res.json({msg: "content has been showed"});
                                    else
                                        res.json({msg: "user has been deleted"});
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










module.exports = router;


