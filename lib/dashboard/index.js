var express = require('express');
var app = module.exports = express();
var util = require("util");
 
app.set('views', __dirname);
app.set('view engine', 'ejs');

// load the auth variables
var configAuth = require('../authentication/config/auth');

today = { steps : -1, sleep : -1};



app.get('/dashboard', isLoggedIn, function(req, res) {
	
	//console.log('req '+req.user.jawbone.token);
	//console.log('req.isAuthenticated: '+req.isAuthenticated());
	//var obj_str = util.inspect(req);
	//console.log(obj_str);
	
    // set up jawbone api access        
    var options = {
	'client_id' : configAuth.jawboneAuth.clientID,
	'client_secret' : configAuth.jawboneAuth.clientSecret,
	'access_token' : req.user.jawbone.token 
	};
    up = require('jawbone-up')(options);
    
    // get steps today 
	function getSteps(ser) {
	    up.moves.get({}, function(err, body) {
	      //console.log('Body: ' + body);
	      move_me = JSON.parse(body);
		  getSleep(move_me.data.items[0].details.steps, res);
		});
	};
	
    // get last nights sleep quality 
	function getSleep(steps, ser) {
	    up.sleeps.get({}, function(err, body) {
	      //console.log('Body: ' + body);
	      sleep_me = JSON.parse(body);
		  dashboard(steps, sleep_me.data.items[0].details.quality, res);
		});
	};
	
	function dashboard(steps, sleep, ser) {
		today = { steps : steps,
				  sleep : sleep };
		console.log('today: '+ today.steps + ' '+ today.sleep);
		res.render('dashboard', { steps: today.steps, sleep: today.sleep});
		
	};
	
	getSteps();
	
});

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the auth page
	res.redirect('/auth');
};
