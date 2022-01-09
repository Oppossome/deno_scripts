## About
DiscordWS is a microscopic discord event subscriber, allowing you to easily subscribe to events on the discord API.

## Usage

### Example Usage 
 ```js
import {DiscordWS, Intents} from "https://raw.githubusercontent.com/Oppossome/deno_scripts/main/discord-ws/index.ts"

let Client = new DiscordWS({
  Intents: [Intents.GUILDS, Intents.GUILD_BANS, Intents.GUILD_MESSAGES],
  Token: "Your bot's discord token",
  //Logging: true // Uncomment if you want to see DiscordWS prints
})

Client.Register("MESSAGE_CREATE", (data) => {
  console.log(`Message recieved "${data.content}" by ${data.author.username}`)
})
```

## API

### Constructor Arguments
| Name | Purpose |
| - | - |
| Token | A valid discord token |
| Logging | Enable debug logging |
| [Intents](https://discord.com/developers/docs/topics/gateway#gateway-intents) | An array of discord API Intents |
| [Properties](#properties) | Required discord platform Information| 

### Properties 
Stores relevant platform information

| Name | Default | Purpose |
| - | - | - |
| $os | Windows | Operating system |
| $device | discordws | Type of device |
| $browser | discordws | Current browser |

### DiscordWS.Register

| Argument | Purpose |
| - | - |
| Event Name | [The callback will be fired when the event matches](https://discord.com/developers/docs/topics/gateway#commands-and-events-gateway-events) |
| Callback | A method that takes one argument ( data ) |
