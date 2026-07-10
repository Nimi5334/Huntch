import { NextRequest, NextResponse } from 'next/server';
import { simulateReply } from '@/lib/ai';
import type { BusinessKnowledge } from '@/lib/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { patientMsg, knowledge, clinicName } = body as { patientMsg: string; knowledge: BusinessKnowledge; clinicName: string };

  if (!patientMsg || !knowledge) {
    return NextResponse.json({ error: 'missing patientMsg or knowledge' }, { status: 400 });
  }

  const reply = await simulateReply(patientMsg, knowledge, clinicName ?? 'המרפאה');
  return NextResponse.json({ reply });
}
