// *** MODULE DEFINITIONS *** //

//Image generation and VM
const util = require('util');
var gd = require('node-gd');

function runVM(vm, code, ctx) {
    try {
        return (new vm.Script(code, { timeout: 5000 })).runInContext(ctx, { timeout: 5000 });
    } catch (error) {
        console.log(`errormsg: ${util.inspect(error)}`);
        if (error.message.indexOf('Script execution timed out.') + 1) return ('Code timed out. Avoid those infinite loops. :P');
        return '`' + util.inspect(error.message) + '`'
    }
}

//Webhooks server
const name = u => u.full_name ? u.full_name + ` (${u.username})` : u.username;
const neat = (s,n)=>{if(s.length<n)return s; return s.trim(0,n-3)+"...";}
var express = require('express')
  , app = express();
bodyParser = require('body-parser');
app.use(bodyParser.json());

webhookInit=(self,core,channelID)=>{
    app.post('/webhook', function(req, res){
	const event = req.body;
	const repo = event.repository.full_name;
	// If this is a push event, message
	if(event.pusher && !event.ref_type){
		const user = event.pusher;
		const repo = event.repository.full_name;
		const branch = '';
		const url = event.compare_url.replace('http://localhost:','');

		let message = event.commits.map( (v, i) => {return i>10?"":`${neat(v.message,160)}\n`})
		message = message.join('')+(message.length>=10?`... ${message.length-10} more.\n`:'')

        core.sendMessage(channelID,`\`${name(user)}\` pushed to \`${repo}#${branch}\`.\n\`\`\`${message}\`\`\`\nCompare: \`${url}\``);
	} else if (event.ref_type==='branch'){
		const branch = '';
		const branch2 = event.ref;
        const url = event.repository.html_url;
        core.sendMessage(channelID,`\`${event.sender.username}\` branched \`${repo}#${branch}->${branch2}\`.\nSee: \`${url}\``);
    } else {
		if(self.MasterID)core.sendMessage(self.MasterID,"Unknown webhook, see logs");
		console.log('Unknown webhook: '+JSON.stringify(event,null,0))
	}
        res.sendStatus(300);res.end();
    });
    app.listen(65000);
}

