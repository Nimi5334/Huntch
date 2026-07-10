import type { Patient, Outreach } from './types';
import { generateLead } from './leads';
import type { ClinicType } from './types';

export interface RoiSummary {
  recoveredRevenue: number;
  potentialRevenue: number;
  reactivatedCount: number;
  dormantCount: number;
}

const AVG_TREATMENT_VALUE = 800; // placeholder assumption per recovered visit, ₪

export function computeRoi(patients: Patient[], outreach: Outreach[], clinicType: ClinicType): RoiSummary {
  const repliedOutreach = outreach.filter(o => o.status === 'replied' && (o.kind === 'reactivation'));
  const reactivatedPatientIds = new Set(repliedOutreach.map(o => o.patientId));

  const dormant = patients.filter(p => {
    const lead = generateLead(p, clinicType);
    return lead.reason !== '' && lead.headline !== 'הכל מעודכן';
  });

  return {
    recoveredRevenue: reactivatedPatientIds.size * AVG_TREATMENT_VALUE,
    potentialRevenue: dormant.length * AVG_TREATMENT_VALUE,
    reactivatedCount: reactivatedPatientIds.size,
    dormantCount: dormant.length,
  };
}
