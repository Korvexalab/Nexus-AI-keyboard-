/**
 * Milestone 2: Fast AI Reply Styles.
 * Supported reply tones for one-tap smart generation.
 */
export type AiReplyStyle = 'reply' | 'friendly' | 'short' | 'professional' | 'funny';

export interface StyleOption {
  id: AiReplyStyle;
  label: string;
}

export const AI_REPLY_STYLES: StyleOption[] = [
  { id: 'reply', label: 'Reply' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'short', label: 'Short' },
  { id: 'professional', label: 'Professional' },
  { id: 'funny', label: 'Funny' }
];

/**
 * Milestone 2 — Fast AI Reply Generator.
 *
 * Provides structured mock generation logic for testing the compact UI interaction
 * and direct InputConnection insertion.
 * Designed with a clean modular interface so it can be seamlessly replaced with
 * the real Gemini generation function in subsequent milestone prompts.
 *
 * Completely client-side, zero network calls, zero AI tokens required.
 */
export const AiReplyGenerator = {
  generateMockReply(style: AiReplyStyle, customPrompt = ''): string {
    const prompt = customPrompt.trim();

    if (prompt) {
      switch (style) {
        case 'reply':
          return `Thanks for reaching out! Regarding '${prompt}', I'll get back to you shortly.`;
        case 'friendly':
          return `Hey there! That sounds awesome (${prompt}), can't wait! 😊✨`;
        case 'short':
          return `Got it (${prompt}) — on it!`;
        case 'professional':
          return `Thank you for the update. With regard to '${prompt}', I have reviewed the details and will follow up accordingly.`;
        case 'funny':
          return `Say no more! Working my magic on '${prompt}' as we speak! 😂🚀`;
        default:
          return `Sounds good! I'll get back to you shortly.`;
      }
    } else {
      switch (style) {
        case 'reply':
          return "Sounds good! I'll get back to you shortly.";
        case 'friendly':
          return "Hey there! That sounds awesome, can't wait to catch up! 😊";
        case 'short':
          return "Sounds good, thanks!";
        case 'professional':
          return "Thank you for the update. I have reviewed the details and will proceed accordingly.";
        case 'funny':
          return "Plot twist: I actually agree with you on this one! 😂";
        default:
          return "Sounds good! I'll get back to you shortly.";
      }
    }
  }
};
