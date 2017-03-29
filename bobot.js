const Discord = require("discord.js");
var Datastore = require('nedb')
    , db = new Datastore({ filename: './bobot.nedb', autoload: true })
    , triggers = [];
var ContextMemoryDuration = 10

//Private self-observant functions which should implement behaviour such as identifying loops and responding humanly
function passive(bot, user, userID, channel, message, event, ctx) {
    //Detect loops (runaway handlers for example)
    ctx.passive = ctx.passive || { ctr: 0 }
    ctx.passive.ctr = ctx.passive.ctr++
    if (ctx.passive.ctr > 100) {
        ctx.break = 1;
        bot.message()
    }
    //Respond to noPermission
    if (ctx.lackPermit) {
        //Determine the reason if any given
        var why = ctx.lackPermitReason;
        objif: if (typeof why == 'object') {
            var keys = Object.keys(why || {})
            if (keys.length == 0) { why = undefined; break objif; }
            var key = keys[~~(Math.random() * keys.length)]
            why = why[key]
        }

        //Formulate a response with the reason (or without)
        if (typeof why != 'undefined') say = [
            "I don't think so",
            "Not so fast",
            "Not going to happen",
            "Nope",
        ]//TODO db, add NLP
        if (typeof why == 'string') say = [
            "Not for thee: " + why,
            "You can't: " + why,
            "No, because: " + why
        ]

        say = say[~~(Math.random() * say.length)] + '.'

        //Add some wit
        var repeat_wit = [
            " Things don't change that quickly.",
            " You're not a fast learner, aye you?",
            " Did you think I might have changed my mind?",
            " Still.",
            " Why don't you ask me a few more times to make sure?"
        ]
        if (core.mem(ctx.contextID, 0).lackPermit) say += repeat_wit[~~(Math.random() * repeat_wit.length)]

        core.sendMessage(channel, say)
        ctx.break = true;
    }
    return ctx
}

//Main functionality to be made available to the triggers
//All packages used by the bot on command should be added here.
const vmSbox = { a: 2 };
const vm = require('vm');

var core = {
    bot: {},
    config: {},
    memory: {},
    vmSbox,
    vmCtx: new vm.createContext(vmSbox),
    vm,
    httpreq: require('httpreq'),
    cmd: require('node-cmd'),

    //Until we have some nice natural language generation, this will do
    lackPermit: ["cannot permit", "not allowed", "unprivelaged", "no permission"],

    //Handle a message event
    HandleMessage: function (msg) {
        const user = msg.author.username;
        const userID = msg.author.id;
        const message = msg.type=='DEFAULT' ? msg.content : msg.type;
        const channel = msg.channel;
        const channelID = channel.id || userID;
        const event = msg.type;

        //Hard coded handlers can go here
        if (message === "ping") return msg.channel.sendMessage("pong" );

        if (message === "GetBobotID") {
            msg.channel.sendMessage("BobotIDCheck::");
            console.log("Bobot ID check from: " + userID)
            return
        }
        if (message === "BobotID::") {
            console.log("Bobot ID is: " + userID)
            return
        }

        if (message === "share bobot") return msg.channel.sendMessage(config.sharelink);

        //Prepare the context for short term memory commands
        var contextID = (userID + channelID)
        memory[contextID] = memory[contextID] || []
        var ctx = { contextID }
        for (var t in triggers) { //Loop through the triggers in order until one sets the break flag, substituting each returned ctx if any. 
            var args = [user, userID, channelID, message, event]
            if (ctx.break) break; else {//user, userID, channel, message, event, ctx
                ctx = triggers[t].call(this, user, userID, channel, message, event, ctx) || ctx
                ctx = passive(bot, user, userID, channel, message, event, ctx) || ctx
            }
        }

        //Add the context to the end of the short term memory, truncate if necessary
        memory[contextID].unshift(ctx)
        if (memory[contextID].length > ContextMemoryDuration) memory[contextID].pop()
    },

    /*
        Add helper functions available to triggers here.
        Triggers can access helpers from this.FuncName
    */

    //access to past contexts, most to least recent
    mem: function (contextID, t) {
        memo = memory[contextID] || []
        if (t === undefined) return memo
        return memo[t] || {}
    },

    //sendmessage wrapper
    sendMessage: function (channel, message) {
        message = message || "`nil`"
        if (message.length >= 2000) message = message.match(/((.|\n|\t){1,1996})/gi)+'...';
        if (typeof message == "object") for (m in message) if (message.hasOwnProperty(m)) arguments.callee(to, message[m])
        channel.sendMessage(message)//{ to, message, tts: config.tts })
    },

    //config data to DB
    saveConfig: function (overwrite) {
        overwrite = overwrite || { config, memory }
        db.remove({ type: "config" }, {}, () => { })
        db.insert(overwrite, () => { })
    },

    //uploadFile wrapper
    sendFile: function (to, msg, fname, data) {
        bot.uploadFile({
            to,
            file: data || fname,
            filename: fname, //File will be uploaded to Discord as 'fillCIRCLE.png'
            message: msg
        }, (err, res) => {
            if (err) console.dir({ err });
        });
    },

    //Initialize instructions
    InitHelp: function () {
        console.log(`BoBot v20170328.
        To initialize, edit bobot.nedb in strict JSON according to entries. 
        Change init:false to init:true, then restart bobot.js`)
    }
}

//Initialize app
db.find({ type: "config", init: true }, (err, docs) => {
    if (err) return console.dir({ StartupERR: err })

    if (docs.length == 0) {
        //first run init, ask for token
        console.log("Init")
        db.insert({ init: false, type: "config", config: { token: "MyAPIToken", myid: "MyBotID", masterid: "MyMastersID", tts: false, sharelink: "optional link to add to server" }, memory: {} },
            (err) => { if (err) console.log("INITERR:" + JSON.stringify(err)) })
        return InitHelp();
    }
    if (!docs[0].init) return InitHelp();

    //Syntax note: this is a declaration. Same as `config=docs[0].config`
    ({//get config from db
        config, //configurations
        memory  //short term mem
    } = docs[0])
    if (!config) console.log(`WARNING: ({obj}=objs[0]) syntax unsupported!`)


    //set up some vars in this scope before we init triggers
    this.MasterID = config.masterid
    this.MyID = config.myid
    core.config = config
    this.core = core
    triggers = require('./trig.js')(this)

    console.log(`Initialised ${triggers.length} triggers`)

    bot = new Discord.Client();

    bot.on('ready', function (event) { console.log(`Logged in as ${bot.user.username}`); bot.sendMessage('295870878762270720','ready'); });
    bot.on('message', core.HandleMessage);

    bot.login(config.token);

    bot.on('disconnect', function(msg, code) {
        console.log('Reconnect...');
        if (code === 0) return console.error(msg);
//        bot.connect();
    });
})
