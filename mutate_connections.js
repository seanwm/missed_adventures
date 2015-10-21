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
	//db.run("DROP TABLE setups;");
	//db.run("DROP TABLE descriptions;")
	//db.run("CREATE TABLE setups (content TEXT, used INTEGER DEFAULT 0, connectionID INTEGER, sentenceNumber INTEGER, PRIMARY KEY (connectionID, sentenceNumber))");
	//db.run("CREATE TABLE descriptions (content TEXT, used INTEGER DEFAULT 0, connectionID INTEGER, sentenceNumber INTEGER, PRIMARY KEY (connectionID, sentenceNumber))");

	db.run("DELETE FROM setups WHERE used=0 OR used IS NULL;");
	db.run("DELETE FROM descriptions WHERE used=0 OR used IS NULL;");

	db.each("SELECT id, connection FROM connections WHERE parsed=1 OR parsed=0 OR parsed IS NULL ORDER BY RANDOM();", [], function(err, row){
		if (err)
			console.log(err);
		//console.dir(row);

		parseConnection(row.connection,row.id,function(err, setups, descriptions){

			if (err)
				console.log(err);

			db.serialize(function(){
				var setup_stmt = db.prepare("INSERT OR REPLACE INTO setups (content, used, connectionID, sentenceNumber) VALUES (?,(select used from setups where connectionID = ? and sentenceNumber = ?),?,?);");
				for (var i = setups.length - 1; i >= 0; i--) {
					setup_stmt.run(setups[i].content, setups[i].connectionID, setups[i].sentenceNumber, setups[i].connectionID, setups[i].sentenceNumber);
				};
				setup_stmt.finalize();

				var description_stmt = db.prepare("INSERT OR REPLACE INTO descriptions (content, used, connectionID, sentenceNumber) VALUES (?,(select used from descriptions where connectionID = ? and sentenceNumber = ?),?,?);");
				for (var i = descriptions.length - 1; i >= 0; i--) {
					description_stmt.run(descriptions[i].content, descriptions[i].connectionID, descriptions[i].sentenceNumber, descriptions[i].connectionID, descriptions[i].sentenceNumber);
				};
				description_stmt.finalize();

				var parsed_stmt = db.prepare("UPDATE connections SET parsed=1 WHERE id=?");
				parsed_stmt.run(row.id);
				parsed_stmt.finalize();
			});
		});
	}, function(err, num_rows){
		db.run("UPDATE setups SET used=0 WHERE used IS NULL");
		db.run("UPDATE descriptions SET used=0 WHERE used IS NULL");
		console.log("All done, worked through " + num_rows + " connections!");
	});
});

function insertSetup(content, connectionID, sentenceNumber)
{
	var setup_stmt = db.prepare("INSERT INTO setups (content, used, connectionID, sentenceNumber) VALUES (?,0,?,?);");

		setup_stmt.run(content,connectionID,sentenceNumber);

	setup_stmt.finalize();
}
function insertDescription(content, connectionID, sentenceNumber)
{
	var description_stmt = db.prepare("INSERT INTO descriptions (content, used, connectionID, sentenceNumber) VALUES (?,0,?,?);");

		description_stmt.run(content,connectionID,sentenceNumber);

	description_stmt.finalize();
}

/*parseConnection("I backed in 2 spots away from and parked.",
	function(err, setups, descriptions){
		console.dir(setups);
		console.dir(descriptions);
	}
);*/


