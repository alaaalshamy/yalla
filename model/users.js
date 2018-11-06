var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var users = new Schema({
    _id: { type: Schema.ObjectId, auto: true },
    username: String,
    email: String,
    password: String,
    firstname: String,
    lastname: String,
    address:String,
    img:{
        type:String,
        required: false
    },
    imgcover:{
        type:String,
        required: false
    },
    phone: String,
    date:Date,
    activation: Boolean,
    admin: Boolean
});
//Register Model..
mongoose.model("users",users);