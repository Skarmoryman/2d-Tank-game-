/* 
 * What about serving up static content, kind of like apache? 
 * This time, you are required to present a user and password to the login route
 * before you can read any static content.
 */

var port = 10599;
var process = require('process');
// run ftd.js as 

// nodejs ftd.js PORT_NUMBER
var port = parseInt(process.argv[2]); 
var express = require('express');
var cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;

var app = express();
app.use(cookieParser()); // parse cookies before processing other middleware

const sqlite3 = require('sqlite3').verbose();

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var db = new sqlite3.Database('db/database.db', (err) => {
	if (err) {
		console.error(err.message);
	}
	console.log('Connected to the database.');
});

app.use('/',express.static('static_files')); // this directory has files to be returned


// retrieve top 10 users/scores
app.get('/ftd/api/user/scores', function (req, res) {
	let sql = 'SELECT userid, highscore FROM user ORDER BY highscore DESC LIMIT 10;';
	db.all(sql, [], (err, rows) => {
		var result = {};
		result["users"] = [];
  		if (err) {
    			result["error"] = err.message;
  		} else {
			rows.forEach((row) => {
				result["users"].push(row);
			});
		}
		res.json(result);
	});
});

// login
app.get('/ftd/api/user/:username/password/:password/', function(req, res) {
	var username = req.params.username;
	var password = req.params.password;
	console.log("GET:"+username);
	
	let sql = 'SELECT password FROM user WHERE userid=?';
	db.get(sql, [username], (err, row) => {
		var result = {};
		if (row) {
			bcrypt.compare(password, row.password, function(err, valid) {
				var result = {};
				if (valid) {
					res.cookie("id", username+row.password);
					res.status(200);
				} else {
					res.status(400);
					result["error"] = "invalid password";
				}
				res.json(result);
			});
		} else {
			res.status(404);
			if (err) result["error"] = err.message; 
			res.json(result);
		}
	});
});

// create a new user
app.post('/ftd/api/user/:username/password/:password/', function(req, res) {
	var username = req.params.username;
	var password = req.params.password;
	console.log("POST:"+username);
	bcrypt.hash(password, saltRounds, function(err, hash) {
		
		let sql = 'INSERT INTO user(userid, password, highscore) VALUES (?, ?, ?);';
		db.run(sql, [username, hash, 0], function (err){
			var result = {};
			if (err) {
				res.status(409);
				result["error"] = err.message;
			} else {
				res.status(201); // Created
				result[username] = "updated rows: "+this.changes;
			}
		console.log(JSON.stringify(result));
			res.json(result);
		});

	});
});



// update highscore
app.put('/ftd/api/user/:username/score/:score/', function (req, res) {
	var score = req.params.score;
	var user = req.params.username;
	console.log("Updated score for :"+ user);
	if (req.cookies.id) {
		let sql = 'SELECT * FROM user WHERE userid=?';
		db.get(sql, [user], (err, row) => {	
			if (row && req.cookies.id.localeCompare(user+row.password)==0) {
				if(row.highscore < score){
				let sql = 'UPDATE user SET highscore=MAX(highscore,?) WHERE userid =?;';
				db.run(sql, [score, user], function (err){
					var result = {};
					if (err) {
						res.status(404);
						result["error"] = err.message;
					} else {
						if(this.changes!=1){
							result["error"] = "Not updated";
							res.status(404);
						} else {
							res.status(200);
							result[user] = "updated rows: "+this.changes;
							console.log(result[user]);
						}
					}
					res.json(result);
				});
				} else res.status(200).send('score lower than highscore');
			} else res.status(403).send('Not authorized');
		});
	} else res.status(403).send('Not authorized');	
});

// change password
app.put('/ftd/api/user/:username/password/:password/', function (req, res) {
	var pass = req.params.password;
	var user = req.params.username;
	console.log("Updated pass for :"+ user);
	// http://www.sqlitetutorial.net/sqlite-nodejs/update/
	bcrypt.hash(pass, saltRounds, function(err, hash) {
		let sql = 'UPDATE user SET password=? WHERE userid=?;';
		db.run(sql, [hash, user], function (err){
			var result = {};
  			if (err) {
				res.status(404); 
    				result["error"] = err.message;
  			} else {
				if(this.changes!=1){
    					result["error"] = "Not updated";
					res.status(404);
				} else {
					res.status(200);
					result[user] = "updated rows: "+this.changes;
					console.log(result[user]);
				}
			}
			res.json(result);
		});
	});
});


// delete account
app.delete('/ftd/api/user/:username/', function (req, res) {
	var username = req.params.username;
        console.log("DELETE:"+ username);
	if (req.cookies.id) {	
		let sql = 'SELECT * FROM user WHERE userid=?';
		db.get(sql, [username], (err, row) => {	
			if (row && req.cookies.id.localeCompare(username+row.password)==0) {
				let sql = 'DELETE FROM user WHERE userid =?;';
				db.run(sql, [username], function (err){
					var result = {};
					if (err) {
						res.status(404);
						result["error"] = err.message;
					} else {
						res.status(200);
						res.cookie("id", '');
						result[username] = "deleted row";
					}
					res.json(result);
				});
			} else res.status(403).send('Not authorized');
		});
	} else res.status(403).send('Not authorized');
});


app.listen(port, function () {
  console.log('Example app listening on port '+port);
});
