import { TOKEN_PRICE_USD_PER_MILLION } from "./plans";

export type ChatMessage = {
  role: string;
  content: string | Array<{ type: string; text?: string }>;
};

export function estimateTokens(messages: ChatMessage[], maxTokens = 500) {
  const promptChars = messages.reduce((sum, message) => {
    if (typeof message.content === "string") return sum + message.content.length;
    return sum + message.content.reduce((inner, part) => inner + (part.text?.length ?? 0), 0);
  }, 0);
  const inputTokens = Math.max(1, Math.ceil(promptChars / 4));
  const outputTokens = Math.max(1, maxTokens);
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens
  };
}

export function tokensToUsd(tokens: number) {
  return (tokens * TOKEN_PRICE_USD_PER_MILLION) / 1_000_000;
}
