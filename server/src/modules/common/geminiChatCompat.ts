export type OpenAIChatRole = 'system' | 'user' | 'assistant' | 'tool'

export interface OpenAIChatMessage {
  role: OpenAIChatRole
  content: string
}

export interface GeminiContentPart {
  text?: string
}

export interface GeminiContent {
  role?: 'user' | 'model'
  parts: GeminiContentPart[]
}

export interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: GeminiContent
    finishReason?: string
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
  modelVersion?: string
}

export const toGeminiContents = (messages: OpenAIChatMessage[]): GeminiContent[] => {
  const systemMessages = messages.filter(message => message.role === 'system')
  const nonSystem = messages.filter(message => message.role !== 'system')

  const normalized: GeminiContent[] = nonSystem.map(message => ({
    role: (message.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
    parts: [{ text: message.content }],
  }))

  if (systemMessages.length === 0) {
    return normalized
  }

  return [
    {
      role: 'user',
      parts: [
        {
          text: `System instructions:\n${systemMessages
            .map(message => message.content)
            .join('\n\n')}`,
        },
      ],
    },
    ...normalized,
  ]
}

export const toOpenAIChatCompletion = (
  geminiResponse: GeminiGenerateContentResponse,
  model: string,
  id: string = `chatcmpl-${Date.now()}`
) => {
  const firstCandidate = geminiResponse.candidates && geminiResponse.candidates[0]
  const parts =
    firstCandidate && firstCandidate.content && firstCandidate.content.parts
      ? firstCandidate.content.parts
      : []

  const textContent = parts
    .map(part => part.text || '')
    .join('')
    .trim()

  return {
    id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: textContent,
        },
        finish_reason: normalizeFinishReason(firstCandidate && firstCandidate.finishReason),
      },
    ],
    usage: {
      prompt_tokens:
        (geminiResponse.usageMetadata && geminiResponse.usageMetadata.promptTokenCount) || 0,
      completion_tokens:
        (geminiResponse.usageMetadata && geminiResponse.usageMetadata.candidatesTokenCount) || 0,
      total_tokens:
        (geminiResponse.usageMetadata && geminiResponse.usageMetadata.totalTokenCount) || 0,
    },
  }
}

const normalizeFinishReason = (finishReason?: string): string => {
  if (!finishReason) {
    return 'stop'
  }

  switch (finishReason) {
    case 'STOP':
      return 'stop'
    case 'MAX_TOKENS':
      return 'length'
    case 'SAFETY':
      return 'content_filter'
    default:
      return 'stop'
  }
}
