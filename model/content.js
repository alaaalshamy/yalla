var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var contents = new Schema({
    _id: { type: Schema.ObjectId, auto: true },
    categoryid:Number,
    storeid:{
        type: String,
        ref: "stores"
    },
    name: String,
    img: [String],
    userslikes:[String],
    description: String,
    date:Date,
    like:Number
});

//Register Model..
mongoose.model("contents",contents);