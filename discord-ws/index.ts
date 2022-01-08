import { WebSocketClient, StandardWebSocketClient } from "https://deno.land/x/websocket@v0.1.3/mod.ts"

enum Intents {
  GUILDS = 0,
  GUILD_MEMBERS,
  GUILD_BANS,
  GUILD_EMOJIS_AND_STICKERS,
  GUILD_INTEGRATIONS,
  GUILD_WEBHOOKS,
  GUILD_INVITES,
  GUILD_VOICE_STATES,
  GUILD_PRESENCES,
  GUILD_MESSAGES,
  GUILD_MESSAGE_REACTIONS,
  GUILD_MESSAGE_TYPING,
  DIRECT_MESSAGES,
  DIRECT_MESSAGE_REACTIONS,
  DIRECT_MESSAGE_TYPING,
  GUILD_SCHEDULED_EVENTS
}

interface Keyable {
  [key: string]: any
}

interface Callback {
  (data: Keyable): void
}

interface ListenerOptions {
  Token: string;
  Logging?: boolean;
  Intents: Intents[];
  Properties?: {
    "$os": "Windows",
    "$device": "discord-ws",
    "$browser": "discord-ws"
  }
}

class Listener {
  HeartbeatInfo: { Worker: number; Interval: number; Key: number }
  Callbacks: { [key: string]: Callback }
  WebSocket?: WebSocketClient
  Options: ListenerOptions

  SendMessage(opcode: number, data: any ) {
    if( this.WebSocket === undefined || this.WebSocket.isClosed ) return;
    let socketMessage = { op: opcode, d: data }
    this.WebSocket.send( JSON.stringify( socketMessage ) )
    if( !this.Options.Logging ) return;
    console.log("---SENDING")
    console.log(socketMessage)
  }

  ProcessMessage(opcode: number, data?: Keyable ) {
    if( this.WebSocket === undefined || this.WebSocket.isClosed ) return;
    data = data || {};

    this.HeartbeatInfo.Key = ( data.s || this.HeartbeatInfo.Key ) as number;

    switch(opcode) {
      case 0: // Dispatch
        if( this.Callbacks[data.t] !== undefined ) {
          this.Callbacks[data.t](data.d)
        }

        break

      case 1: // Heartbeat
        if(this.HeartbeatInfo.Worker) clearTimeout(this.HeartbeatInfo.Worker);
        this.HeartbeatInfo.Worker = setTimeout(() => this.ProcessMessage(1), this.HeartbeatInfo.Interval)
        this.SendMessage(1, this.HeartbeatInfo.Key)
        break

      case 2: //Identify
        let intentCode = 0;
        this.Options.Intents.forEach( bitFlag => intentCode |= 1 << bitFlag )

        this.SendMessage(2, {
          intents: intentCode,
          token: this.Options.Token,
          properties: this.Options.Properties,
        });

        break

      case 9: // Session Invalidated
        console.log("Session Invalidated!")
        this.WebSocket.close(0)
        break

      case 10: //Hello
        this.HeartbeatInfo.Interval = data.d.heartbeat_interval
        this.HeartbeatInfo.Worker = setTimeout(() => this.ProcessMessage(1), this.HeartbeatInfo.Interval)
        this.ProcessMessage(2)
        break

      default:
        if( this.Options.Logging ){
          console.log(`--Unhandled ${opcode}`)
        }
    }
  }

  Register(eventName: string, callback: Callback ){
    this.Callbacks[eventName] = callback
  }

  constructor( options: ListenerOptions ) {
    this.HeartbeatInfo = {Worker: 0, Interval:10000, Key: 0}
    this.Options = options
    this.Callbacks = {}

    if( this.Options.Properties === undefined ){
      this.Options.Properties = {
        $browser: "discord-ws",
        $device: "discord-ws",
        $os: "Windows",
      }
    }

    fetch("https://discord.com/api/gateway")
      .then( x => x.json() )
      .then( x => {
        this.WebSocket = new StandardWebSocketClient(`${x.url}/?v=9&encoding=json`);

        this.WebSocket.on('message', ( message: any ) => {
          let rawMessage: Keyable = JSON.parse( message.data )
          this.ProcessMessage( rawMessage.op as number, rawMessage)
          if( !this.Options.Logging ) return;

          console.log(`--- Received ${rawMessage.op}`)
          console.log(rawMessage)
        } )
      } )
  }
}