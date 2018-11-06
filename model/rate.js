var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var rates  = new Schema({
    _id : { type: Schema.ObjectId, auto: true },
   storeid:{
        type:String,
        ref:"stores"
    },
    rates:
      [  {
            _id:String
            ,
            userid: {
            type: String,
            ref: "users"
            }
            ,
            rate:Number}]

});



//Register Model..
mongoose.model("rates",rates);



/* userid: {
        type: String,
        ref: "users"
   },},
    rate: Number*/