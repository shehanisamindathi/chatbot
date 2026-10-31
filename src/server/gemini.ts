import { GoogleGenAI } from '@google/genai';

// Initialize the shared Gemini client utility on the server
// Header 'User-Agent': 'aistudio-build' is required for AI Studio telemetry
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

// OpenRouter streaming function using standard OpenAI SSE format
async function* streamOpenRouter(params: {
  systemPrompt?: string;
  history: ChatHistoryItem[];
  userMessage: string;
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return;

  const messages: { role: string; content: string }[] = [];
  if (params.systemPrompt) {
    messages.push({ role: 'system', content: params.systemPrompt });
  }
  for (const item of params.history) {
    messages.push({ role: item.role, content: item.content });
  }
  messages.push({ role: 'user', content: params.userMessage });

  const candidateModels = [
    'nvidia/nemotron-3.5-lightning:free',
    'google/gemma-4-26b-a4b-it:free',
    'liquid/lfm-2.5-2.6b:free',
  ];

  let activeStreamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let lastError = '';

  for (const model of candidateModels) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ais-dev.run.app',
          'X-Title': 'MERN ChatBot Pro',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorJson: any = await response.json().catch(() => ({}));
        lastError = errorJson?.error?.message || `HTTP ${response.status}`;
        continue; // Try next candidate free model
      }

      if (response.body) {
        activeStreamReader = response.body.getReader();
        break;
      }
    } catch (err: any) {
      lastError = err.message || 'Network error';
    }
  }

  if (!activeStreamReader) {
    yield `\n\n> ⚠️ **OpenRouter Status**: ${lastError || 'Free model providers currently busy'}.`;
    return;
  }

  const reader = activeStreamReader;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (dataStr === '[DONE]') return;
        try {
          const parsed = JSON.parse(dataStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // Ignore JSON parse errors for keep-alive lines
        }
      }
    }
  }
}

export async function* streamGeminiResponse(params: {
  model?: string;
  systemPrompt?: string;
  history: ChatHistoryItem[];
  userMessage: string;
}) {
  const model = params.model || 'gemini-3.8-flash';
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  // If Gemini key is available, stream via Google GenAI SDK
  if (hasGeminiKey) {
    const contents = [
      ...params.history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: params.userMessage }],
      },
    ];

    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          ...(params.systemPrompt ? { systemInstruction: params.systemPrompt } : {}),
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
      return;
    } catch (error: any) {
      console.error('[Gemini API Server Error]:', error);
      const errorMessage = error?.message || 'Error communicating with Gemini AI';

      if (!process.env.OPENROUTER_API_KEY) {
        yield `\n\n> ⚠️ **Inference Notice**: ${errorMessage}\n> *You can select or attach a Gemini API key in the **Settings > Secrets** panel.*`;
        return;
      }
    }
  }

  // Fallback to OpenRouter if configured
  if (process.env.OPENROUTER_API_KEY) {
    yield* streamOpenRouter(params);
    return;
  }

  yield `\n\n> ⚠️ **API Key Setup**: Please configure your **GEMINI_API_KEY** in the **Settings > Secrets** panel or provide an active OpenRouter key in \`.env\`.`;
}
