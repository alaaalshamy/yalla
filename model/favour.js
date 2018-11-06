var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var favours = new Schema({
    userid:{
        type: String,
        ref: "users"
    },
    storeid:{
        type:String,
        ref:"stores"
    }
});

//Register Model..
mongoose.model("favours",favours);