import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize GoogleGenAI client with official telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Centralized model configuration (M3.0 Requirement 2)
// Primary fast flash model with active quota, plus automatic fallback models
const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];
const GEMINI_MODEL = CANDIDATE_MODELS[0];

/**
 * Builds dynamic persona guidance matching Milestone 3.0 specification.
 * Personas are prompt variations, not separate models.
 */
function buildPersonaPrompt(persona: string): string {
  switch (persona) {
    case 'friendly':
      return 'Persona: Friendly. Tone must be warm, natural, conversational, and genuinely human. Avoid unnecessary formality and stiff corporate speak. You may include a subtle friendly emoji if natural.';
    case 'freelancer':
      return 'Persona: Freelancer. Tone must be professional, concise, client-friendly, confident, proactive, and natural.';
    case 'professional':
      return 'Persona: Professional. Tone must be polished, clear, articulate, professional, and concise. Never sound stiff, bureaucratic, or robotic.';
    case 'funny':
      return 'Persona: Funny. Tone must be playful, witty, and humorous in a natural everyday way. Avoid forcing jokes.';
    case 'short':
      return 'Persona: Short. Tone must be ultra-concise, direct, and minimal. 1 short sentence or brief phrase only.';
    case 'natural':
      return 'Persona: Natural. Tone must be casual, relaxed everyday messenger tone. Like chatting with a close colleague or friend.';
    case 'romantic':
      return 'Persona: Romantic. Tone must be affectionate, heartfelt, sweet, and caring.';
    default:
      return 'Persona: Friendly and natural conversational tone.';
  }
}

/**
 * Builds dynamic task instructions based on action and context.
 */
function buildActionInstruction(action: string, context: string, instruction?: string): string {
  const trimmed = (context || '').trim();
  const hasContext = trimmed.length > 0;

  switch (action) {
    case 'reply':
      if (hasContext) {
        return `Task: Generate a direct, conversational reply to the message or draft: "${trimmed}".`;
      }
      return 'Task: Generate a natural conversational reply or follow-up.';

    case 'rewrite':
      if (hasContext) {
        return `Task: Rewrite the user's text: "${trimmed}". Preserve the exact meaning while expressing it in the selected persona.`;
      }
      return 'Task: Provide a natural friendly message.';

    case 'continue':
      if (hasContext) {
        return `Task: Continue the user's message naturally: "${trimmed}". Complete the thought or sentence seamlessly without changing the original intent.`;
      }
      return 'Task: Continue the conversation with a natural next step.';

    case 'start':
      if (hasContext) {
        return `Task: Generate an opening message or conversation starter about: "${trimmed}".`;
      }
      return 'Task: Generate a natural opening conversation starter.';

    case 'create':
      if (hasContext || instruction) {
        return `Task: Draft a message based on the topic/instruction: "${instruction || trimmed}".`;
      }
      return 'Task: Create a versatile friendly draft message.';

    default:
      return `Task: Generate a message related to "${trimmed}".`;
  }
}

function formatGeminiErrorMessage(err: any): string {
  const msg = err?.message || String(err || '');
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand')) {
    return 'Gemini is currently experiencing high demand. Please tap retry in a few moments.';
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
    return 'Gemini rate limit reached. Please wait a moment and tap retry.';
  }
  if (msg.includes('timed out') || msg.includes('timeout')) {
    return 'Gemini request timed out. Please tap retry.';
  }
  return 'Unable to generate response with Gemini. Please tap retry.';
}