// Main setup for triggers
module.exports = (self) => {
    var core = self.core
    webhookInit(self,core,'295870878762270720');
    //Initialize sub-triggers in trig-something.js here, using the same format, and attach to the core
    //then call the sub-triggers from a small handler in this main list.
    //In this way the handlers can be organized heirarchically and response time is improved.


    return [
        (user, userID, channel, message, event, ctx) => { //always run example
            console.log(`${userID} said :` + message)
            //console.dir(self.sendMessage) //undefined? why?
            return ctx//this is not needed if no change will be made to the ctx
        },
        (user, userID, channel, message, event, ctx) => { //ignore myself
            ctx.break = (userID == self.MyID)
            return ctx
        },
        (user, userID, channel, message, event, ctx) => { //Set up a flag for Is masters message
            ctx.Master = (userID == self.MasterID)
            return ctx
        },
        // (user, userID, channel, message, event, ctx) => { //set TTS command
        //     var rx = (/^tts (on|off)/gi), act = "", ok = (msg) => { core.sendMessage(channel || userID, "Set TTS " + msg) }
        //     if (message.match(rx)) act = rx.exec(message)[1].toLocaleLowerCase(); else return
        //     if (!ctx.Master) { ctx.lackPermit = 1; return ctx }
        //     act = {
        //         "on": () => { core.config.tts = true; ok("enabled.") },
        //         "off": () => { core.config.tts = false; ok("disabled.") }
        //     }[act]
        //     if (act) { act(); core.saveConfig(); }
        // },
        // (user, userID, channel, message, event, ctx)=>{ //eval bash command
        //     var rx=( /^bash `((.|\n|\t){2,})`/gi ), act = ""
        //     if ( !message.match(rx) ) return
        //     if (!ctx.Master){ ctx.lackPermit=1; ctx.lackPermitReason="You are not master."; return ctx}        
        //     act = rx.exec(message)[1]

        //     if(act)
        //     core.cmd.get(act, function(data){
        //         core.sendMessage(channel,data)
        //     }
        // );
        // },

        (user, userID, channel, message, event, ctx) => { // Draw command
            var rx = (/^bobot draw (.*)/gi)
            if (!message.match(rx)) return

            let rxe = rx.exec(message);
            console.dir(rxe);
            let msg = rxe[1]

            let evalrx = (/^(`{1,3})((.|\n|\t){1,})(\1)/gi);
            if (msg.match(evalrx)) {
                rxe = evalrx.exec(msg);
                console.dir(rxe);
                msg = '' + runVM(core.vm, rxe[2], core.vmCtx);
            }

            const r255 = () => { return ~~(Math.random() * 255) }

            var img = gd.createSync(500, 60);
            img.colorAllocate(r255(), r255(), r255()); // Background
            var txtColor = img.colorAllocate(r255(), r255(), r255());

            var fontPath = `${__dirname}/unifont9.ttf`; //NotoMono.ttf`;
            //'/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf';

            img.stringFT(txtColor, fontPath, 24, 0, 10, 50, msg || 'Hello world!');

            core.sendFile(channel, '', 'example.png', Buffer.from(img.pngPtr(), 'binary').toString());

        },
        (user, userID, channel, message, event, ctx) => { // Sandbox js command
            var rx = (/^js (`{1,3})((.|\n|\t){1,})(\1)/gi), act = ``, wrap = ``;
            if (!message.match(rx)) return
            let rxe = rx.exec(message);
            act = rxe[2];
            wrap = rxe[1];

            if (!act) return;
            core.sendMessage(channel, wrap + runVM(core.vm, act, core.vmCtx) + wrap);
        },
        // (user, userID, channel, message, event, ctx)=>{ // Native eval command
        //     var rx=( /^jsunsafe `((.|\n|\t){2,})`/gi ), act = ""
        //     if ( !message.match(rx) ) return
        //     if (!ctx.Master){ ctx.lackPermit=1; ctx.lackPermitReason="You are not master."; return ctx}
        //     act = rx.exec(message)[1]

        //     if(act)
        //     cmd.get(act, function(data){
        //         core.sendMessage(channel,data)
        //     }
        // );
        // },
         (user, userID, channel, message, event, ctx)=>{ //allow setting a 'joke' context command
             var rx=( /here is a joke 4 u/i )
             if(!message.match(rx))return

             ctx.context='joke'
             console.log(`Joke in context ${ctx.contextID}`)
             core.sendMessage(channel,"Oh pls tell me ur joke.")
             return ctx
         },
         (user, userID, channel, message, event, ctx)=>{ //behaviours within a joke context command
             if(core.mem(ctx.contextID,0).context!='joke')return;

             console.dir({'JokeCTX':core.mem(ctx.contextID)})

             if(message[message.length-1]=='!'){
                 core.sendMessage(channel,"That was a funny joke.")
             }else{
                 core.sendMessage(channel,"and then?")
                 ctx.context='joke'
                 console.log("continuation")
             }

             return ctx
         },
        // (user, userID, channel, message, event, ctx)=>{ //redmine command
        //     if (!ctx.Master)return
        //     var rx=( /redmine ((.|\n|\t){2,})/i )
        //     if(!message.match(rx))return

        //     act = rx.exec(message)[1]
        //     var to=setTimeout(()=>{  core.sendMessage(channel,"Error: No reply from server")    },6000)

        //     httpreq.get(`http://188.166.24.184:3000/projects/core_of_the_plan/wiki/${act}.xml`, function (err, res){
        //         clearTimeout(to)
        //         if (err) return core.sendMessage(channel,"Error: No reply from server")

        //         core.sendMessage(channel,JSON.stringify(res))
        //         // console.log(res.statusCode);
        //         // console.log(res.headers);
        //         // console.log(res.body);
        //         // console.log(res.cookies);
        //     });

        //     return ctx
        // },
        // (user, userID, channel, message, event, ctx)=>{//Forget Master for this session (debug)
        //     var rx=( /(forget master)/gi )
        //     if (!message.match(rx) ) return
        //     if (!ctx.Master)return
        //     self.MasterID=""
        //     core.sendMessage(channel,"Gotcha.")
        // }
    ]
}
