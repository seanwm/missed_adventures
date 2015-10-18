#Missed Adventures

This is a [Twitter bot](https://twitter.com/MssdAdvntrs) that posts D&D or adventure game-style room descriptions, created from Craigslist Missed Connections m4w posts. Like this:

```
You are soo beautiful and graceful.
Simply put, an [Ogre Chieftan] thinks you are the most beautiful woman it'd ever seen.
```

##Why?

Well, I've been wanting to create a Twitter bot for a while now. It occurred to me one evening that most missed connections posts are simple sentences that either set a scene, or describe a person. And having built a MUD some years ago, and played more World of Warcraft than was healthy, I thought they were *almost* readymade to be (mis)used to describe an adventurer's path through a dungeon. I'd just need to change the tense of any verbs, to turn this:

"You were flustered, in a hurry, and mistook me for an employee."

into this:

"You are flustered, in a hurry, and mistake a [Desert Elf] for an employee."

Changing the tense of these sentences in a coherent way ended up being more complicated than I first imagined, but that's the gist of it. And missed connections posts have turned out to be less formulaic than I expected, which makes the parsing harder but the results better: with romance at stake, people often (though certainly not always) write some pretty purple prose, or at least a few complete sentences with a minimum number of misspellings.

##Why only m4w?

I started out looking through all missed connections posts, because everyone can do some pretty colorful scene-painting when recalling the spark that they *just* missed catching. But as I continued working on the bot, two scenarios kept coming up:

* A woman was kind to the man writing in a professional context: a waitress, nurse, cashier, etc.
* A man was staring at a woman, when she looked up and smiled awkwardly to break the creepy tension. The man writing interprets this as reciprocated interest.

My fellow men: neither of these are "missed connections". Sure, there will be the inevitable, innocent misreadings of encounters, but maybe we'd all be better off if Craig re-named the category, "Oh My God, I Can't Believe I Didn't Get Your Contact Info, Even Though We Were In A Situation In Which Asking For It Would Have Been Totally Appropriate." Of course, even an idealist like Craig has to take a pragmatic shotcut now and then; maybe we could settle for a way for other users to add [this video](https://www.youtube.com/watch?v=dXlCjmLzNp0) to select posts.

After reading enough of these, I stopped hearing the individual stories these men were trying to tell, and started to see them as just the low-level enemy's perspective in a different tale: a heroic protagonist is trying accomplish one quest or another, but strange creatures keep trying to butt into the scene. Perhaps this is the adventure of being a woman in the world?

Most likely, #notallmen writing up their longing looks across the cereal aisle are creeps—having posted to /mis/ myself, I certainly hope not—but I hope we can all agree that if there's any class fit to be algorithmically replaced by monsters with names like "Berserk Flesh Golem", and "Caustic Creeper", it's us.

##How Do I Use This?

I'm going to start this section with a blanket apology for the code, and leave the caveats at that. Here's what you'll need to do to get this running:

* Put the appropriate Twitter API key values in config.js.
* Run `node fetch_cl_posts.js` to collect posts from Craigslist. Don't forget to edit the cities variable to your liking, first!
* Run `node mutate_connections.js` to parse all those connections into two classes of sentences: "setups" that either start "It is/was..." or "You...", and descriptions, which can be any sentence that's had a creature subbed into it. Creatures are inserted for the first occurance of "I", "me", "us", or "we" (us and we are turned into, e.g. "You and a [Slime Mold]").
* The mutate_connections.js script actually just inserts `{INSERT_CREATURE}` placeholders into the setup and description sentences it generates. This makes it easier to tweak the presentation of the monsters even after all the heavy pre-parsing has been done.
* Finally, run `node mud_date.js` to create and post a tweet. Each tweet is one randomly-chosen setup sentence followed by a randomly-chosen description sentence. Chosen sentences get flagged, so you should never get a repeat (there's a few lines you can un-comment in mud_date.js to reset those flags if you like). The tweet is also logged to the console, with its character length.
* The mud_date.js script will post one tweet immediately, and then another ever three hours after that. There's a setInterval() call you can alter to change that frequency.

##Thanks!

I hope you like this! I certainly had fun making it. Thanks to @tinysubversions, @aparish, and @deathmtn, who all make computers do strange and wonderful things, for their inspiration. Double thanks to @tinysubversions for the super-excellent [ExampleBot](https://github.com/dariusk/examplebot/). Thanks also to the [NLP Compromise](https://github.com/spencermountain/nlp_compromise) project, which this project uses for much of its text-mangling. Last but not least, thanks to Laura, who provided an editing assistance, expert advice about selecting D&D monsters, and helpful second opinions throughout this little project.