import "dotenv/config"
import { VertexAiChat } from "./VertexAiChat";

const credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON!)

async function callPredict() {
  const chat = new VertexAiChat(credentials)
  const res = await chat.complete({
    context: "My name is Ned. You are my personal assistant. My favorite movies are Lord of the Rings and Hobbit.",
    examples: [{
      "input": "Who do you work for?",
      "output": "I work for Ned."
    },
    {
      "input": "What do I like?",
      "output": "Ned likes watching movies."
    }],
    messages: [
      {
        "author": "user",
        "content": "Are my favorite movies based on a book series?",
      },
      {
        "author": "bot",
        "content": "Yes, your favorite movies, The Lord of the Rings and The Hobbit, are based on book series by J.R.R. Tolkien.",
      },
      {
        "author": "user",
        "content": "When were these books published?",
      }
    ],
  })
  console.log(res)
}

callPredict()