function parseConnection(text, connectionID, callback)
{
	var setups = [];
	var descriptions = [];

	text = text.trim();
	text = text.replace(/so i know it\'s you/gi," ");
	text = text.replace(/(I)\'ve/gi,"$1 has");
	text = text.replace(/(you)\'ve/gi,"$1 have");
	text = text.replace(/(I)\'m/gi,"$1 is");
	//text = text.replace(/(I)\'d/gi,"$1");
	//text = text.replace(/(You)\'d/gi,"$1");
	text = text.replace(/(you)\'re/gi,"$1 are");
	text = text.replace(/[Iu]\'ll/ig, " will");
	//text = text.replace(/(couldn\'t)/gi,"can't");
	//text = text.replace(/(could)/gi,"can");
	//text = text.replace(/(you wouldn\'t)/gi,"you don't");
	text = text.replace(/(wouldn\'t)/gi,"doesn't");
	text = text.replace(/(wasn\'t)/gi,"isn't");
	text = text.replace(/I have/g,"I has");
	text = text.replace(/((Monday|Tuesday|Wednesday|Thursday|Friday|today|tonight|yesterday)[\.\,\?\!])/g," ");
	var parsed = nlp.pos(text);

	for (var senti = parsed.sentences.length - 1; senti >= 0; senti--) {
		var sentence = parsed.sentences[senti];

		if (sentence.tokens.length<3)
			continue;

		if (sentence.verbs().length==0)
			continue;

		var sentenceText = sentence.text().trim();

		if (sentenceText.length>110)
			continue;

		if (sentenceText.charAt(sentenceText.length -1)=='?')
			continue;

		sentenceText = sentenceText.replace(/^["'* \.-]*(Yesterday|Last night|Today|Tonight|Monday|tuesday|wednesday|thursday|Friday|Saturday|Sunday|this afternoon|this morning|this evening)+[\s](night|evening|afternoon|morning)*/," ");
		sentenceText = sentenceText.replace(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|April|June|July|August|September|October|November|December|(at )*about|around|night|(this )*morning|(this )*evening|(this )*afternoon|today|between|(the [0-9]+(th|nd|st)*)|([0-9]+[\s]*(th|nd|st))|([0-9]+,[\s]*(19|20)[0-9]{2})|([0-9]+[\s]*[pam]{2})|((and )*[0-9]{1,2}[: ]+[0-9]{2}[\s]*(pm|am)*)|[\s,]){4,}/g," ");

		if (/missed connections/gi.test(sentenceText)
			||
			/so i know it[\']*s you/gi.test(sentenceText)
			||
			/(reply|respond)/gi.test(sentenceText)
			||
			/(pussy|fuck|shit|slut|bitch|nigger|fag)/gi.test(sentenceText)
			||
			/jack(ing|ed) off/gi.test(sentenceText)
			||
			/(January|February|April|June|July|August|September|October|November|December)/gi.test(sentenceText)
			||
			/(March|May)/g.test(sentenceText)
			||
			/last week/gi.test(sentenceText)
			||
			/(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/gi.test(sentenceText)
			||
			/if this is you/gi.test(sentenceText)
			||
			/ould have had/gi.test(sentenceText)
			||
			/see this/gi.test(sentenceText)
			||
			/ ago/gi.test(sentenceText)
			||
			/(yester|to)day/gi.test(sentenceText)
			||
			/hit me up/gi.test(sentenceText)
			||
			/tell me what/gi.test(sentenceText)
			||
			/oh my(?!: god)/gi.test(sentenceText)
			||
			/^You are[\w\s]*(hot|pretty|beautiful|gorgeous|sexy|stunning|absolutely)/gi.test(sentenceText)
			||
			/long shot/gi.test(sentenceText)
			)
			{
			//console.log("Skip: " + sentenceText);
			continue;
			}

		if (sentenceText.indexOf("?")==sentenceText.length-1) {
			if (sentenceText.indexOf("homepage")>-1)
				continue;
		}

		sentenceText = sentenceText.replace(/^if only/gi," ");
		sentenceText = sentenceText.replace(/^besides,/gi," ");
		sentenceText = sentenceText.replace(/^Still,/gi," ");
		sentenceText = sentenceText.replace(/must of/gi,"must have");
		sentenceText = sentenceText.replace(/^Would/gi,"I would");
		sentenceText = sentenceText.replace(/^Didn't/gi,"I doesn't");
		sentenceText = sentenceText.replace(/^Don't/gi,"I doesn't");
		sentenceText = sentenceText.replace(/^Saw/gi,"I sees");
		sentenceText = sentenceText.replace(/^But /gi," ");
		sentenceText = sentenceText.replace(/^And /gi," ");
		sentenceText = sentenceText.replace(/i didn't/gi,"I doesn't");
		sentenceText = sentenceText.replace(/you didn't/gi,"you don't");
		sentenceText = sentenceText.replace(/you seemed/gi,"you seem");
		sentenceText = sentenceText.replace(/i don't/gi,"I doesn't");
		sentenceText = sentenceText.replace(/i wasn't/gi,"I isn't");
		sentenceText = sentenceText.replace(/(!my|!your|!his|!her|!its|!their)[\s]*(left)([\.\?\!])/gi,"leave$2");
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
			setups.push({content:prettify(nlp.pos(sentenceText).sentences[0].to_present().text()),sentenceNumber:senti,connectionID:connectionID});
			//setups.push(prettify(sentence.to_present().text()));
			continue;
		}

		var tenseVerbs = ["VBD"];

		var mangled = sentenceText.trim();

		var dontChangeTenseAfter = ["have","would","should","looked","being","seemed", "look", "seem"];
		var dontChangeTense = ["been"];
		var last_token = "";
		var second_to_last_token = "";
		var third_to_last_token = "";
		var last_token_pos = "";
		var second_to_last_token_pos = "";
		var third_to_last_token_pos = "";
		var last_verb_you = false;

		for (var tokeni = 0; tokeni < sentence.tokens.length; tokeni++) {
			token = sentence.tokens[tokeni];
			token_text = token.text.replace(/[\.,\!\?\"\']/g,"");
			/*
			* First some manual things.
			*/
			if (second_to_last_token.toLowerCase()=="could" && last_token.toLowerCase()=="have")
			{
				mangled = mangled.replace(second_to_last_token + " " + last_token + " " + token.text, "can " + nlp.verb(token_text).conjugate().infinitive);
			}
			else if (third_to_last_token.toLowerCase()=="could" && second_to_last_token.toLowerCase()=="not" && last_token.toLowerCase()=="have"
				||
				third_to_last_token.toLowerCase()=="should" && second_to_last_token.toLowerCase()=="not" && last_token.toLowerCase()=="have"
				||
				last_token_pos=="RB")
			{
				// do nothing
			}
			else if (second_to_last_token.toLowerCase()=="should" && last_token.toLowerCase()=="have")
			{
				mangled = mangled.replace("should have " + token.text, "should " + nlp.verb(token_text).conjugate().infinitive);
			}
			else if (last_token.toLowerCase()=="would")
			{
				mangled = mangled.replace(token.text, nlp.verb(token_text).conjugate().infinitive);
			}
			else if (token.pos.tag=="VBD" || token.pos.tag=="CP" || (token.pos.tag=="VB" && token_text.slice(token_text.length - 2)=="ed"))
			{
				//console.log("Verb: " + token.text + " " + token.pos.tag);
				if (dontChangeTenseAfter.indexOf(last_token)==-1 
					&& dontChangeTense.indexOf(token_text)==-1)
				{
					//console.dir(token.analysis);
					var vbtext = token_text;
					if (vbtext.charAt(vbtext.length-1)==",")
						vbtext = vbtext.slice(0,vbtext.length-1);
					var vbpres = nlp.verb(vbtext).to_present();
					var vbinf  = nlp.verb(vbtext).conjugate().infinitive;

					if (((last_token.toLowerCase()=="you" || last_token.toLowerCase()=="we") || (last_verb_you && last_token.toLowerCase()=="and")) && token.pos.tag!="CP")
					{
						//console.log("Verb: " + token.text + " " + token.pos.tag + " YOU MODE");
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
			}
			else if (token.pos.tag=="VB") // generic verb (i.e. can't recognize tense)
			{
				//console.log("Verb: " + token.text + " " + token.pos.tag);
				if (second_to_last_token.toLowerCase()=="could" && last_token.toLowerCase()=="have")
				{
					mangled = mangled.replace("could have " + token.text, "can " + nlp.verb(token_text).conjugate().infinitive);
				}
				if (second_to_last_token.toLowerCase()=="should" && last_token.toLowerCase()=="have")
				{
					mangled = mangled.replace("should have " + token.text, "should " + nlp.verb(token_text).conjugate().infinitive);
				}
				if (token_text.toLowerCase()=="left")
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
				//console.log("Verb: " + token.text + " " + token.pos.tag);
				if (last_token=="you" || second_to_last_token=="you")
				{
					mangled = mangled.replace(token.text, nlp.verb(token_text).conjugate().infinitive);						
				}
				/*else if (last_token=="i" || second_to_last_token=="i")
				{
					mangled = mangled.replace(token.text, nlp.verb(token.text).to_present());												
				}*/
			}
			else if (token.pos.tag=="VBP")
			{
				if (last_token.toLowerCase()=="i" || second_to_last_token.toLowerCase()=="i")
				{
					mangled = mangled.replace(token.text, nlp.verb(token_text).to_present());												
				}	
			}

			third_to_last_token_pos = second_to_last_token_pos;
			second_to_last_token_pos = last_token_pos;
			last_token_pos = token.pos.tag;

			third_to_last_token = second_to_last_token;
			second_to_last_token = last_token;
			last_token = token_text;
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

		mangled = mangled.replace(/([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)(liks)([.,-\/#!$%\^&\*;:{}=\-_`~()\s]+)/gi, "like");	
		//mangled = mangled.replace(/(I)/g, "it");

		if (mangled.length>120)
			continue;

		if (mangled.indexOf("'m am")>0)
			continue;
	
		mangled = mangled.replace(/(\'[dt])+s/ig,"$1");

		if (/[\!\.\?]s/.test(mangled.slice(mangled.length-2))) 
			mangled = mangled.slice(0,mangled.length-1);

//		parsedMangled = nlp.pos(mangled);
		
		mangled = prettify(mangled);

		if (/^You[\s,]/.test(mangled))
		{
			var desc = {content:mangled,sentenceNumber:senti,connectionID:connectionID};
			//console.dir(desc);
			setups.push(desc);
		}
		else if (replacedFirstI==true)
		{
			var desc = {content:mangled,sentenceNumber:senti,connectionID:connectionID};
			descriptions.push(desc);
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
