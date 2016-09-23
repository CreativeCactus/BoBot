var Discord = require('discord.io');  
var cmd=require('node-cmd');
var Datastore = require('nedb')
  , db = new Datastore({ filename: './bobot.nedb', autoload: true })
  , triggers = [];
  
//Until we have some nice natural language generation, this will do
var lackPermit=["cannot permit","not allowed","unprivelaged","no permission"]
  
  
//Main functionality to be made available to the triggers
var core= {
    notevil:require('notevil'),
    httpreq:require('httpreq'),
    bot:{},
    config:{},
    memory:{},
    //Handle a message event
    HandleMessage:function(user, userID, channelID, message, event) {
        
        if (message === "ping") {
            bot.sendMessage({
                to: channelID,
                message: "pong"
            });
            return
        }
        
        if (message === "share bobot") {
            bot.sendMessage({
                to: userID,
                message: config.sharelink
            });
            return
        }
        
        var contextID=(userID+channelID)
        memory[contextID] = memory[contextID] || []
        var ctx = {contextID}
        for (var t in triggers) 
            if (ctx.break) break; else ctx=triggers[t].call(this,user, userID, channelID, message, event, ctx)||ctx
        
        
        memory[contextID].unshift(ctx)
        if( memory[contextID].length > 10 ) memory[contextID].pop()
    },


    
    //Provide a negative response with optional reason.
    SayNo:function(to,why){
        if(typeof why == 'object')why=why[~~(Math.random()*why.length)]
        if(typeof why == 'string')say=[
            "I don't think so.",
            "Not so fast.",
            "Not going to happen.",
            "Nope.",
        ]//TODO db
        if(typeof why == 'undefined')say=[
            "Not for thee: "+why,
            "You can't: "+why,
            "No, because: "+why
        ]
        sendMessage(to,say[~~(Math.random()*say.length)])
    },
    //access to past contexts
    mem:function(contextID,t){
        memo=memory[contextID] || []
        if(t===undefined)return memo
        return memo[t] || {}
    },
    sendMessage:function(to, message){
        message=message||"`nil`"
        bot.sendMessage({to,message,tts:config.tts});
    },
    //config data to DB
    saveConfig:function(overwrite){
        overwrite=overwrite||{config,memory}
        db.remove({type:"config"},{},()=>{})
        db.insert(overwrite,()=>{})
    },
    sendFile:function(){
    // bot.uploadFile({
    //     to: "Your Channel ID",
    //     file: "fillsquare.png",
    //     filename: "fillCIRCLE.png", //File will be uploaded to Discord as 'fillCIRCLE.png'
    //     message: "This is my uploaded file"
    // });
    },
    //Initialize instructions
    InitHelp:function(){
        console.log(`BoBot v20160923.
        To initialize, edit bobot.nedb in strict JSON according to entries. 
        Change init:false to init:true, then restart bobot.js`)
        
    }
}
  
//Initialize app
db.find({type:"config",init:true},(err,docs)=>{
    if(err)      return console.dir({StartupERR:err})
    if(docs.length==0){
        //first run init, ask for token
        console.log("Init")
        db.insert({init:false,type:"config",config:{token:"MyAPIToken",myid:"MyBotID",masterid:"MyMastersID",tts:false,sharelink:"optional link to add to server"},memory:{}},
                (err)=>{if(err)console.log("INITERR:"+JSON.stringify(err))})
        return InitHelp();
    }
    if(!docs[0].init)return InitHelp();
    
    ({
        config, //configurations
        memory  //short term mem
    }=docs[0])
    
    var MasterID = config.masterid
    var MyID = config.myid
    this.core=core
    triggers = require('./trig.js')(this)
    
    console.log(`Initialised ${triggers.length} triggers`)
    
    bot = new Discord.Client({
        autorun: true,
        token: config.token
    });

    bot.on('ready', function(event) {    console.log('Logged in')   });
    bot.on('message', core.HandleMessage);
})
