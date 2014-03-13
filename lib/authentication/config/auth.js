// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

	'facebookAuth' : {
		'clientID' 	: '464700913630345', // your App ID
		'clientSecret' 	: 'be56fd75c8f3a63fa638097c948347f6', // your App Secret
		'callbackURL' 	: 'http://localhost:8080/auth/facebook/callback'
	},
	
	'jawboneAuth' : {
	       'clientID' 	  : 'lFDJEcTXR8A', // your App ID
	       'clientSecret' 	  : '31c6d9c45337da30e678e9c450188df3646cdfb4', // your App Secret
	       'authorizationURL' : 'https://jawbone.com/auth/oauth2/auth',
	       'tokenURL'         : 'https://jawbone.com/auth/oauth2/token',
	       'callbackURL' 	  : 'http://localhost:8080/auth/jawbone/callback'
	},

	'twitterAuth' : {
		'consumerKey' 		: 'your-consumer-key-here',
		'consumerSecret' 	: 'your-client-secret-here',
		'callbackURL' 		: 'http://localhost:8080/auth/twitter/callback'
	},

	'googleAuth' : {
		'clientID' 	: 'your-secret-clientID-here',
		'clientSecret' 	: 'your-client-secret-here',
		'callbackURL' 	: 'http://localhost:8080/auth/google/callback'
	}

};

