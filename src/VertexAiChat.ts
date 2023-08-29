import { helpers, PredictionServiceClient } from "@google-cloud/aiplatform"
import { Type, Static } from "@sinclair/typebox"
import { validate } from "jsonschema"

const PredictionSchema = Type.Object({
  citationMetadata: Type.Array(Type.Object({
    citations: Type.Array(Type.String()),
  })),
  safetyAttributes: Type.Array(Type.Object({
    blocked: Type.Boolean(),
    scores: Type.Array(Type.Number()),
    categories: Type.Array(Type.String()),
  })),
  candidates: Type.Array(Type.Object({
    author: Type.String(),
    content: Type.String(),
  })),
})

type Prediction = Static<typeof PredictionSchema>

function isPrediction(value: unknown): value is Prediction {
  const r = validate(value, PredictionSchema)
  return r.valid
}

type Prompt = {
  context?: string,
  examples?: {
    input: {
      content: string,
    },
    output: {
      content: string,
    }
  }[],
  messages: {
    author: string,
    content: string,
  }[]
}

export class VertexAiChat {
  client: PredictionServiceClient
  endpoint: string

  constructor(credentials: object) {
    this.client = new PredictionServiceClient({
      apiEndpoint: "us-central1-aiplatform.googleapis.com",
      credentials,
    });
    if (!("project_id" in credentials)) {
      throw new Error("Missing project_id in credentials")
    }
    const projectId = credentials.project_id
    const publisher = "google"
    const model = "chat-bison@001"
    this.endpoint = `projects/${projectId}/locations/us-central1/publishers/${publisher}/models/${model}`;
  }

  async complete(req: {
    context?: string,
    examples?: {
      input: string,
      output: string,
    }[],
    messages: {
      author: string,
      content: string,
    }[]
  }) {
    const prompt: Prompt = {
      messages: req.messages,
    }
    if (req.context) {
      prompt.context = req.context
    }
    if (req.examples) {
      prompt.examples = req.examples.map(example => ({
        input: { content: example.input },
        output: { content: example.output },
      }))
    }
    const instanceValue = helpers.toValue(prompt)
    const instances = [instanceValue];
    const parameter = {
      temperature: 0.2,
      maxOutputTokens: 256,
      topP: 0.95,
      topK: 40,
    };
    const parameters = helpers.toValue(parameter);
    const request = {
      endpoint: this.endpoint,
      instances,
      parameters,
    }
    // Predict request
    const [response] = await this.client.predict(request as any);
    if (!response.predictions) {
      throw new Error("Missing predictions");
    }
    for (const p of response.predictions) {
      const prediction = helpers.fromValue(p as any)
      if (!isPrediction(prediction)) {
        continue
      }
      for (const candidate of prediction.candidates) {
        return candidate
      }
    }
    return null
  }
}