import type { Candidate, Invite, Job, QrScan, EmployeeRequest } from './types';

export interface DailyFeedItem {
  key: string;
  label: string;
  sublabel: string;
  count: number;
  href: string;
  urgency: 'high' | 'medium' | 'low';
}

interface FeedInput {
  today: string;
  pool: Candidate[];
  invites: Invite[];
  jobs: Job[];
  qrScans: QrScan[];
  employeeRequests: EmployeeRequest[];
  featuredJobId: string | null;
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function computeDailyFeed({
  today,
  pool,
  invites,
  jobs,
  qrScans,
  employeeRequests,
  featuredJobId,
}: FeedInput): DailyFeedItem[] {
  // 1. ראיונות לביצוע — מועמדים שאישרו הזמנה (status=responded)
  const responded = invites.filter(i => i.status === 'responded');
  const respondedJobId = responded[0]?.jobId ?? featuredJobId ?? '';

  // 2. חדשים מהברקוד — סריקות QR שנוצרו היום
  const todayScans = qrScans.filter(s => s.scannedAt.startsWith(today));

  // 3. בקשות עובדים — pending בלבד
  const pendingReqs = employeeRequests.filter(r => r.status === 'pending');

  // 4. מועמדים חדשים — נוספו היום לא דרך QR
  const newApplicants = pool.filter(
    c => c.addedAt === today && c.consentSource !== 'qr-scan',
  );

  // 5. פערי משמרות — משמרות ללא כיסוי ממשרות פעילות
  const ALL_SHIFTS = ['morning', 'afternoon', 'evening'] as const;
  let totalGaps = 0;
  jobs.filter(j => j.status === 'active').forEach(job => {
    const required = job.shifts.length > 0 ? job.shifts : [...ALL_SHIFTS];
    const covered = new Set<string>();
    invites
      .filter(i => i.jobId === job.id && i.status === 'responded')
      .map(i => pool.find(c => c.id === i.candidateId))
      .filter(Boolean)
      .forEach(c => c!.availability.shifts.forEach(s => covered.add(s)));
    totalGaps += required.filter(s => !covered.has(s)).length;
  });

  // 6. הזמנות ממתינות — נשלחו לפני 2+ ימים ללא מענה
  const stale = invites.filter(
    i => ['sent', 'delivered'].includes(i.status) && daysSince(i.sentAt) >= 2,
  );
  const staleJobId = stale[0]?.jobId ?? featuredJobId ?? '';

  return [
    {
      key: 'interviews',
      label: 'ראיונות לביצוע',
      sublabel: responded.length > 0
        ? `${responded.length} מועמדים אישרו — קבע ראיון`
        : 'אין מועמדים שאישרו עדיין',
      count: responded.length,
      href: respondedJobId
        ? `/hiring/jobs/${respondedJobId}/responders`
        : '/hiring/jobs',
      urgency: responded.length > 0 ? 'high' : 'low',
    },
    {
      key: 'qr',
      label: 'חדשים מהברקוד',
      sublabel: todayScans.length > 0
        ? `${todayScans.length} נרשמו היום דרך QR`
        : 'אין נרשמים חדשים היום',
      count: todayScans.length,
      href: '/hiring/qr',
      urgency: todayScans.length > 0 ? 'medium' : 'low',
    },
    {
      key: 'requests',
      label: 'בקשות עובדים',
      sublabel: pendingReqs.length > 0
        ? `${pendingReqs.length} בקשות ממתינות לאישור`
        : 'אין בקשות פתוחות',
      count: pendingReqs.length,
      href: '/workforce/requests',
      urgency: pendingReqs.length > 0 ? 'high' : 'low',
    },
    {
      key: 'new-applicants',
      label: 'מועמדים חדשים',
      sublabel: newApplicants.length > 0
        ? `${newApplicants.length} נוספו היום מהטפסים`
        : 'אין מועמדים חדשים היום',
      count: newApplicants.length,
      href: featuredJobId ? `/hiring/jobs/${featuredJobId}` : '/hiring/jobs',
      urgency: newApplicants.length > 0 ? 'medium' : 'low',
    },
    {
      key: 'shift-gaps',
      label: 'פערי משמרות',
      sublabel: totalGaps > 0
        ? `${totalGaps} משמרות ללא כיסוי — שלח הזמנות`
        : 'כל המשמרות מכוסות',
      count: totalGaps,
      href: '/workforce/schedule',
      urgency: totalGaps > 2 ? 'high' : totalGaps > 0 ? 'medium' : 'low',
    },
    {
      key: 'stale-invites',
      label: 'הזמנות ממתינות',
      sublabel: stale.length > 0
        ? `${stale.length} הזמנות ללא מענה מעל יומיים`
        : 'כל ההזמנות נענו',
      count: stale.length,
      href: staleJobId ? `/hiring/jobs/${staleJobId}` : '/hiring/jobs',
      urgency: stale.length > 0 ? 'medium' : 'low',
    },
  ];
}
