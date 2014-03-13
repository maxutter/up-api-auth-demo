// app/models/team.js
// load the things we need
var mongoose  = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our team model
var Schema = mongoose.Schema,
 ObjectId = Schema.ObjectId;
 
 var teamSchema = new Schema({
	 name		: String,
	 open		: Boolean,
	 password	: String, 
	 created	: { type: Date, default: Date.now }, 
     members	: { name : String,
		 			uid	 : String,
	 	 			role : String }
});

teamSchema.add({ "teams.members.uid": 'string'});


// methods ======================
// generating a hash
teamSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
teamSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};


// create the model for users and expose it to our app
module.exports = mongoose.model('Team', teamSchema, 'teams');
