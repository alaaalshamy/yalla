var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var categories = new Schema({
   id: Number,

   name: String
});

//Register Model..
mongoose.model("categories",categories);