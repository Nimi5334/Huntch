import type { Patient } from './types';

export interface BillingSummary {
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
}

export function billingSummary(patient: Patient): BillingSummary {
  const totalBilled = patient.treatments.reduce((s, t) => s + t.cost, 0);
  const totalPaid = patient.payments.reduce((s, p) => s + p.amount, 0);
  return { totalBilled, totalPaid, outstanding: Math.max(0, totalBilled - totalPaid) };
}
