// server.js

// set up ======================================================================
// get all the tools we need

var express = require('express');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var path = require('path');
var https = require('https');
var http = require('http');
var fs = require('fs');
var chalk = require('chalk');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var config = require('./config/config'); // get our config file

// This line is from the Node.js HTTPS documentation.
var options = {
    key: fs.readFileSync(config.key),
    cert: fs.readFileSync(config.cert)
};

// configuration ===============================================================
mongoose.connect(config.database); // connect to database

require('./config/passport')(passport); // pass passport for configuration

app.set('apiSecret', config.apiSecret); // secret variable
app.set('host', config.host);
app.set('username', config.username);
app.set('password', config.password);

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', path.join(__dirname, 'views/pages'));
app.set('view engine', 'ejs'); // set up ejs for templating

app.use(express.static(__dirname + '/public'));

app.use(session({
    secret: config.sessionSecret
})); // session secret

// required for passport
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes/webRoutes.js')(app, passport); // load our routes and pass in our app and fully configured passport
//require('./app/routes/secureRoutes.js')(app, express);
require('./app/routes/testRoutes.js')(app, express);
require('./app/routes/dummyRoutes.js')(app, express);
// launch ======================================================================
//app.listen(port);
//console.log('The magic happens on port ' + port);


http.createServer(app).listen(config.httpPort);
console.log(chalk.green("http server started at port " + config.httpPort));

// Create an HTTPS service identical to the HTTP service.
//https.createServer(options, app).listen(config.httpsPort);
//console.log(chalk.green("https server started at port " + config.httpsPort));


//*********************
/*
 var https = require('https');
 var fs = require('fs');

 var options = {
 key: fs.readFileSync('key.pem'),
 cert: fs.readFileSync('cert.pem')
 };

 var a = https.createServer(options, function (req, res) {
 res.writeHead(200);
 res.end("hello world\n");
 }).listen(8080);
 */

//****************
/*
 var fs = require('fs');
 var http = require('http');
 var https = require('https');
 var privateKey  = fs.readFileSync('key.pem', 'utf8');
 var certificate = fs.readFileSync('cert.pem', 'utf8');

 var credentials = {key: privateKey, cert: certificate};
 var express = require('express');
 var app = express();

 // your express configuration here

 var httpServer = http.createServer(app);
 var httpsServer = https.createServer(credentials, app);

 httpServer.listen(8000);
 httpsServer.listen(8080);
 */
