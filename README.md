#Missed Adventures

This is a Twitter bot that posts D&D or adventure game style room descriptions, created from Craigslist Missed Connections m4w posts. Like this:

```
You are soo beautiful and graceful.
Simply put, an [Ogre Chieftan] thinks you are the most beautiful woman it'd ever seen.
```

##Why?

Well, I've been wanting to create a Twitter bot for a while now, and it struck me that—other than being written in the past tense—missed connections posts often have perfect descriptive language. 

"I was wearing a red shirt with a brown scarf, shifting my weight between my feet while browsing the magazine rack. You were flustered, in a hurry, and mistook me for an employee."

Etc. And with romance at stake, people often (though certainly not always) write some pretty purple prose, or at least a few complete sentences with a minimum number of misspellings.

##Why only m4w?

I started out looking through all missed connections posts, because everyone can do some pretty colorful scene-painting when recalling the spark that they /just/ missed catching. But as I continued working on the bot, two scenarios kept coming up:

* A woman was kind to the man writing in a professional context: a waitress, nurse, cashier, etc.
* A man was staring at a woman, when she looked up and smiled awkwardly to break the creepy tension. The man writing interprets this as reciprocated interest.

My fellow men: neither of these are "missed connections". Even allowing for inevitable, innocent misreadings of encounters, the category should've been called, "Oh My God, I Can't Believe I Didn't Get Your Contact Info, Even Though We Were In A Situation In Which Asking For It Would Have Been Totally Appropriate," but even an idealist like Craig has to take a pragmatic shotcut now and then. 

For me, it was a glimpse into a weird where you're just trying accomplish one quest or another, but strange creatures keep trying to butt into the scene: the adventure of being a woman in the world.

Most likely not all those hetero cis-gendered male NPCs writing up their longing looks across the cereal aisle are creeps—having written one or two over the years myself, I certainly hope not—but I hope we can all agree that if there's any class fit to be algorithmically replaced by monsters with names like "Berserk Flesh Golem", and "Caustic Creeper", it's us.

##How Do I Use This?

I'm going to start this section with a blanket apology, and leave the caveats at that. Here's what you'll need to do to get this running:

* Put the appropriate Twitter API key values in config.js.
* Run '''node fetch_cl_posts.js''' to collect MIS posts from Craigslist. Don't forget to edit the cities variable to your liking, first!
* Run '''node mutate_connections.js''' to parse all those connections into two classes of sentences: "setups" that either start "It is/was..." or "You...", and descriptions, which can be any sentence that's had a creature subbed into it. Creatures are inserted for the first occurance of "I", "me", "us", or "we" (us and we are turned into, e.g. "You and a [Slime Mold]").
* The mutate_connections.js script actually just inserts '''{INSERT_CREATURE}''' placeholders into the setup and description sentences it generates. This makes it easier to tweak the presentation of the monsters even after all the heavy pre-parsing has been done.
* Finally, run '''node mud_date.js''' to create and post a tweet. Each tweet is one randomly-chosen setup sentence followed by a randomly-chosen description sentence. Chosen sentences get flagged, so you should never get a repeat (there's a few lines you can un-comment in mud_date.js to reset those flags if you like). The tweet is also logged to the console, with its character length.

##Thanks!

I hope you like this! I certainly had fun making it. Thanks to @tinysubversions, @aparish, and @deathmtn, who all make computers do strange and wonderful things, for their inspiration. Double thanks to @tinysubversions for the super-excellent [ExampleBot](https://github.com/dariusk/examplebot/).