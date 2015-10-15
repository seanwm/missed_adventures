// Our Twitter library
var Twit = require('twit');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('adventureConnections.sqlite');
var fs = require('fs');

/*
* Some commented-out code in "Post Tweet" appends a random set of directions/commands to tweets
var directions = ["N","S","E","W","U", "D", "DROP", "REST", "STAND", "LOOK","GET","THROW","FLEE"];
*/

// http://gryphonking.aelfhame.net/iview.php3?folder=art/games&name=senmurv

var puncs = [".","?",",","!"];
var temp_setup = "";
var temp_description = "";

var creatures = [];

var monsterdata = fs.readFileSync('./monsters.js'),
    myObj;

try {
  creatures = JSON.parse(monsterdata);
}
catch (err) {
  console.log('There has been an error parsing your JSON.')
  console.log(err);
}


/*
* RE-Zero the "used" columns
*
db.serialize(function(){
	db.run("UPDATE setups SET used=0;");
	db.run("UPDATE descriptions SET used=0;");
});*/

getTweet();

setInterval(getTweet, 1000 * 60 * 60 * 3);

function getTweet()
{
	db.get("SELECT * FROM setups WHERE used=0 ORDER BY RANDOM() LIMIT 1;", [], function(err, setup_row){
		temp_setup = setup_row.content;

		if (puncs.indexOf(temp_setup.charAt(temp_setup.length-1))==-1)
		{
			temp_setup = temp_setup + ".";
		}

		db.get("SELECT * FROM descriptions WHERE used=0 ORDER BY RANDOM() LIMIT 1;", [], function(err, description_row){
			temp_description = description_row.content;
			if (puncs.indexOf(temp_description.charAt(temp_description.length-1))==-1)
			{
				temp_description = temp_description + ".";
			}

			buildTweet(setup_row.id,description_row.id);
		});

	});	
}

function capitalize(text)
{
	text = text.charAt(0).toUpperCase() + text.slice(1);

	if (text.charAt(0)=="[")
		text = "[" + text.charAt(1).toUpperCase() + text.slice(2);

	return text;
}

function buildTweet(setupid,descriptionid)
{
	temp_setup = temp_setup.replace("{INSERT_CREATURE}",function(){return randomCreature();});
	temp_description = temp_description.replace("{INSERT_CREATURE}",function(){return randomCreature();});

	temp_setup = capitalize(temp_setup);
	temp_description = capitalize(temp_description);

	var tweet =  temp_setup + "\n" + temp_description;

	if (tweet.indexOf("Senmurv")>-1)
		tweet.replace("Senmurv", "Senmurv (http://gryphonking.aelfhame.net/iview.php3?folder=art/games&name=senmurv)");

	if (temp_setup.length==0 || temp_description.length==0 || tweet.length>140)
	{
		getTweet();
	}
	else
	{
		db.serialize(function(){
				var setup_stmt = db.prepare("UPDATE setups SET used=1 WHERE id=?;");
				setup_stmt.run(setupid);
				setup_stmt.finalize();

				var desc_stmt = db.prepare("UPDATE descriptions SET used=1 WHERE id=?;");
				desc_stmt.run(descriptionid);
				desc_stmt.finalize();
		});
		/*if (tweet.length<133 && Math.floor(Math.random()*10)>1)
		{
			var tweet_dirs = getRandomDirections();
			while (tweet_dirs.length > (140-tweet.length))
			{
				tweet_dirs = getRandomDirections();
			}

			tweet = tweet + "\n" + tweet_dirs
		}*/

		console.log(tweet.length + ": \n" + tweet);

		postTweet(tweet);
	}
}


function postTweet(tweet)
{
	var T = new Twit(require('./config.js'));

	T.post('statuses/update', { status: tweet }, function(err, data, response) {
		console.log(data)

		if (err) {
			console.log('There was an error with Twitter:', error);
		}
	});

}

function randomCreature()
{
	creature = creatures[Math.floor(Math.random()*creatures.length)];

	creature = creature.slice(0,creature.indexOf(" ")+1) + "[" + creature.slice(creature.indexOf(" ")+1) + "]";

	return creature;
}


function getRandomDirections()
{
	var count = 0;

	while (count<2)
	{
		count = Math.floor(Math.random()*6);
	}

	var dirs = {};
	while (Object.keys(dirs).length < count)
	{
		dirs[directions[Math.floor(Math.random()*directions.length)]] = true;
	}

	return "[" + Object.keys(dirs).join(", ") + "]";
}