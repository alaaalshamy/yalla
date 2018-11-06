var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var stores = new Schema({
   _id: { type: Schema.ObjectId, auto: true },
   category:{
       type: Number,
       ref: "categories"
   },
    name: String,
    email:String,
    password: String,
    img:String,
    imgcover: String,
    address:String,
    describe:String,
    date:Date,
    status:Boolean
});


//Register Model..
mongoose.model("stores",stores);