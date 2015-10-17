var https = require("https");
var fs = require('fs');
var cheerio = require("cheerio");
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('adventureConnections.sqlite');

var cities = ["seattle","boston","philadelphia","portland","losangeles","newyork","sfbay","chicago","miami","houston","austin","raleigh","washingtondc","altoona"];
var cityIndex = 0;
var keyedConnections = {};

/*db.serialize(function() {
  db.run("CREATE TABLE connections (id INTEGER PRIMARY KEY, connection TEXT, parsed INTEGER)");
  db.run("CREATE TABLE setups (content TEXT, used INTEGER DEFAULT 0, connectionID INTEGER, sentenceNumber INTEGER, PRIMARY KEY (connectionID, sentenceNumber))");
  db.run("CREATE TABLE descriptions (content TEXT, used INTEGER DEFAULT 0, connectionID INTEGER, sentenceNumber INTEGER, PRIMARY KEY (connectionID, sentenceNumber))");
  db.run("CREATE TABLE creatures (id INTEGER PRIMARY KEY AUTOINCREMENT, creature TEXT, used INTEGER)");
  db.run("CREATE TABLE towns (id INTEGER PRIMARY KEY AUTOINCREMENT, town TEXT, used INTEGER)");
});*/

function loadKeyedConnections()
{
	var data = fs.readFileSync('./keyed_connections.js'),
    myObj;
	try {
  		keyedConnections = JSON.parse(data);
  		//console.dir(connections);
  		console.log("Have " + Object.keys(keyedConnections).length + " connections.");
	}
	catch (err) {
	  console.log('There has been an error parsing your JSON.')
	  console.log(err);
	}
}

//var connections = [];

//loadKeyedConnections();

getCLPostings(cities[cityIndex]);

function getCLPostings(myCity){
	var craigslist = require('node-craigslist'),
		client = craigslist({
	    	city : myCity
	  	}),
	  	options = {
	  		category : 'mis',
	  		maxAsk : '200',
	  		minAsk : '10'
	  	};
	
	client.search(options, 'you were m4w', function (err, listings) {
	  // filtered listings (by price)
	  if (err)
	  	console.log(err);
	
	  var i = listings.length;
	  console.log("Got "+i+" listings");
	
		downloadAndParse(listings);
	});
}


function downloadAndParse(urls)
{
	url = urls.pop().url;

	while (/*url.indexOf("org//")==-1 ||*/ url.indexOf(".ca/")>-1)
	{
		if (urls.length>0)
			url = urls.pop().url;
		else
			saveConnections();
	}

	if (url.indexOf("org//")>-1)
		url = "https://" + url.slice(url.indexOf("org//")+5);

	console.log("Url: "+url);

	var url_slug = url.substr(url.lastIndexOf('/') + 1);
	var connectionID = url_slug.slice(0,url_slug.indexOf('.')-1);

	db.get("SELECT id, connection FROM connections WHERE id=?;", [connectionID], function(err, row){
		if (typeof row === 'undefined' || row == null)
		{
			download(url, function(data){
				//console.log("Got data: "+data);
				if (data) {
					var $ = cheerio.load(data);
					var post_content = $("#postingbody").text();
					//console.log("++++++++++++++++++++++++++++++++++++++++");
					//console.log(post_content);

					if (post_content.indexOf("There is nothing here") > 0 && post_content.indexOf("No web page for this address")>0)
					{
						console.log("Skipping 404");
						if (urls.length>0)
						{
							sleep(2000);
							downloadAndParse(urls);
						}
						else
							saveConnections();

						return;
					}

					parseConnection(post_content, url, function(){
						if (urls.length>0)
							downloadAndParse(urls);
						else
							saveConnections();
					});
				}
			});
		}
		else
		{
			console.log("Skipping " + connectionID);
			if (urls.length>0)
				downloadAndParse(urls);
			else
				saveConnections();
		}
  	});

}

function parseConnection(text, url, callback)
{
	var url_slug = url.substr(url.lastIndexOf('/') + 1);

	console.log("Saving text for slug: " + url_slug);

	db.serialize(function() {
		var connectionID = url_slug.slice(0,url_slug.indexOf('.')-1);
		var stmt = db.prepare("INSERT OR REPLACE INTO connections (id,connection,parsed) VALUES (?,?,(select parsed from connections where id = ?))");
		stmt.run(connectionID,text,connectionID);
		stmt.finalize();
	});

	//keyedConnections[url_slug] = text;

	sleep(2000);

	if (callback)
		callback();
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function download(url, callback) {
  https.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
}

function saveConnections()
{
	var fs = require('fs');
	var data = JSON.stringify(keyedConnections);

	fs.writeFile('./keyed_connections.js', data, function (err) {
		if (err) {
			console.log('There has been an error saving your configuration data.');
			console.log(err.message);
			return;
		}
		console.log('Configuration saved successfully.')

		cityIndex++;
		if (cityIndex<cities.length)
			getCLPostings(cities[cityIndex]);
		else
			console.log("All done!");
	});
}