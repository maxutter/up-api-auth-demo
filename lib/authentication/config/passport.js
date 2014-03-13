/// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var JawboneStrategy = require('passport-oauth').OAuth2Strategy;

// load up the user model
var User       		= require('../models/user');

// up profile
global.up_me = {
                data : { xid:'12345'}
            };
            
// load the auth variables
var configAuth = require('./auth');


// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
    
        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(null, false, console.log('There was an error in User.findOne on signup'));

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {

				// if there is no user with that email
                // create the user
                var newUser = new User();

                // set the user's local credentials
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);

				// save the user
				newUser.save(function (err, user) {
				  if (err) return console.error(err);
				  return done(null, newUser, console.log('Welcome '+newUser.local.email+', to funmotivation.com!'));
				});

            }

        });    

        });

    }));




    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
        
        global.userEmail = email.substring(0,email.indexOf('@'));

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

			// if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));
    
    
    
    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },

    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

        	// check if the user is already logged in
        	if (!req.user) {

	            // find the user in the database based on their facebook id
	            User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

	                // if there is an error, stop everything and return that
	                // ie an error connecting to the database
	                if (err)
	                    return done(err);

	                // if the user is found, then log them in
	                if (user) {
	                    global.userName = user.facebook.name;

	                	// if there is a user id already but no token (user was linked at one point and then removed)
	                	// just add our token and profile information
	                    if (!user.facebook.token) {
	                        user.facebook.token = token;
	                        user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
	                        user.facebook.email = profile.emails[0].value;
							
							if (user.local.email <= ' ') user.local.email = user.facebook.email;

	                        user.save(function(err, user) {
	                            if (err)
	                                throw err;
	                            return done(null, user);
	                        });
	                    }

	                    return done(null, user); // user found, return that user
	                } else {
	                    // if there is no user found with that facebook id, create them
	                    var newUser            = new User();

	                    // set all of the facebook information in our user model
	                    newUser.facebook.id    = profile.id; // set the users facebook id                   
	                    newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
	                    newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
	                    newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                            global.userName = newUser.facebook.name;
							
						// establish local account when signed in first with facebook
						newUser.local.email = user.facebook.email;	
                            
	                    // save our user to the database
						newUser.save(function (err, user) {
						  if (err) return console.error(err);
						  return done(null, newUser, console.log('Welcome '+newUser.local.email+', from fb to funmotivation.com!'));
						});

	                        // if successful, return the new user
	                        return done(null, newUser);
	                }

	            });

	        } else {
				// user already exists and is logged in, we have to link accounts
	            var user            = req.user; // pull the user out of the session

				// update the current users facebook credentials
	            user.facebook.id    = profile.id;
	            user.facebook.token = token;
	            user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
	            user.facebook.email = profile.emails[0].value;
                    global.userName = user.facebook.name;
                    
				
				if (user.local.email <= ' ') user.local.email = user.facebook.email;
				
				// save the user
				user.save(function (err, user) {
				  if (err) return console.error(err);
				  return done(null, user);
				});
	        }

        });

    }));
    
    
    // =========================================================================
    // JAWBONE ================================================================
    // =========================================================================
    passport.use('jawbone', new JawboneStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.jawboneAuth.clientID,
        clientSecret    : configAuth.jawboneAuth.clientSecret,
        callbackURL     : configAuth.jawboneAuth.callbackURL,
        authorizationURL: configAuth.jawboneAuth.authorizationURL,
        tokenURL        : configAuth.jawboneAuth.tokenURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
            

    // jawbone will send back the token and profile
    function(req, token, refreshToken, profile, done) {


        // asynchronous
        process.nextTick(function() {


        // set up jawbone api access        
        var options = {
		'client_id' : configAuth.jawboneAuth.clientID,
		'client_secret' : configAuth.jawboneAuth.clientSecret,
		'access_token' : token}
        up = require('jawbone-up')(options);
        
        // get jawbone profile info
        up.me.get({}, function(err, body) {
          console.log('Body: ' + body);
          up_me = JSON.parse(body);
          global.userName = up_me.data.first + ' ' + up_me.data.last;
    

        	// check if the user is already logged in
        	if (!req.user) {
	            // find the user in the database based on their jawbone id
	            

	            User.findOne({ 'jawbone.id' : up_me.data.xid }, function(err, user) {
	                
	            //console.log('jawbone user found');

	                // if there is an error, stop everything and return that
	                // ie an error connecting to the database
	                if (err)
	                    return done(err);

	                // if the user is found, then log them in
	                if (user) {

	                	// if there is a user id already but no token (user was linked at one point and then removed)
	                	// just add our token and profile information
	                    if (!user.jawbone.token) {
	                        user.jawbone.token = token;
	                        user.jawbone.name  = up_me.data.first + ' ' + up_me.data.last;
							
							user.save(function (err, user) {
							  if (err) return console.error(err);
							  return done(null, user);
							});
	                    }

	                    return done(null, user); // user found, return that user
	                } else {
	                    
	                    //console.log('jawbone user not found');
	                    
	                    // if there is no user found with that jawbone id, create them
	                    var newUser            = new User();

	                    // set all of the jawbone information in our user model
	                    newUser.jawbone.id    = up_me.data.xid; // set the users jawbone id                   
	                    newUser.jawbone.token = token; // we will save the token that jawbone provides to the user                    
	                    newUser.jawbone.name  = up_me.data.first + ' ' + up_me.data.last; // look at the passport user profile to see how names are returned

	                    // save our user to the database
						newUser.save(function (err, user) {
						  if (err) return console.error(err);
						  return done(null, newUser, console.log('Welcome '+newUser.local.email+', from UP to funmotivation.com!'));
						});

	                        // if successful, return the new user
	                        return done(null, newUser);
	                }

	            });

	        } else {
				// user already exists and is logged in, we have to link accounts
	            var user            = req.user; // pull the user out of the session

				// update the current users jawbone credentials
	            user.jawbone.id    = up_me.data.xid;
	            user.jawbone.token = token;
	            user.jawbone.name  = up_me.data.first + ' ' + up_me.data.last;

				// save the user
				user.save(function (err, user) {
				  if (err) return console.error(err);
				  return done(null, user, console.log('Welcome '+user.local.email+', from UP to funmotivation.com!'));
				});;
	        }
            });
        });

    }));
    
   
};

