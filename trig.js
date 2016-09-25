module.exports=(self)=>{
    var core=self.core
    
    //Initialize sub-triggers in trig-something.js here, using the same format, and attach to the core
    //then call the sub-triggers from a small handler in this main list.
    //In this way the handlers can be organized heirarchically and response time is improved.
    
    
    return [
        (user, userID, channelID, message, event, ctx)=>{ //always run example
            console.log(`${userID} said :`+message)
            console.dir(self.sendMessage)
            return ctx//this is not needed if no change will be made to the ctx
        },
        (user, userID, channelID, message, event, ctx)=>{ //ignore myself
            ctx.break=(userID==self.MyID)        
            return ctx
        },
        (user, userID, channelID, message, event, ctx)=>{ //Set up a flag for Is masters message
            ctx.Master=(userID==self.MasterID)
            return ctx
        },
        (user, userID, channelID, message, event, ctx)=>{ //set TTS command
            var rx=( /^tts (on|off)/gi ), act = "", ok=(msg)=>{core.sendMessage(channelID||userID,"Set TTS "+msg)}
            if ( message.match(rx) ) act = rx.exec(message)[1].toLocaleLowerCase(); else return
            if (!ctx.Master) return SayNo(channelID,lackPermit)
            act={
            "on":  ()=>{ core.config.tts=true;  ok("enabled.") },
            "off": ()=>{ core.config.tts=false; ok("disabled.")}
            }[act]
            if(act){act();core.saveConfig();}
        },
        (user, userID, channelID, message, event, ctx)=>{ //eval bash command
            var rx=( /^bash `((.|\n){2,})`/gi ), act = ""
            if ( !message.match(rx) ) return
            if (!ctx.Master)return SayNo(channelID,lackPermit)        
            act = rx.exec(message)[1]
            
            if(act)
            cmd.get(act, function(data){
                core.sendMessage(channelID,data)
            }
        );
        },
        (user, userID, channelID, message, event, ctx)=>{ //Sandbox js command
            var rx=( /^js `((.|\n){2,})`/gi ), act = ""
            if ( message.match(rx) ) act = rx.exec(message)[1]
            if(act)           
                try {
                    core.sendMessage( channelID, JSON.stringify(core.notevil(act)) )
                } catch (error) {
                    core.sendMessage(channelID,JSON.stringify({error}))
                }
        },
        (user, userID, channelID, message, event, ctx)=>{ //Native eval command
            var rx=( /^jsunsafe `((.|\n){2,})`/gi ), act = ""
            if ( !message.match(rx) ) return
            if (!ctx.Master)return SayNo(channelID,core.lackPermit)
            act = rx.exec(message)[1]
            
            if(act)
            cmd.get(act, function(data){
                core.sendMessage(channelID,data)
            }
        );
        },
        (user, userID, channelID, message, event, ctx)=>{ //allow setting a 'joke' context command
            var rx=( /here is a joke 4 u/i )
            if(!message.match(rx))return
            
            ctx.context='joke'
            console.log(`Joke in context ${ctx.contextID}`)
            core.sendMessage(channelID,"Oh pls tell me ur joke.")
            return ctx
        },
        (user, userID, channelID, message, event, ctx)=>{ //behaviours within a joke context command
            if(core.mem(ctx.contextID,0).context!='joke')return;
            
            console.dir({'JokeCTX':core.mem(ctx.contextID)})
            
            if(message[message.length-1]=='!'){
                core.sendMessage(channelID,"That was a funny joke.")
            }else{
                core.sendMessage(channelID,"and then?")
                ctx.context='joke'
                console.log("continuation")
            }
            
            return ctx
        },
        (user, userID, channelID, message, event, ctx)=>{ //redmine command
            if (!ctx.Master)return
            var rx=( /redmine ((.|\n){2,})/i )
            if(!message.match(rx))return
            
            act = rx.exec(message)[1]
            var to=setTimeout(()=>{  core.sendMessage(channelID,"Error: No reply from server")    },6000)
            
            httpreq.get(`http://188.166.24.184:3000/projects/core_of_the_plan/wiki/${act}.xml`, function (err, res){
                clearTimeout(to)
                if (err) return core.sendMessage(channelID,"Error: No reply from server")
                
                core.sendMessage(channelID,JSON.stringify(res))
                // console.log(res.statusCode);
                // console.log(res.headers);
                // console.log(res.body);
                // console.log(res.cookies);
            });
        
            return ctx
        }
    ]
}