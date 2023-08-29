import "dotenv/config"
import { VertexAiChat } from "./VertexAiChat";
import readline from "readline"

const credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON!)

async function main() {
  const chat = new VertexAiChat(credentials)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  const messages = [] as { author: string, content: string }[]
  while (true) {
    const input = await new Promise<string>(resolve => rl.question("> ", resolve))
    const message = {
      author: "user",
      content: input,
    }
    messages.push(message)
    const res = await chat.complete({
      messages,
    })
    if (!res) {
      throw new Error("No response from the server")
    }
    messages.push({
      author: "bot",
      content: res.content,
    })
    console.log(`bot: ${res.content}`)
  }
}

main()