var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var feedbacks  = new Schema({
    _id : { type: Schema.ObjectId, auto: true },
   userid: {
        type: String,
        ref: "users"
   },
   storeid:{
        type:String,
       ref:"stores"
   },
    contentid:{
        type:String,
        ref:"content"
    },
   content: String,
   status: Number,
    report: Number
});



//Register Model..
mongoose.model("feedbacks",feedbacks);