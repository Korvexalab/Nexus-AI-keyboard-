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

export type AiPersonaId =
  | 'friendly'
  | 'freelancer'
  | 'funny'
  | 'short'
  | 'natural'
  | 'romantic'
  | 'professional';

export interface AiPersonaOption {
  id: AiPersonaId;
  name: string;
  icon: string;
  description: string;
}

export const AI_TEMPORARY_PERSONAS: AiPersonaOption[] = [
  { id: 'friendly', name: 'Friendly', icon: '😊', description: 'Warm, conversational, and encouraging tone' },
  { id: 'freelancer', name: 'Freelancer', icon: '💼', description: 'Clear, efficient, and business-focused tone' },
  { id: 'funny', name: 'Funny', icon: '😂', description: 'Witty, humorous, and light-hearted tone' },
  { id: 'short', name: 'Short', icon: '⚡', description: 'Direct, concise, 1-2 sentence response' },
  { id: 'natural', name: 'Natural', icon: '💬', description: 'Casual, relaxed everyday messenger tone' },
  { id: 'romantic', name: 'Romantic', icon: '❤️', description: 'Affectionate, heartfelt, and sweet tone' },
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
          case 'freelancer':
          case 'professional':
            return hasContext
              ? `Thanks for the details. Regarding '${trimmed}', I'll review and follow up with the deliverables shortly.`
              : "Thanks for reaching out! I've reviewed the scope and will proceed accordingly.";
          case 'funny':
            return hasContext
              ? `Say no more! Working my magic on '${trimmed}' as we speak! 😂🚀`
              : "Plot twist: I actually agree with you on this one! 😂";
          case 'short':
            return hasContext ? `Got it (${trimmed}) — on it!` : "Sounds good, thanks!";
          case 'natural':
            return hasContext ? `Yeah sounds good! Looking into '${trimmed}' now.` : "Sounds good to me, talk soon!";
          case 'romantic':
            return hasContext
              ? `Thinking of you! Regarding '${trimmed}', that makes me smile ❤️`
              : "Thinking of you, hope your day is as sweet as you are! ❤️✨";
          default:
            return hasContext ? `Sounds good regarding '${trimmed}'!` : "Sounds good, talk soon!";
        }

      case 'continue':
        switch (persona) {
          case 'friendly':
            return hasContext
              ? `Totally with you on '${trimmed}'! How should we tackle the next steps together? 🙌`
              : "That makes a lot of sense! How did the rest of it go? 😊";
          case 'freelancer':
          case 'professional':
            return hasContext
              ? `Building upon '${trimmed}', here are the immediate next milestones we should align on.`
              : "Following up on our earlier discussion, let's establish the next delivery milestones.";
          case 'funny':
            return hasContext
              ? `And just when you thought '${trimmed}' was settled... boom, part two! 🍿`
              : "And then what happened? The suspense is killing me! 🍿";
          case 'short':
            return hasContext ? `Next step on '${trimmed}':` : "Agreed. What's next?";
          case 'natural':
            return hasContext ? `Yeah, and about '${trimmed}', I was thinking we could follow up tomorrow.` : "Totally. What are you thinking for the next move?";
          case 'romantic':
            return hasContext
              ? `Can't stop thinking about what you said about '${trimmed}'... tell me more ❤️`
              : "Tell me more, I love hearing about your day ❤️";
          default:
            return hasContext ? `Continuing on '${trimmed}':` : "Agreed, let's keep going!";
        }

      case 'start':
        switch (persona) {
          case 'friendly':
            return hasContext
              ? `Hey! Hope your day is going great! Quick question about '${trimmed}' 😊`
              : "Hey! Hope you are having a wonderful day! 😊";
          case 'freelancer':
          case 'professional':
            return hasContext
              ? `Hi there, reaching out regarding '${trimmed}'. Would you be open to syncing briefly this week?`
              : "Hello, reaching out to connect and discuss potential collaboration opportunities.";
          case 'funny':
            return hasContext
              ? `Knock knock! Who's there? Me, asking about '${trimmed}' 😂`
              : "Knock knock! Just dropping in to say hi! 👋";
          case 'short':
            return hasContext ? `Hi — quick note regarding '${trimmed}':` : "Hi, reaching out briefly:";
          case 'natural':
            return hasContext ? `Hey! Was just thinking about '${trimmed}'.` : "Hey! How is everything going?";
          case 'romantic':
            return hasContext
              ? `Hey sweetheart ❤️ Was just thinking about '${trimmed}' and couldn't help smiling.`
              : "Hey sweetheart, just wanted to send you a little love today ❤️";
          default:
            return hasContext ? `Hi, reaching out about '${trimmed}'.` : "Hello there!";
        }

      case 'rewrite':
        switch (persona) {
          case 'friendly':
            return hasContext ? `Here is a warmer take: '${trimmed}' — let's make it happen! 😊` : "Let's make it happen! 😊";
          case 'freelancer':
          case 'professional':
            return hasContext ? `Deliverable update: '${trimmed}'. Ready for your review.` : "Project update ready for review.";
          case 'funny':
            return hasContext ? `Spiced-up version: '${trimmed}' (now with 200% more pizzazz) 🎉` : "Now with 200% more pizzazz! 🎉";
          case 'short':
            return hasContext ? `'${trimmed}' (condensed)` : "Noted.";
          case 'natural':
            return hasContext ? `Rewritten naturally: '${trimmed}'` : "Sounds good!";
          case 'romantic':
            return hasContext ? `'${trimmed}' — with all my love ❤️` : "With all my love ❤️";
          default:
            return hasContext ? `'${trimmed}' (polished)` : "Sounds good!";
        }

      case 'create':
        switch (persona) {
          case 'friendly':
            return hasContext ? `Here is a fun draft on '${trimmed}'! ✨ What do you think?` : "Here is a friendly draft to share! ✨";
          case 'freelancer':
          case 'professional':
            return hasContext ? `Proposal draft regarding '${trimmed}'. Scope and timeline included.` : "Draft proposal prepared for review.";
          case 'funny':
            return hasContext ? `Brand new masterpiece inspired by '${trimmed}' 🎨` : "Hot off the press! 📰🔥";
          case 'short':
            return hasContext ? `Draft (${trimmed}): Ready.` : "Draft ready.";
          case 'natural':
            return hasContext ? `Put together a quick message about '${trimmed}'.` : "Here is a quick draft for you.";
          case 'romantic':
            return hasContext ? `A heartfelt note about '${trimmed}' just for you ❤️` : "A special note just for you ❤️";
          default:
            return hasContext ? `Draft for '${trimmed}'` : "Draft ready.";
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
      case 'freelancer':
      case 'professional':
        return `Here is a structured suggestion for "${q}":\n• Clarify deliverables and milestones\n• Set concrete timelines and check-in intervals\n• Keep client communication transparent and timely.`;
      case 'funny':
        return `According to my calculations on "${q}": 42! Just kidding — definitely go for it, but remember to bring coffee and snacks! 🍕🚀`;
      case 'short':
        return `"${q}" — Recommended approach: Keep it focused, verify scope, proceed directly.`;
      case 'natural':
        return `On "${q}": Honestly, the simplest way is to keep it straightforward and take it one step at a time.`;
      case 'romantic':
        return `Regarding "${q}": Whatever you decide, follow your heart! You've got this, and I believe in you ❤️✨`;
      case 'friendly':
      default:
        return `Great question about "${q}"! Here is a helpful tip: break down your goal into small actionable chunks, tackle the most impactful piece first, and celebrate your wins along the way! 😊✨`;
    }
  }

  generateSuggestions(request: AiGenerateRequest): string[] {
    const { action, persona, context } = request;
    const trimmed = context.trim();
    const primary = this.generate(request);

    if (action === 'rewrite') {
      if (trimmed) {
        if (persona === 'friendly') {
          return [
            "Hey! What's up?",
            "Hey, how's it going?",
            `Hey there! Hope you are having an awesome day 😊`
          ];
        } else if (persona === 'freelancer' || persona === 'professional') {
          return [
            `Deliverable update: '${trimmed}'. Ready for your review.`,
            `Regarding '${trimmed}': following up with milestone details.`,
            `Please review the latest project update regarding '${trimmed}'.`
          ];
        } else if (persona === 'funny') {
          return [
            `Spiced-up version: '${trimmed}' (now with 200% more pizzazz) 🎉`,
            `Plot twist: '${trimmed}'! 😂`,
            `Breaking news: '${trimmed}'! 🚀`
          ];
        } else if (persona === 'short') {
          return [
            trimmed ? `${trimmed} (updated)` : "Noted.",
            trimmed ? `Quick update: ${trimmed}` : "Got it.",
            "All set."
          ];
        } else if (persona === 'romantic') {
          return [
            `Thinking of you: '${trimmed}' ❤️`,
            `Hey sweetheart, about '${trimmed}' ❤️✨`,
            `Just wanted to send you love: '${trimmed}' 💕`
          ];
        } else {
          return [
            `Rewritten naturally: '${trimmed}'`,
            `Here is a polished take: '${trimmed}'`,
            `Cleaned up: '${trimmed}'`
          ];
        }
      } else {
        return [
          "Let's make it happen! 😊",
          "Looking forward to connecting.",
          "Ready whenever you are!"
        ];
      }
    }

    if (action === 'reply') {
      if (trimmed) {
        if (persona === 'friendly') {
          return [
            primary,
            `Hey! Thanks for the update on '${trimmed}'! 😊`,
            `Sounds awesome! Let's definitely do '${trimmed}'! ✨`
          ];
        } else if (persona === 'freelancer' || persona === 'professional') {
          return [
            primary,
            `Noted regarding '${trimmed}'. I will incorporate this into the current sprint.`,
            `Understood. Proceeding with '${trimmed}' as discussed.`
          ];
        } else if (persona === 'funny') {
          return [
            primary,
            `Say no more, my friend! '${trimmed}' is already in motion! 🚀`,
            `Challenge accepted for '${trimmed}'! 😂`
          ];
        } else if (persona === 'short') {
          return [
            primary,
            "Got it, thanks!",
            "Understood."
          ];
        } else if (persona === 'romantic') {
          return [
            primary,
            `Always brightens my day hearing from you about '${trimmed}' ❤️`,
            `Can't wait to see you! About '${trimmed}', count me in ❤️`
          ];
        } else {
          return [
            primary,
            `Sounds good regarding '${trimmed}'!`,
            `Thanks, got the note on '${trimmed}'.`
          ];
        }
      } else {
        return [
          primary,
          "Sounds wonderful, looking forward to it! 😊",
          "Got it, thanks for letting me know!"
        ];
      }
    }

    if (action === 'continue') {
      return [
        primary,
        trimmed ? `Also, regarding '${trimmed}', how would you like to handle next steps?` : "What do you think should be our next move?",
        trimmed ? `Let's keep the momentum going on '${trimmed}'!` : "Agreed, let's keep going!"
      ];
    }

    if (action === 'start') {
      return [
        primary,
        trimmed ? `Hey! Hope you're having a great week. Quick question on '${trimmed}':` : "Hey! Hope you are having a fantastic day! 😊",
        trimmed ? `Hi! Wanted to touch base regarding '${trimmed}' whenever you have a moment.` : "Hi there! Reaching out to see how things are going."
      ];
    }

    if (action === 'create') {
      return [
        primary,
        trimmed ? `Draft outline on '${trimmed}' ready for your review.` : "Here is a fresh draft ready to go.",
        trimmed ? `Quick note regarding '${trimmed}': all milestones aligned.` : "Draft message prepared."
      ];
    }

    return [primary];
  }
}

export const defaultAiGenerator = new MockReplyGenerator();

/**
 * Backward compatibility facade
 */
export const AiReplyGenerator = {
  generateMockReply(style: string, customPrompt = ''): string {
    const persona = (['friendly', 'freelancer', 'professional', 'funny', 'short', 'natural', 'romantic'].includes(style)
      ? style
      : 'friendly') as AiPersonaId;
    return defaultAiGenerator.generate({
      action: 'reply',
      persona,
      context: customPrompt,
    });
  }
};
