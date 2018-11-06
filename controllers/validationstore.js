var validator = require('validator');
var sanitizer = require('sanitize')();
var passwordHash = require('password-hash');
var striptags = require('striptags');
var passwordValidator = require('password-validator');
var isImage = require('is-image');
module.exports ={
    namevalid : function namevalid (name) {
        var Name = validator.trim(striptags(sanitizer.value(name,String)));
        if(validator.isEmpty(Name)){
            return [{err:"username not be Empty"},false];
        }else if(!validator.isByteLength(Name,{max:15})){
            return [{err:"username must less than 15"},false];
        }else {
            return Name.toLowerCase();
        }
    },
    emailvalid : function emailvalid(email) {
        var Email = validator.trim(striptags(sanitizer.value(email,String)));
        if(validator.isEmpty(Email)){
            return [{err:"Email not be Empty"},false];
        }else if(!validator.isEmail(Email)){
            return [{err:"Email must be write Exp..@mail.com "},false];
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
    },describevalid : function describevalid (descr) {
        var Descr = validator.trim(striptags(sanitizer.value(descr,String)));
        if(validator.isEmpty(Descr)){
            return [{err:"username not be Empty"},false];
        }else if(!validator.isByteLength(Descr,{max:195})){
            return [{err:"username must less than 195"},false];
        }else {
            return Descr.toLowerCase();
        }
    },ratevalid : function ratevalid(rate) {
        var Rate = validator.trim(striptags(sanitizer.value(rate,String)));
            if(!validator.isNumeric(Rate)){
                return [{err:"rate must be number"},false];
            }else if(!validator.isByteLength(Rate,{max:2})){
                return [{err:"rate must less than 15"},false];
            }else {
                return Rate;
            }


    },
    statusvaild: function statusvaild(status) {
        var Status = validator.trim(striptags(sanitizer.value(status,String)));
        if(!validator.isBoolean(Status)){
            return [{err:"Status must be boolean (true or false)"},false];
        }else {
            return Status;
        }

    },imgvalid: function imgvalid(img) {
        var Img = validator.trim(striptags(sanitizer.value(img,String)));
        if(validator.isEmpty(Img)){
            return [{err:"img must not be empty"},false,Img,validator.isEmpty(Img)];
        }else if(!isImage(Img)){
            return [{err:"img must be extention (jpeg,png,...) "},false];
        }else {
            return Img;
        }
    }
    ,
    checkstorevalid: function (name,email,password,describe,rate,lat,long,status,img,imgcover) {
        if(!this.namevalid(name)[1]){
            return this.namevalid(name);
        }else if(!this.emailvalid(email)[1]){
            return this.emailvalid(email);
        }else if(!this.passwordVaild(password)[1]){
            return this.passwordVaild(password);
        }else if(!this.describevalid(describe)[1]){
            return this.describevalid(describe);
        }else if(this.ratevalid(rate)[1]){
            return this.ratevalid(rate);
        }else if (!this.latlongvalid(lat,long)[1]){
            return this.latlongvalid(lat,long);
        }else if(!this.statusvaild(status)[1]){
            return this.statusvaild(status);
        }else if(!this.imgvalid(img)[1]){
            return this.imgvalid(img);
        }else if(!this.imgvalid(imgcover)[1]){
            return this.imgvalid(imgcover);
        }
        else {
            status = (this.statusvaild(status) === "true");
            return{
                name:this.namevalid(name),
                email    : this.emailvalid(email),
                pass:this.passwordVaild(password),
                describe:this.describevalid(describe),
                rate:this.ratevalid(rate),
                img:this.imgvalid(img),
                imgcover:this.imgvalid(imgcover),
                lat:this.latlongvalid(lat,long)[0],
                long:this.latlongvalid(lat,long)[1],
                status:status
            };

        }
        },



};