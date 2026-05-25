import { strict as assert } from 'assert'
import {
  toGeminiContents,
  toOpenAIChatCompletion,
  OpenAIChatMessage,
  GeminiGenerateContentResponse,
} from './geminiChatCompat'

const messages: OpenAIChatMessage[] = [
  { role: 'system', content: 'You are concise.' },
  { role: 'user', content: 'Say hello' },
  { role: 'assistant', content: 'Hello' },
]

const geminiContents = toGeminiContents(messages)
assert.equal(geminiContents.length, 3)
assert.equal(geminiContents[0].role, 'user')
assert.ok(
  geminiContents[0].parts[0].text &&
    geminiContents[0].parts[0].text.indexOf('System instructions:') === 0
)
assert.equal(geminiContents[1].role, 'user')
assert.equal(geminiContents[1].parts[0].text, 'Say hello')
assert.equal(geminiContents[2].role, 'model')
assert.equal(geminiContents[2].parts[0].text, 'Hello')

const geminiResponse: GeminiGenerateContentResponse = {
  candidates: [
    {
      finishReason: 'MAX_TOKENS',
      content: {
        role: 'model',
        parts: [{ text: 'Hi ' }, { text: 'there' }],
      },
    },
  ],
  usageMetadata: {
    promptTokenCount: 3,
    candidatesTokenCount: 2,
    totalTokenCount: 5,
  },
}

const chatCompletion = toOpenAIChatCompletion(geminiResponse, 'gpt-compat')
assert.equal(chatCompletion.object, 'chat.completion')
assert.equal(chatCompletion.model, 'gpt-compat')
assert.equal(chatCompletion.choices[0].message.role, 'assistant')
assert.equal(chatCompletion.choices[0].message.content, 'Hi there')
assert.equal(chatCompletion.choices[0].finish_reason, 'length')
assert.equal(chatCompletion.usage.prompt_tokens, 3)
assert.equal(chatCompletion.usage.completion_tokens, 2)
assert.equal(chatCompletion.usage.total_tokens, 5)

const emptyResponse = toOpenAIChatCompletion({}, 'gpt-compat', 'chatcmpl-fixed')
assert.equal(emptyResponse.id, 'chatcmpl-fixed')
assert.equal(emptyResponse.choices[0].message.content, '')
assert.equal(emptyResponse.choices[0].finish_reason, 'stop')
assert.equal(emptyResponse.usage.total_tokens, 0)

console.log('geminiChatCompat tests passed')
