// installed modules ==================================
var express 	= require('express');
var app 		= express();
var MongoStore 	= require('connect-mongo')(express);
var port    	= process.env.PORT || 3000;
var mongoose 	= require('mongoose');
var passport 	= require('passport');
var flash 	 	= require('connect-flash');
var configDB 	= require('authentication/config/database.js');

mongoose.connect('mongodb://localhost/jawboneUPdemo'); // connect to our database
mongoose.set('debug', true);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log('db connection open ');
});



	 



require('authentication/config/passport')(passport); // pass passport for configuration

// application developed modules ==================================
var nodepath 	= process.env.NODE_PATH || 'lib';
var dashboard 	= require('dashboard');


// configuration  =================================================
app.configure(function() {

	// set up our express application
	app.use(express.logger('dev')); // log every request to the console
	app.use(express.cookieParser()); // read cookies (needed for auth)
	app.use(express.bodyParser()); // get information from html forms
	app.use(express.static(__dirname + '/public'));

	app.set('view engine', 'ejs'); // set up ejs for templating
	app.set('views', __dirname + '/lib/views');

	// required for passport
	app.use(express.session({
		store: new MongoStore({
		url: 'mongodb://localhost/jawboneUPdemo'
		}),
		secret: 'ilovesuppywuppyup' 
	})); // session secret
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session
});


// routes  ========================================================
require('authentication/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
app.use(dashboard);



app.listen(port);
console.log('UP is alive on port ' + port);


