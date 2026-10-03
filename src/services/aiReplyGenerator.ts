/**
 * Milestone 2 — AI Command Center Actions & Personas.
 *
 * Clean state model and mock generator abstraction preparing for future Gemini integration.
 * No network calls, no API keys, pure client-side mock logic.
 */

export type AiActionId = 'reply' | 'ask_ai' | 'continue' | 'start' | 'rewrite' | 'create';

export interface AiActionOption {
  id: AiActionId;
  label: string;
  icon: string;
  isPrimary: boolean;
  description: string;
}

export const AI_PRIMARY_ACTIONS: AiActionOption[] = [
  { id: 'reply', label: 'Reply', icon: '💬', isPrimary: true, description: 'Generate a response to the provided context' },
  { id: 'ask_ai', label: 'Ask AI', icon: '🧠', isPrimary: true, description: 'Directly question or instruct the AI' },
  { id: 'continue', label: 'Continue', icon: '🔄', isPrimary: true, description: 'Keep an existing conversation going naturally' },
  { id: 'start', label: 'Start', icon: '✨', isPrimary: true, description: 'Create an opening message or conversation starter' },
];

export const AI_SECONDARY_ACTIONS: AiActionOption[] = [
  { id: 'rewrite', label: 'Rewrite', icon: '✏️', isPrimary: false, description: 'Rewrite context in the selected persona' },
  { id: 'create', label: 'Create', icon: '➕', isPrimary: false, description: 'Create a new draft message based on instructions' },
];

export const ALL_AI_ACTIONS: AiActionOption[] = [...AI_PRIMARY_ACTIONS, ...AI_SECONDARY_ACTIONS];

export type AiPersonaId = 'friendly' | 'professional' | 'funny' | 'short' | 'natural';

export interface AiPersonaOption {
  id: AiPersonaId;
  name: string;
  icon: string;
  description: string;
}

export const AI_TEMPORARY_PERSONAS: AiPersonaOption[] = [
  { id: 'friendly', name: 'Friendly', icon: '😊', description: 'Warm, conversational, and encouraging tone' },
  { id: 'professional', name: 'Professional', icon: '💼', description: 'Formal, polite, and business-appropriate tone' },
  { id: 'funny', name: 'Funny', icon: '😂', description: 'Witty, humorous, and light-hearted tone' },
  { id: 'short', name: 'Short', icon: '⚡', description: 'Direct, concise, 1-2 sentence response' },
  { id: 'natural', name: 'Natural', icon: '💬', description: 'Casual, relaxed everyday messenger tone' },
];

/**
 * Backward compatibility type for earlier references
 */
export type AiReplyStyle = AiPersonaId | 'reply';
export const AI_REPLY_STYLES = AI_TEMPORARY_PERSONAS.map(p => ({ id: p.id, label: p.name }));

/**
 * Request payload structure preparing for future Gemini integration
 */
export interface AiGenerateRequest {
  action: AiActionId;
  persona: AiPersonaId;
  context: string;
  instruction?: string;
}

/**
 * Generator abstraction interface.
 * UI depends on this contract, not directly on Gemini.
 */
export interface ReplyGenerator {
  generate(request: AiGenerateRequest): string;
  generateAskAi(question: string, persona: AiPersonaId): string;
}

/**
 * Mock generator implementation for Milestone 2.
 */
