// app/routes.js
module.exports = function(app, passport) {

	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		   var util = require("util");
	       //console.log('req.isAuthenticated: '+req.isAuthenticated());
	       //console.log('Index req.user: '+req.user.facebook.name);
	       //console.log('Index up_me: '+up_me.data.xid);
	   	   //var obj_str = util.inspect(req);
	   	   //console.log(obj_str);
		   if (req.isAuthenticated()) {
			   if (req.user.jawbone.name) userName = req.user.jawbone.name;
			   if (req.user.facebook.name) userName = req.user.facebook.name;
			   if (req.user.facebook.email) userEmail = req.user.facebook.email;
			   if (req.user.local.email) userEmail = req.user.local.email;
		   } else {
			   userName = "";
			   userEmail = "";
		   }
		   res.render('index.ejs', {
			  name : userName,
			  email : userEmail // get the user out of session and pass to template
		   });
	});


	// =====================================
	// AUTHENTICATE ========================
	// =====================================
	// show the athuentication options
	app.get('/auth', function(req, res) {
		res.render('auth.ejs', { 
		  user: req.user
		});
	});
	

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});


	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
		

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
	       successRedirect : '/profile', // redirect to the secure profile section
	       failureRedirect : '/signup', // redirect back to the signup page if there is an error
	       failureFlash : true // allow flash messages
	   })
	);

	// =====================================
	// PROFILE SECTION =====================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', function(req, res) {
		var authentic = req.isAuthenticated();
		if (!authentic) {
			console.log('NOT AUTHENTIC');
			res.render('auth.ejs');
		} else {
		    res.render('profile.ejs', {
				  user : req.user // get the user out of session and pass to template
		    });
		}
	});
	
	app.post('/profile', isLoggedIn, function(req, res) {
		res.render('/profile');
	});
	
	// =====================================
	// FACEBOOK ROUTES =====================
	// =====================================
	// route for facebook authentication and login
	app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

	// handle the callback after facebook has authenticated the user
	app.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/profile',
			failureRedirect : '/auth'
		}));
		
	// =====================================
	// JAWBONE ROUTES =====================
	// =====================================
	// route for jawbone authentication and login
	app.get('/auth/jawbone', passport.authenticate('jawbone', { scope : ['basic_read','extended_read','friends_read','move_read','sleep_read','meal_read','mood_write'] }));

	// handle the callback after facebook has authenticated the user
	app.get('/auth/jawbone/callback',
		passport.authenticate('jawbone', {
			successRedirect : '/profile',
			failureRedirect : '/auth'
		}));

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/auth');
	});
	
	
	// =============================================================================
        // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
        // =============================================================================

	// locally --------------------------------
		app.get('/connect-local', function(req, res) {

			// render the page and pass  in any flash data if it exists
			res.render('connect-local.ejs', { message: req.flash('signupMessage') });
		});
		
		// process the login form
		app.post('/connect-local', passport.authenticate('local-signup', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/connect-local', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));




	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

		// handle the callback after facebook has authorized the user
		app.get('/connect/facebook/callback',
			passport.authorize('facebook', {
				successRedirect : '/profile',
				failureRedirect : '/auth'
			}));
			
	// jawbone -------------------------------

		// send to jawbone to do the authentication
		app.get('/connect/jawbone', passport.authorize('jawbone', { scope : ['basic_read','extended_read','friends_read','move_read','sleep_read','meal_read','mood_write'] }));

		// handle the callback after facebook has authorized the user
		app.get('/connect/jawbone/callback',
			passport.authorize('jawbone', {
				successRedirect : '/profile',
				failureRedirect : '/auth'
			}));
	
	
	
	// =============================================================================
        // UNLINK ACCOUNTS =============================================================
        // =============================================================================
        // used to unlink accounts. for social accounts, just remove the token
        // for local account, remove email and password
        // user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err, user) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err, user) {
        res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err, user) {
           res.redirect('/profile');
        });
    });

    // jawbone ---------------------------------
    app.get('/unlink/jawbone', function(req, res) {
        var user          = req.user;
        user.jawbone.token = undefined;
        user.save(function(err, user) {
           res.redirect('/profile');
        });
    });


	// route middleware to make sure a user is logged in
	function isLoggedIn(req, res, next) {

		// if user is authenticated in the session, carry on 
		if (req.isAuthenticated())
			return next();

		// if they aren't redirect them to the auth page
		res.redirect('/auth');
	};
}

