var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('adventureConnections.sqlite');
var nlp = require("nlp_compromise");
var fs = require('fs');

var places = ['Aelley', 'Wildesnow', 'Iceriver', 'Whiteash', 'Violetwitch', 'Linport', 'Lightmaple', 'Redwheat', 'Wintercourt', 'Clearmoor', 'Strongshore', 'Griffinview', 'Greyview', 'Ashbridge', 'Silverwitch', 'Byway', 'Pinefort', 'Landhall', 'Ericliff', 'Woodlake', 'Wintercliff', 'Beachlea', 'Freyhill', 'Beechley', 'Snowrock', 'Faywynne', 'Snowden', 'Summerston', 'Swynham', 'Faycrest', 'Brightbell', 'Brookdale', 'Rayacre', 'Coldmont', 'Roseden', 'Bluelea', 'Esterflower', 'Mortown', 'Elfton', 'Greybay', 'Baymeadow', 'Delledge', 'Silveredge', 'Waymill', 'Violethall', 'Northmage', 'Crystalmist', 'Meadowmoor', 'Bayston', 'Butterbourne', 'Oldloch', 'Spellmarsh', 'Greyhollow', 'Crystalwyn', 'Waterhollow', 'Lincliff', 'Blackbridge', 'Faysnow', 'Dorden'];

var creatures = [];

var puncs = [".","?",",","!"];

var monsterdata = fs.readFileSync('./monsters.js'),
    myObj;

try {
  creatures = JSON.parse(monsterdata);
}
catch (err) {
  console.log('There has been an error parsing your JSON.')
  console.log(err);
}

db.serialize(function(){
	db.run("DROP TABLE setups;");
	db.run("DROP TABLE descriptions;")
	db.run("CREATE TABLE setups (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, used INTEGER)");
	db.run("CREATE TABLE descriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, used INTEGER)");

	db.each("SELECT id, connection FROM connections ORDER BY RANDOM();", [], function(err, row){
			if (err)
				console.log(err);
			//console.dir(row);

		parseConnection(row.connection,function(err, setups, descriptions){
			if (err)
				console.log(err);

			db.serialize(function(){
				var setup_stmt = db.prepare("INSERT INTO setups (content, used) VALUES (?,0);");
				for (var i = setups.length - 1; i >= 0; i--) {
					setup_stmt.run(setups[i]);
				};
				setup_stmt.finalize();

				var description_stmt = db.prepare("INSERT INTO descriptions (content, used) VALUES (?,0);");
				for (var i = descriptions.length - 1; i >= 0; i--) {
					description_stmt.run(descriptions[i]);
				};
				description_stmt.finalize();

				var parsed_stmt = db.prepare("UPDATE connections SET parsed=1 WHERE id=?");
				parsed_stmt.run(row.id);
				parsed_stmt.finalize();
			});
		});
	}, function(err, num_rows){
		console.log("All done, worked through " + num_rows + " connections!");
	});
});