export class MockReplyGenerator implements ReplyGenerator {
  generate(request: AiGenerateRequest): string {
    const { action, persona, context } = request;
    const trimmed = context.trim();
    const hasContext = trimmed.length > 0;

    switch (action) {
      case 'reply':
        switch (persona) {
          case 'friendly':
            return hasContext
              ? `Hey there! Regarding '${trimmed}', that sounds wonderful! 😊✨`
              : "Hey there! That sounds awesome, can't wait! 😊";
          case 'professional':
            return hasContext
              ? `Thank you for the update. With regard to '${trimmed}', I have reviewed the details and will proceed accordingly.`
              : "Thank you for reaching out. I have reviewed the matter and will follow up accordingly.";
          case 'funny':
            return hasContext
              ? `Say no more! Working my magic on '${trimmed}' as we speak! 😂🚀`
              : "Plot twist: I actually agree with you on this one! 😂";
          case 'short':
            return hasContext ? `Got it (${trimmed}) — on it!` : "Sounds good, thanks!";
          case 'natural':
            return hasContext ? `Yeah sounds good! Looking into '${trimmed}' now.` : "Sounds good to me, talk soon!";
        }

      case 'continue':
        switch (persona) {
          case 'friendly':
            return hasContext
              ? `Totally with you on '${trimmed}'! How should we tackle the next steps together? 🙌`
              : "That makes a lot of sense! How did the rest of it go? 😊";
          case 'professional':
            return hasContext
              ? `Building upon '${trimmed}', we should coordinate our subsequent milestones.`
              : "Following up on our earlier discussion, let us establish the timeline.";
          case 'funny':
            return hasContext
              ? `And just when you thought '${trimmed}' was settled... boom, part two! 🍿`
              : "And then what happened? The suspense is killing me! 🍿";
          case 'short':
            return hasContext ? `Next step on '${trimmed}':` : "Agreed. What is next?";
          case 'natural':
            return hasContext ? `Yeah, and about '${trimmed}', I was thinking we could follow up tomorrow.` : "Totally. What are you thinking for the next move?";
        }

      case 'start':
        switch (persona) {
          case 'friendly':
            return hasContext
              ? `Hey! Hope your day is going great! Quick question about '${trimmed}' 😊`
              : "Hey! Hope you are having a wonderful day! 😊";
          case 'professional':
            return hasContext
              ? `Good day. I am writing to initiate our discussion regarding '${trimmed}'.`
              : "Good day. I hope this message finds you well.";
          case 'funny':
            return hasContext
              ? `Knock knock! Who is there? Me, asking about '${trimmed}' 😂`
              : "Knock knock! Just dropping in to say hi! 👋";
          case 'short':
            return hasContext ? `Hi — quick note regarding '${trimmed}':` : "Hi, reaching out briefly:";
          case 'natural':
            return hasContext ? `Hey! Was just thinking about '${trimmed}'.` : "Hey! How is everything going?";
        }

      case 'rewrite':
        switch (persona) {
          case 'friendly':
            return hasContext ? `Here is a warmer take: '${trimmed}' — let's make it happen! 😊` : "Let's make it happen! 😊";
          case 'professional':
            return hasContext ? `Formal revision: Please be advised regarding '${trimmed}'.` : "Please note the formal update as requested.";
          case 'funny':
            return hasContext ? `Spiced-up version: '${trimmed}' (now with 200% more pizzazz) 🎉` : "Now with 200% more pizzazz! 🎉";
          case 'short':
            return hasContext ? `'${trimmed}' (condensed)` : "Noted.";
          case 'natural':
            return hasContext ? `Rewritten naturally: '${trimmed}'` : "Sounds good!";
        }

      case 'create':
        switch (persona) {
          case 'friendly':
            return hasContext ? `Here is a fun draft on '${trimmed}'! ✨ What do you think?` : "Here is a friendly draft to share! ✨";
          case 'professional':
            return hasContext ? `Proposal draft regarding '${trimmed}'. Please review.` : "Draft proposal prepared for review.";
          case 'funny':
            return hasContext ? `Brand new masterpiece inspired by '${trimmed}' 🎨` : "Hot off the press! 📰🔥";
          case 'short':
            return hasContext ? `Draft (${trimmed}): Ready.` : "Draft ready.";
          case 'natural':
            return hasContext ? `Put together a quick message about '${trimmed}'.` : "Here is a quick draft for you.";
        }

      case 'ask_ai':
        return this.generateAskAi(trimmed, persona);

      default:
        return hasContext ? `Regarding '${trimmed}', all set!` : "Sounds good!";
    }
  }

  generateAskAi(question: string, persona: AiPersonaId): string {
    const q = question.trim();
    if (!q) {
      return "Ask me anything or provide an instruction!";
    }
    switch (persona) {
      case 'professional':
        return `Analysis for "${q}": Based on the inquiry, the recommended approach is to outline clear objectives, align stakeholder expectations, and proceed methodically.`;
      case 'funny':
        return `According to my calculations on "${q}": 42! Just kidding — definitely go for it, but remember to bring snacks! 🍕✨`;
      case 'short':
        return `"${q}" — Summary: Verified and recommended.`;
      case 'natural':
        return `On "${q}": I'd recommend keeping it simple and straightforward.`;
      case 'friendly':
      default:
        return `Great question about "${q}"! Here is a helpful breakdown: you can achieve this by breaking the goal into simple steps and tackling the most important piece first! 😊✨`;
    }
  }
}

export const defaultAiGenerator = new MockReplyGenerator();

/**
 * Backward compatibility facade
 */
export const AiReplyGenerator = {
  generateMockReply(style: string, customPrompt = ''): string {
    const persona = (['friendly', 'professional', 'funny', 'short', 'natural'].includes(style)
      ? style
      : 'friendly') as AiPersonaId;
    return defaultAiGenerator.generate({
      action: 'reply',
      persona,
      context: customPrompt,
    });
  }
};
