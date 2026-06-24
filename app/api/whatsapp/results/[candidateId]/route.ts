/**
 * GET /api/whatsapp/results/:candidateId
 *
 * Returns the completed DNA Feeder interview result for a given candidate.
 * Used by the candidate profile page to overlay cold-start DNA data.
 *
 * Returns 404 if the candidate hasn't completed the interview yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { interviewResults } from '@/lib/whatsapp-session';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ candidateId: string }> }
) {
  const { candidateId } = await context.params;
  const result = interviewResults.get(candidateId);

  if (!result) {
    return NextResponse.json({ error: 'No interview data found for this candidate' }, { status: 404 });
  }

  return NextResponse.json(result);
}
