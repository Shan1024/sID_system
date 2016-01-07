// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var chalk = require('chalk');
var defaultValues = require("../../config/defaultValues");

var userSchema = new mongoose.Schema({
	orgid: String,
    userDetails: {
		organization: String,
		email: String,
		password: String,
		verified: Boolean,
        created: {
            type: Date,
            default: Date.now
        }
    },
	members:[{
		userid: String,
		secret: String,
		username: String,
		email: String
	}],
	requests:[{
		userid: String,
		secret: String,
		username: String,
		email: String
	}]
});

// // set up a mongoose model and pass it using module.exports
// module.exports = mongoose.model('User', new Schema());

// generating a hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function (password) {
    console.log(chalk.yellow('Checking passwords . . .: ' + password));
    return bcrypt.compareSync(password, this.userDetails.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('OrgUser', userSchema);