async function callGeminiWithTimeout(
  prompt: string,
  config: Record<string, any> = {},
  timeoutMs = 20000
): Promise<any> {
  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    let timer: NodeJS.Timeout | undefined;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Gemini API call timed out')), timeoutMs);
      });

      const callPromise = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
      });

      const result = await Promise.race([callPromise, timeoutPromise]);
      if (timer) clearTimeout(timer);
      return result;
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      lastError = err;
      const msg = err?.message || String(err || '');
      // If 429 quota exhausted or 503 unavailable, try next candidate model
      if (
        msg.includes('429') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota') ||
        msg.includes('503') ||
        msg.includes('not found') ||
        msg.includes('404')
      ) {
        console.warn(`Model ${modelName} encountered: ${msg.slice(0, 120)}. Attempting fallback candidate...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All candidate Gemini models failed.');
}

/**
 * Intelligent persona-aware heuristic fallback for when offline or network fails.
 */
function generateFallbackSuggestions(action: string, persona: string, context: string): string[] {
  const trimmed = context.trim();
  if (action === 'rewrite') {
    switch (persona) {
      case 'friendly':
        return trimmed ? ["Hey! What's up? 😊", "Hey, how's it going?", `Hey there! Regarding '${trimmed}', hope you're having a great day! ✨`] : ["Hey! What's up? 😊", "Hey, how's it going?"];
      case 'freelancer':
      case 'professional':
        return trimmed ? [`Following up regarding ${trimmed}.`, `Please review the latest update: '${trimmed}'.`, `Deliverable status: ${trimmed}.`] : ["Reaching out regarding our project milestones.", "Please review the updated deliverables."];
      case 'funny':
        return trimmed ? [`Plot twist: ${trimmed}! 😂`, `Spiced-up version: ${trimmed} 🎉`, `Breaking news: ${trimmed}! 🚀`] : ["Plot twist: wait until you hear this! 😂", "Now with 200% more pizzazz! 🎉"];
      case 'short':
        return trimmed ? [`${trimmed} (updated)`, `Quick note: ${trimmed}`, "All set."] : ["Got it.", "Noted.", "All set."];
      default:
        return trimmed ? [`Rewritten naturally: ${trimmed}`, `Polished version: ${trimmed}`, `Cleaned up: ${trimmed}`] : ["Sounds good!", "Looking forward to it."];
    }
  } else if (action === 'reply') {
    switch (persona) {
      case 'friendly':
        return trimmed ? [`Hey there! Regarding '${trimmed}', that sounds wonderful! 😊✨`, `Totally with you on '${trimmed}'! Let's do it! 🙌`, `Thanks so much for the update on '${trimmed}'! 😊`] : ["Hey there! That sounds awesome, can't wait! 😊", "Sounds wonderful to me! ✨", "Thanks for reaching out!"];
      case 'freelancer':
      case 'professional':
        return trimmed ? [`Thank you for the update on '${trimmed}'. I'll proceed accordingly.`, `Understood regarding '${trimmed}'. I've noted the deliverables.`, `Thanks for sharing. Following up on '${trimmed}'.`] : ["Thanks for reaching out. I will review and proceed accordingly.", "Understood, thank you."];
      case 'funny':
        return trimmed ? [`Say no more! Working my magic on '${trimmed}' as we speak! 😂🚀`, `Challenge accepted for '${trimmed}'! 😂`, `And boom! '${trimmed}' is in motion! 🍿`] : ["Say no more! Working my magic as we speak! 😂", "Plot twist: I actually agree with you!"];
      case 'short':
        return trimmed ? [`Got it (${trimmed}) — on it!`, `Sounds good regarding ${trimmed}.`, "All set, thanks!"] : ["Sounds good, thanks!", "Got it, on it!", "Understood."];
      default:
        return trimmed ? [`Sounds good regarding '${trimmed}'!`, `Got it, thanks for updating on '${trimmed}'.`, "All set!"] : ["Sounds good, talk soon!", "Understood, thank you!"];
    }
  } else if (action === 'continue') {
    return trimmed ? [`${trimmed} so we can align on next steps together.`, `${trimmed} whenever you have a quick moment today.`, `${trimmed} and wrap up the remaining details.`] : ["Let's coordinate on our next milestone.", "Let's catch up whenever you're free."];
  } else if (action === 'start') {
    return trimmed ? [`Hey! Hope you're having a great week. Quick question about '${trimmed}' 😊`, `Hi there! Reaching out regarding '${trimmed}' whenever you have a moment.`, `Hey! Was just thinking about '${trimmed}'. How are things going?`] : ["Hey! Hope you're having a wonderful day! 😊", "Hi there! Just wanted to check in.", "Hey! How is everything going?"];
  } else {
    return trimmed ? [`Draft for '${trimmed}': ready for your review.`, `Here is a fresh take on '${trimmed}'! ✨`, `Quick draft regarding '${trimmed}'.`] : ["Here is a friendly draft to share! ✨", "Draft prepared and ready."];
  }
}

/**
 * API route: POST /api/gemini/generate
 * Handles Writing Actions and Ask AI with real Gemini Flash integration.
 */
