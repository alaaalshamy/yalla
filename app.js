const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const usersRouter = require('./controllers/users');
const storesRouter = require('./controllers/stores');
const session = require('express-session');
const mongoose = require('mongoose');
mongoose.connect('mongodb://alaaahmed:A123456789@ds161411.mlab.com:61411/newyalla');
//mongoose.connect('mongodb://localhost:27017/yalla');
//mongodb://localhost:27017/yalla

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(session({
    secret:"@#%#$^$%",
    cookie:{maxAge:1000*60*60*7*24}
}));

app.use('/users', usersRouter);
app.use('/stores', storesRouter);








// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.listen(9090,function () {
   console.log("starting...");
});


