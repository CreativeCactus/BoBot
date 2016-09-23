# BoBot
A framework for a discord bot including context sensitivity and extensible triggers

To start your very own Discord.gg bot, run:

```
      node bobot.js    
```

You should now have a bobot.nedb, which is a database for your bot. Open it and add details as instructed on the config object.

* config:token This is the API token provided by Discord when you set up the bot. 

* config:myid This is the account ID of the bot. It is only used to avoid self-reply. You can send the message "GetBobotID" to automatically log it.

* config:masterid This is the ID of the user to treat as the master. It is also optional, and should be visible in stdout.

* config:sharelink Is the add-to-server link to reply with when someone says "share bobot", though it can be any string. 

* config:tts Default text to speech mode?

Now start bobot.js again and it should login!

# Commands

I have added a few of my own commands into trig.js (and a few in bobot.js).

js `   `   
Execute sandboxed javascript

jsunsafe `   ` 
Execute js in the local scope, Master only

bash `   ` 
Execute bash, Master only

here is a joke for u   
...
...
..!
Example of context sensitivity. 
The first message will start a context which responds to every following message "and then?" until a message ends with "!".

redmine ...
I am working on integrating with redmine API to get wiki docs.

tts on/off
Set tts on or off, Master only


