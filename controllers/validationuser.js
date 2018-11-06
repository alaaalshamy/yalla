var validator = require('validator');
var sanitizer = require('sanitize')();
var passwordHash = require('password-hash');
var striptags = require('striptags');
var passwordValidator = require('password-validator');
var isImage = require('is-image');
module.exports ={
    uservalid : function uservalid (user) {
        var usr = validator.trim(striptags(sanitizer.value(user,String)));
        if(validator.isEmpty(usr)){
            return [{err:"username not be Empty"},false];
        }else if(!validator.isByteLength(usr,{max:15})){
            return [{err:"username must less than 15"},false];
        }else {
            return usr.toLowerCase();
        }
    },
    emailvalid : function emailvalid(email) {
        var Email = validator.trim(striptags(sanitizer.value(email,String)));
        if(validator.isEmpty(Email)){
            return [{err:"Email not be Empty"},false];
        }else if(!validator.isEmail(Email)){
            return [{err:"Not Correct Email"},false];
        }else {
            return Email;
        }
    },
    passwordVaild : function passwordVaild(pass) {
        var password = validator.trim(striptags(sanitizer.value(pass,String)));

        var schema = new passwordValidator();

        // Add properties to it
            schema
            .is().min(8)                                    // Minimum length 8
            .is().max(100)                                  // Maximum length 100
            .has().uppercase()                              // Must have uppercase letters
            .has().lowercase()                              // Must have lowercase letters
            .has().digits()                                 // Must have digits
            .has().not().spaces()                           // Should not have spaces
            .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values


        if(validator.isEmpty(password)){
            return [{err:"password not be Empty"},false];
        }else if(!schema.validate(password)){
            return [{err:"password must be have upper & lower letter and number and more than 8"},false];
        }else {
            return passwordHash.generate(password);
        }
    },
    firstnamevalid : function firstnamevalid(firstname) {
        var FirstName = validator.trim(striptags(sanitizer.value(firstname,String)));
        if(validator.isEmpty(FirstName)){
            return [{err:"FirstName not be Empty"},false];
        }else if(validator.matches(FirstName,/\w\d/)){
            return [{err:"FirstName must not have number"},false];
        }else if(!validator.isByteLength(FirstName,{max:10})){
            return [{err:"FirstName must less than 10"},false];
        }else {
            return FirstName.toLowerCase();
        }
    },
    lastnamevalid : function lastnamevalid(lastname) {
        var LastName = validator.trim(striptags(sanitizer.value(lastname,String)));
        if(validator.isEmpty(LastName)){
            return [{err:"LastName not be Empty"},false];
        }else if(validator.matches(LastName,/\w\d/)){
            return [{err:"LastName must not have number"},false];
        }else if(!validator.isByteLength(LastName,{max:10})){
            return [{err:"LastName must less than 10"},false];
        }else {
            return LastName.toLowerCase();
        }
    },
    latlongvalid : function latlongvalid(lat,long) {
        var Lat = validator.trim(striptags(sanitizer.value(lat,String)));
        var Long = validator.trim(striptags(sanitizer.value(long,String)));
        var latlong = Lat+","+Long;
        if(validator.isEmpty(Lat) || validator.isEmpty(Long)){
            return [{err:"Lat or long not be Empty"},false];
        }else if(!validator.isLatLong(latlong)){
            return [{err:"Lat or long Not define plz.write correct location"},false];
        }else {
            return [Lat,Long];
        }
    },
    phonevalid : function phonevalid(phone) {
        var mobile = validator.trim(striptags(sanitizer.value(phone,String)));
        if(validator.isEmpty(mobile)){
            return [{err:"phone not be Empty"},false];
        }else if(!validator.isNumeric(mobile)){
            return [{err:"phone must be number"},false];
        }else if(!validator.isByteLength(mobile,{max:15})){
            return [{err:"phone less than 15 number"},false];
        }
        else {
            return mobile;
        }
    },
    activevaild: function activevaild(active) {
        var Active = validator.trim(striptags(sanitizer.value(active,String)));
        if(!validator.isBoolean(Active)){
            return [{err:"Active must be boolean (true or false)"},false];
        }else {
            return Active;
        }

    },
    adminvaild: function adminvaild(admin) {
        var Admin = validator.trim(striptags(sanitizer.value(admin,String)));
        if(!validator.isBoolean(Admin)){
            return [{err:"Admin must be boolean (true or false)"},false];
        }else {

            return Admin;
        }
    },imgvalid: function imgvalid(img) {
    var Img = validator.trim(striptags(sanitizer.value(img,String)));
    if(validator.isEmpty(Img)){
        return [{err:"img must not be empty"},false];
    }else if(!isImage(Img)){
        return [{err:"img must be extention (jpeg,png,...) "},false];
    }else {
        return Img;
    }
    },
    checkvalid: function (username,email,password,firstname,lastname,phone,lat,long,activation,admin,img,imgcover) {
        if(!this.uservalid(username)[1]){
            return this.uservalid(username);
        }else if(!this.emailvalid(email)[1]){
            return this.emailvalid(email);
        }else if(!this.passwordVaild(password)[1]){
            return this.passwordVaild(password);
        }else if(!this.firstnamevalid(firstname)[1] ){
            return this.firstnamevalid(firstname);
        }else if(!this.lastnamevalid(lastname)[1]){
            return this.lastnamevalid(lastname);
        }else if(!this.phonevalid(phone)[1]){
            return this.phonevalid(phone);
        }else if(!this.latlongvalid(lat,long)[1]){
            return this.latlongvalid(lat,long);
        }else if(!this.activevaild(activation)[1]){
            return this.activevaild(activation);
        }else if(!this.adminvaild(admin)[1]){
            return this.adminvaild(admin);
        }else if(!this.imgvalid(img)[1]){
            return this.imgvalid(img);
        }else if(!this.imgvalid(imgcover)[1]){
            return this.imgvalid(imgcover);
        }
        else {
            activation = (this.activevaild(activation) === 'true');
            admin = (this.adminvaild(admin) === 'true');

           return {
                username : this.uservalid(username),
                email    : this.emailvalid(email),
                password : this.passwordVaild(password),
                firstname: this.firstnamevalid(firstname),
                lastname : this.lastnamevalid(lastname),
                phone    : this.phonevalid(phone),
                lat      : this.latlongvalid(lat,long)[0],
                long     : this.latlongvalid(lat,long)[1],
                img : this.imgvalid(img),
                imgcover: this.imgvalid(imgcover),
                activation: activation,
                admin : admin
            };

        }

   },checkvalidV2: function (username,email,firstname,lastname,phone,lat,long) {
        if(!this.uservalid(username)[1]){
            return this.uservalid(username);
        }else if(!this.emailvalid(email)[1]){
            return this.emailvalid(email);
        }else if(!this.firstnamevalid(firstname)[1] ){
            return this.firstnamevalid(firstname);
        }else if(!this.lastnamevalid(lastname)[1]){
            return this.lastnamevalid(lastname);
        }else if(!this.phonevalid(phone)[1]){
            return this.phonevalid(phone);
        }else if(!this.latlongvalid(lat,long)[1]){
            return this.latlongvalid(lat,long);
        }
        else {


            return {
                username : this.uservalid(username),
                email    : this.emailvalid(email),
                firstname: this.firstnamevalid(firstname),
                lastname : this.lastnamevalid(lastname),
                phone    : this.phonevalid(phone),
                lat      : this.latlongvalid(lat,long)[0],
                long     : this.latlongvalid(lat,long)[1],

            };

        }

    }




};