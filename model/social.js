var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var socials = new Schema({
    _id:{ type: Schema.ObjectId, auto: true },
    storeid:{
        type:String,
        ref:"stores"
    },
    socials: {},
    phone:String
});

//Register Model..
mongoose.model("socials",socials);