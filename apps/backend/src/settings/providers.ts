import { AIProvider } from "../../prisma/client/enums";

export const SUPPORTED_AI_PROVIDERS: readonly AIProvider[] = [
    AIProvider.OPENAI,
    AIProvider.GOOGLE_VERTEX_AI,
    AIProvider.ANTHROPIC,
] as const;

export const DEFAULT_AI_PROVIDER = AIProvider.OPENAI;

const PROVIDER_DISPLAY_NAMES: Record<AIProvider, string> = {
    [AIProvider.OPENAI]: "OpenAI",
    [AIProvider.GOOGLE_VERTEX_AI]: "Google Vertex AI",
    [AIProvider.ANTHROPIC]: "Anthropic",
};

export function getProviderDisplayName(provider: AIProvider): string {
    return PROVIDER_DISPLAY_NAMES[provider];
}