app.post('/api/gemini/generate', async (req, res) => {
  const { action = 'reply', persona = 'friendly', context = '', instruction = '', mode = 'action' } = req.body;

  try {
    if (!apiKey) {
      // Intentional offline fallback when no API key is present
      if (mode === 'ask_ai' || action === 'ask_ai') {
        const question = (instruction || context || '').trim();
        return res.json({
          success: true,
          isFallback: true,
          answer: `[Offline Fallback] Here is a helpful suggestion for "${question}": keep it clear, break down your goals, and proceed step by step! 😊`,
          suggestions: [`Suggestion for "${question}"`],
        });
      }
      const suggestions = generateFallbackSuggestions(action, persona, context);
      return res.json({
        success: true,
        isFallback: true,
        text: suggestions[0],
        suggestions,
      });
    }

    const personaGuidance = buildPersonaPrompt(persona);

    // MODE: Ask AI (Q&A mode)
    if (mode === 'ask_ai' || action === 'ask_ai') {
      const question = (instruction || context || '').trim();
      if (!question) {
        return res.json({
          success: true,
          answer: 'Please enter a question or instruction to ask AI.',
          suggestions: [],
        });
      }

      const prompt = `You are an AI assistant integrated directly into a mobile keyboard.
${personaGuidance}

The user is asking: "${question}"

Instructions:
- Provide a direct, helpful, and concise answer.
- Keep it compact and suitable for reading on a mobile keyboard screen (1-3 brief paragraphs maximum).
- Avoid unnecessary introductions like "Sure, here is the answer:".
- Directly answer the question.`;

      try {
        const response = await callGeminiWithTimeout(prompt, { temperature: 0.7 }, 20000);

        const answer = response.text?.trim() || 'No response generated.';
        return res.json({
          success: true,
          isFallback: false,
          answer,
          suggestions: [answer],
        });
      } catch (geminiErr: any) {
        console.warn('Gemini call failed or timed out for Ask AI:', geminiErr?.message || geminiErr);
        return res.status(502).json({
          success: false,
          error: formatGeminiErrorMessage(geminiErr),
        });
      }
    }

    // MODE: Writing Actions (Reply, Rewrite, Continue, Start, Create)
    const actionGuidance = buildActionInstruction(action, context, instruction);

    const prompt = `You are Nexora AI Keyboard's writing assistant.
${personaGuidance}
${actionGuidance}

CRITICAL RULES:
1. Return EXACTLY 3 distinct natural response variations formatted as a valid JSON array of strings:
   ["Variation 1", "Variation 2", "Variation 3"]
2. Output ONLY the JSON array. Do not include markdown codeblocks (\`\`\`json), no introductory text, no explanations, no quotes outside the array.
3. The generated text will be inserted directly into the user's host chat bar or email.
4. DO NOT say "Here is a rewritten version:" or "I hope this helps!". Return only the ready-to-send messages.
5. Natural human responses only. NEVER produce generic robotic phrases like "I have reviewed the matter and will proceed accordingly" unless requested.
6. Preserve the user's core intent.`;

    try {
      const response = await callGeminiWithTimeout(prompt, { temperature: 0.75 }, 20000);

      const rawText = response.text?.trim() || '';

      // Parse JSON array of variations
      let suggestions: string[] = [];
      try {
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestions = parsed.map((s: any) => String(s).trim()).filter(Boolean);
        }
      } catch {
        suggestions = rawText
          .split('\n')
          .map((line: string) => line.replace(/^[-*•\d.]+\s*/, '').replace(/^["']|["']$/g, '').trim())
          .filter((line: string) => line.length > 0);
      }

      if (suggestions.length === 0 && rawText.length > 0) {
        suggestions = [rawText];
      }

      if (suggestions.length === 0) {
        throw new Error('Gemini returned empty or unparseable response.');
      }

      return res.json({
        success: true,
        isFallback: false,
        text: suggestions[0] || '',
        suggestions: suggestions.slice(0, 3),
      });
    } catch (geminiErr: any) {
      console.warn('Gemini call failed or timed out:', geminiErr?.message || geminiErr);
      return res.status(502).json({
        success: false,
        error: formatGeminiErrorMessage(geminiErr),
      });
    }
  } catch (error: any) {
    console.error('Server handling error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while processing request.',
    });
  }
});

// Vite middleware mounting in development, or static serving in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Nexora AI Keyboard Server listening on http://localhost:${PORT}`);
  });
}

startServer();
