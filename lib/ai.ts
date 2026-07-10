// Server-only module: uses ANTHROPIC_API_KEY, must never be imported from client components.
import type { BusinessKnowledge, EscalationReason } from './types';

export interface AiAnswer {
  reply: string;
  escalate: boolean;
  escalationReason?: EscalationReason;
}

const MEDICAL_KEYWORDS = ['כואב', 'כאב', 'דם', 'דימום', 'נפיחות', 'חירום', 'קדחת', 'חום גבוה', 'מוגלה'];
const COMPLAINT_KEYWORDS = ['תלונה', 'מאוכזב', 'לא מרוצה', 'רוצה החזר', 'תביעה'];

function detectEscalation(question: string): EscalationReason | null {
  const q = question.toLowerCase();
  if (MEDICAL_KEYWORDS.some(k => q.includes(k))) return 'medical_concern';
  if (COMPLAINT_KEYWORDS.some(k => q.includes(k))) return 'complaint';
  if (q.includes('לתאם') || q.includes('לשנות תור') || q.includes('לדחות')) return 'reschedule';
  return null;
}

function knowledgeSystemPrompt(knowledge: BusinessKnowledge, clinicName: string): string {
  const faqBlock = knowledge.faqs.map(f => `ש: ${f.question}\nת: ${f.answer}`).join('\n\n');
  const voiceBlock = knowledge.voiceExamples
    .map(v => `לקוח: ${v.patientMsg}\nתגובה מאושרת: ${v.approvedReply}`)
    .join('\n\n');
  return [
    `את/ה עוזר/ת AI במרפאה "${clinicName}". ענה/י בעברית, בטון חם ואנושי, קצר וממוקד.`,
    knowledge.hours ? `שעות פעילות: ${knowledge.hours}` : '',
    knowledge.doctors ? `רופאים/מטפלים: ${knowledge.doctors}` : '',
    knowledge.services ? `שירותים: ${knowledge.services}` : '',
    knowledge.pricingNotes ? `הערות מחיר: ${knowledge.pricingNotes}` : '',
    knowledge.insurance ? `ביטוחים: ${knowledge.insurance}` : '',
    knowledge.policies ? `מדיניות: ${knowledge.policies}` : '',
    faqBlock ? `שאלות נפוצות:\n${faqBlock}` : '',
    voiceBlock ? `דוגמאות לסגנון הדיבור של המרפאה (חקה את הטון הזה):\n${voiceBlock}` : '',
    'לעולם אל תיתן ייעוץ רפואי או אבחנה. אם השאלה עוסקת בכאב, דימום, סיבוך רפואי, תלונה, או משהו שדורש שיקול דעת רפואי — סרב בעדינות וציין שאיש צוות יחזור בהקדם.',
  ].filter(Boolean).join('\n\n');
}

async function callClaude(system: string, userMessage: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    return typeof text === 'string' ? text : null;
  } catch {
    return null;
  }
}

function cannedAnswer(question: string, knowledge: BusinessKnowledge): string {
  const q = question.trim().toLowerCase();
  const match = knowledge.faqs.find(f => q.includes(f.question.toLowerCase()) || f.question.toLowerCase().includes(q.slice(0, 10)));
  if (match) return match.answer;
  if (knowledge.hours && (q.includes('שעות') || q.includes('פתוח'))) return `שעות הפעילות שלנו: ${knowledge.hours}`;
  return 'תודה על הפנייה! קיבלנו את ההודעה ואחד מהצוות יחזור אליך בהקדם עם תשובה מדויקת.';
}

/** Answers a patient question, grounded in the clinic's knowledge base + learned voice. Escalates on low confidence or clinical content. */
export async function answerPatient(question: string, knowledge: BusinessKnowledge, clinicName: string): Promise<AiAnswer> {
  const escalationReason = detectEscalation(question);
  if (escalationReason === 'medical_concern') {
    return {
      reply: 'תודה שכתבת לנו — בנושאים רפואיים חשוב שאיש צוות יחזור אליך אישית. העברנו את הפנייה וניצור קשר בהקדם.',
      escalate: true,
      escalationReason,
    };
  }

  const system = knowledgeSystemPrompt(knowledge, clinicName);
  const live = await callClaude(system, question);
  const reply = live ?? cannedAnswer(question, knowledge);

  return { reply, escalate: escalationReason != null, escalationReason: escalationReason ?? undefined };
}

/** Simulation trainer — AI plays the clinic, replying to a clinic-authored "patient" message. */
export async function simulateReply(patientMessage: string, knowledge: BusinessKnowledge, clinicName: string): Promise<string> {
  const system = knowledgeSystemPrompt(knowledge, clinicName);
  const live = await callClaude(system, patientMessage);
  return live ?? cannedAnswer(patientMessage, knowledge);
}
