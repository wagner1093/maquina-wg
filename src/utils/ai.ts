import OpenAI from 'openai';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string;

export const hasOpenAIKey = () => !!API_KEY;

export async function generateWithAI(prompt: string, systemPrompt?: string): Promise<string> {
  if (!API_KEY) throw new Error('VITE_OPENAI_API_KEY não configurada no arquivo .env');

  const client = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true,  // aceitável para uso pessoal local
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content ?? 'Sem resposta.';
}