function parseConnection(text, callback)
{
	var setups = [];
	var descriptions = [];

	text = text.trim();
	text = text.replace(/so i know it\'s you/gi,"");
	text = text.replace(/(I)\'ve/gi,"$1 has");
	text = text.replace(/(you)\'ve/gi,"$1 have");
	text = text.replace(/(I)\'m/gi,"$1 is");
	//text = text.replace(/(I)\'d/gi,"$1");
	//text = text.replace(/(You)\'d/gi,"$1");
	text = text.replace(/(you)\'re/gi,"$1 are");
	text = text.replace(/[Iu]\'ll/ig, " will");
	text = text.replace(/(couldn\'t)/gi,"can't");
	text = text.replace(/(could)/gi,"can");
	text = text.replace(/(you wouldn\'t)/gi,"you don't");
	text = text.replace(/(wouldn\'t)/gi,"doesn't");
	text = text.replace(/(wasn\'t)/gi,"isn't");
	text = text.replace(/I have/g,"I has");

	var parsed = nlp.pos(text);

	for (var senti = parsed.sentences.length - 1; senti >= 0; senti--) {
		var sentence = parsed.sentences[senti];

		if (sentence.tokens.length<3)
			continue;

		if (sentence.verbs().length==0)
			continue;

		var sentenceText = sentence.text();

		if (sentenceText.length>110)
			continue;

		if (sentenceText.charAt(sentenceText.length -1)=='?')
			continue;

		if (/missed connections/gi.test(sentenceText)
			||
			/so i know it[\']*s you/gi.test(sentenceText)
			||
			/reply/gi.test(sentenceText)
			||
			/respond/gi.test(sentenceText)
			||
			/pussy/gi.test(sentenceText)
			||
			/fuck/gi.test(sentenceText)
			||
			/shit/gi.test(sentenceText)
			||
			/slut/gi.test(sentenceText)
			||
			/bitch/gi.test(sentenceText)
			||
			/nigger/gi.test(sentenceText)
			||
			/spic/gi.test(sentenceText)
			||
			/fag/gi.test(sentenceText)
			||
			/jack(ing|ed) off/gi.test(sentenceText)
			||
			/January/gi.test(sentenceText)
			||
			/February/gi.test(sentenceText)
			||
			/March/g.test(sentenceText)
			||
			/April/gi.test(sentenceText)
			||
			/May/g.test(sentenceText)
			||
			/June/gi.test(sentenceText)
			||
			/July/gi.test(sentenceText)
			||
			/August/gi.test(sentenceText)
			||
			/September/gi.test(sentenceText)
			||
			/October/gi.test(sentenceText)
			||
			/November/gi.test(sentenceText)
			||
			/December/gi.test(sentenceText)
			||
			/yesterday/gi.test(sentenceText)
			||
			/last week/gi.test(sentenceText)
			||
			/sunday/gi.test(sentenceText)
			||
			/monday/gi.test(sentenceText)
			||
			/tuesday/gi.test(sentenceText)
			||
			/wednesday/gi.test(sentenceText)
			||
			/thursday/gi.test(sentenceText)
			||
			/friday/gi.test(sentenceText)
			||
			/saturday/gi.test(sentenceText)
			||
			/if this is you/gi.test(sentenceText)
			)
			continue;

		if (sentenceText.indexOf("?")==sentenceText.length-1) {
			if (sentenceText.indexOf("homepage")>-1)
				continue;
		}

		sentenceText = sentenceText.replace(/^if only/gi,"");
		sentenceText = sentenceText.replace(/^besides,/gi,"");
		sentenceText = sentenceText.replace(/^Still,/gi,"");
		sentenceText = sentenceText.replace(/^Would/gi,"I would");
		sentenceText = sentenceText.replace(/^Didn't/gi,"I doesn't");
		sentenceText = sentenceText.replace(/^Don't/gi,"I doesn't");
		sentenceText = sentenceText.replace(/^Saw/gi,"I sees");
		sentenceText = sentenceText.replace(/^But /gi,"");
		sentenceText = sentenceText.replace(/^And /gi,"");
		sentenceText = sentenceText.replace(/i didn't/gi,"I doesn't");
		sentenceText = sentenceText.replace(/i don't/gi,"I doesn't");
		sentenceText = sentenceText.replace(/i wasn't/gi,"I isn't");
		sentenceText = sentenceText.replace(/it didn't/gi,"it doesn't");
		sentenceText = sentenceText.replace(/seattle/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/boston/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/philadelphia/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/philly/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/chicago/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/oakland/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/portland/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/los angeles/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/new york/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/new york city/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/NYC/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/miami/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/houston/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/austin/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/raleigh/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/washington/gi,places[Math.floor(Math.random()*places.length)]);
		sentenceText = sentenceText.replace(/frisco/gi,places[Math.floor(Math.random()*places.length)]);

		if (/^It was/i.test(sentenceText)) {
			setups.push(prettify(nlp.pos(sentenceText).sentences[0].to_present().text()));
			//setups.push(prettify(sentence.to_present().text()));
			continue;
		}


/*		if (/you were wearing/i.test(sentenceText)) 
		{
			good_sentences.wearing.push(sentence.to_present().text());

			continue;
		}

		if ((/^I[.,-\/#!$%\^&\*;:{}=\-_`~()\s]+/i.test(sentenceText) || /\s+I[.,-\/#!$%\^&\*;:{}=\-_`~()\s]+/i.test(sentenceText)) && /\syou/.test(sentenceText)) 
		{*/
			var tenseVerbs = ["VBD"];

			var mangled = sentenceText.trim();

			var dontChangeTenseAfter = ["have"];
			var dontChangeTense = ["been"];
			var last_token = "";
			var second_to_last_token = "";
			var last_verb_you = false;

			for (var tokeni = 0; tokeni < sentence.tokens.length; tokeni++) {
				token = sentence.tokens[tokeni];
				//console.dir(token);
				if (token.pos.tag=="VBD" || token.pos.tag=="CP" || (token.pos.tag=="VB" && token.text.slice(token.text.length - 2)=="ed"))
				{
					if (dontChangeTenseAfter.indexOf(last_token)==-1 
						&& dontChangeTense.indexOf(token.text)==-1)
					{
						//console.dir(token.analysis);
						var vbtext = token.text;
						if (vbtext.charAt(vbtext.length-1)==",")
							vbtext = vbtext.slice(0,vbtext.length-1);
						var vbpres = nlp.verb(vbtext).to_present();
						var vbinf  = nlp.verb(vbtext).conjugate().infinitive;

						if (((last_token=="you" || last_token=="we") || (last_verb_you && last_token=="and")) && token.pos.tag!="CP")
						{
							mangled = mangled.replace(vbtext,vbinf);
							last_verb_you = true;
						}
						else
						{
							last_verb_you = false;
							mangled = mangled.replace(vbtext,vbpres);
						}

						//console.log("FOUND PAST VERB: " + vbtext + " => " + vbpres);
					}
					else
					{
						if (second_to_last_token.toLowerCase()=="could" && last_token.toLowerCase()=="have")
						{
							mangled = mangled.replace("could have " + token.text, "can " + nlp.verb(token.text).conjugate().infinitive);
						}
					}
				}
				else if (token.pos.tag=="VB") // generic verb (i.e. can't recognize tense)
				{
						if (second_to_last_token.toLowerCase()=="could" && last_token.toLowerCase()=="have")
						{
							mangled = mangled.replace("could have " + token.text, "can " + nlp.verb(token.text).conjugate().infinitive);
						}
						if (token.text.toLowerCase()=="left")
						{
							mangled = mangled.replace(token.text, "leave");
						}
					//console.log("Other verb: " + token.text + " " + token.text.slice(token.text.length - 2));
					// manually nonsense:
					//if (token.text=="left") left scared melted chatted
					//console.log("Other verb: " + token.pos.name + " -> " + token.text + " = " + token.pos.tense);
				}
				else if (token.pos.tag=="VBN")
				{
					if (last_token=="you" || second_to_last_token=="you")
					{
						mangled = mangled.replace(token.text, nlp.verb(token.text).conjugate().infinitive);						
					}
					else if (last_token=="i" || second_to_last_token=="i")
					{
						mangled = mangled.replace(token.text, nlp.verb(token.text).to_present());												
					}
				}
				else if (token.pos.tag=="VBP")
				{
					if (last_token=="i" || second_to_last_token=="i")
					{
						mangled = mangled.replace(token.text, nlp.verb(token.text).to_present());												
					}	
				}

				second_to_last_token = last_token;
				last_token = token.text.toLowerCase();
			};
			//var matches = str.match(/\s(I)[.,-\/#!$%\^&\*;:{}=\-_`~()\s]+/g);

			var replacedFirstI = false;

			if (/^i[.,-\/#!$%\^&\*;:{}=\-_`~()\s\']+/i.test(mangled))
			{
				mangled = mangled.replace(/^(i)([.,-\/#!$%\^&\*;:{}=\-_`~()\s\']+)/i, randomCreature() + "$2");
				replacedFirstI = true;
			}
			else if (/([\.\'\"\s]+)(I)([.,-\/#!$%\^&\*;:{}=\-_`~()\s\']+)/i.test(mangled))
			{
				mangled = mangled.replace(/([\.\'\"\s]+)(I)([.,-\/#!$%\^&\*;:{}=\-_`~()\s\']+)/i, "$1" + randomCreature() + "$3");
				replacedFirstI = true;
			}

			if (/^we[\s]+/i.test(mangled))
			{
				mangled = mangled.replace(/^we/i, "You and " + (replacedFirstI==true ? "it" : randomCreature()));
				replacedFirstI = true;
			}
			else if (/([\.\'\"\s]+)(we)([.,-\/#!$%\^&\*;:{}=\-_`~()\s\']+)/i.test(mangled))
			{
				mangled = mangled.replace(/([\.\'\"\s]+)(we)([.,-\/#!$%\^&\*;:{}=\-_`~()\s\']+)/i, "$1you and " + (replacedFirstI==true ? "it" : randomCreature()) + "$3");
				replacedFirstI = true;
			}


			if (/^(me)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/i.test(mangled))
			{
				mangled = mangled.replace(/^(me)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/i, (replacedFirstI==true ? "it" : randomCreature()) + "$2");
				replacedFirstI = true;
			}
			else if (/([\.\'\"\s]+)(me)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/i.test(mangled))
			{
				mangled = mangled.replace(/([\.\'\"\s]+)(me)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/i, "$1" + (replacedFirstI==true ? "it" : randomCreature()) + "$3");
				replacedFirstI = true;
			}

			if (/^(my)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/i.test(mangled))
			{
				mangled = mangled.replace(/^(my)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/i, (replacedFirstI==true ? "its" : (randomCreature() + "'s") ) + "$2");
				replacedFirstI = true;
			}
			else if (/([\.\'\"\s]+)(my)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/i.test(mangled))
			{
				mangled = mangled.replace(/([\.\'\"\s]+)(my)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/i, "$1" + (replacedFirstI==true ? "its" : (randomCreature() + "'s")) + "$3");
				replacedFirstI = true;
			}

			mangled = mangled.replace(/([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)(our)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/ig,"$1your$3");

			mangled = mangled.replace(/([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)(my)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/ig,"$1its$3");

			mangled = mangled.replace(/myself/ig, "itself");

			mangled = mangled.replace(/([\.\'\"\s]+)(I)([.,-\/#!$%\^&\*;:{}=\-_`~()\s\']+)/ig, "$1it$3");

			mangled = mangled.replace(/([\.\'\"\s]+)(me)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/ig, "$1it$3");

			mangled = mangled.replace(/([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)(am)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/ig,"$1is$3");

			mangled = mangled.replace(/([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)(my)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/ig,"$1its$3");
			//mangled = mangled.replace(/(I)/g, "it");

			if (mangled.length>120)
				continue;

			if (mangled.indexOf("'m am")>0)
				continue;
	
			mangled = mangled.replace(/(\'[dt])+s/ig,"$1");

			if (mangled.slice(mangled.length-2)==".s") 
				mangled = mangled.slice(0,mangled.length-1);

//			parsedMangled = nlp.pos(mangled);
			
			mangled = prettify(mangled);

			if (/^You[\s,]/.test(mangled))
			{
				setups.push(mangled);
			}
			else if (replacedFirstI==true)
			{
				descriptions.push(mangled);
			}

	};

	if (callback)
		callback(null, setups, descriptions);
}

function randomCreature()
{
	//return creatures[Math.floor(Math.random()*creatures.length)];

	return "{INSERT_CREATURE}";
}

function prettify(text)
{
	text = text.replace("  "," ");
	text = text.charAt(0).toUpperCase() + text.slice(1);
	if (puncs.indexOf(text.charAt(text.length-1))==-1)
	{
		text = text + ".";
	}

	return text;
}