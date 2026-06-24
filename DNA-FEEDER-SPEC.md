# DNA Feeder — WhatsApp Mini-Interview Spec

**Purpose:** A progressive WhatsApp conversation that populates the Huntch candidate DNA profile as accurately as possible for a zero-history candidate (QR scan entry point). Designed to take 5–10 minutes on mobile, bias toward taps over typing, and front-load the highest-yield retention signals.

**Status:** Spec only — ready to connect to WhatsApp Business API when implementation begins.

---

## Design Principles

1. **Retention-first ordering.** The DNA's churn pill is the core value-add. The highest-yield retention signals (needs-supplies fit, schedule tolerance) come *before* performance questions. If a candidate drops off mid-way, the most important predictors are already captured.

2. **Taps over typing.** Use WhatsApp interactive `list` and `button` messages for closed questions — 3-second taps that auto-score. Free text only for the 2 behavioral questions where prose beats options.

3. **Honest cold-start scoring.** A zero-history candidate must never collapse to a confidently-bad 0 (empirical-Bayes shrinkage toward population mean). Passive signals (reply latency, completion time) influence only the **confidence band** — never displayed as a quality score. Research basis: Sackett et al. 2022 (JAP), Salgado & Moscoso 2019, Choper/Schneider/Harknett ILR Review 2022.

4. **Progressive disclosure.** Phase 1 + 2 are required and take ~4 min. Phase 3 is optional, offered only if the candidate is still engaged.

---

## Phase 1 — התאמה בסיסית (Core Match) · ~2 min · all taps

*Populates existing `Candidate` fields that `matching.ts` already consumes.*

| # | Hebrew question | English gloss | WA type | Candidate field |
|---|---|---|---|---|
| 1 | אילו תפקידים מעניינים אותך? | Which roles? | list, multi | `roles` |
| 2 | כמה שעות בשבוע? | Hours/week? | buttons: `<20 / 20–30 / 30+ / גמיש` | `availability.hoursPerWeek` |
| 3 | אילו משמרות מתאימות לך? | Which shifts? | list, multi: בקרים/צהריים/ערבים/לילות/סופ״ש | `availability.shifts` |
| 4 | מתי תוכל/י להתחיל? | When can you start? | buttons: `מיידית / תוך שבועיים / תוך חודש / רק בודק/ת` | `availability.immediate`, `earliestStart` |
| 5 | איך תגיע/י לעבודה? | How do you commute? | buttons: `רכב / תח״צ / רגל-אופניים` | `hasCar` |
| 6 | עד כמה רחוק תסע/י? | Max travel distance? | buttons: `עד 2 / 5 / 10 / 15+ ק״מ` | `willingRangeKm` |
| 7 | שכר מבוקש לשעה (₪)? | Expected hourly wage? | buttons: `<40 / 40–50 / 50–60 / 60+` | `expectedWageNis` |

---

## Phase 2 — מה חשוב לך (What You're Looking For) · ~2 min · taps + optional short text

*Captures needs-supplies fit — the single strongest predictor of turnover intention found in research (β=−.58, p<.001, verified 3-0). Completely absent from current DNA. This is the highest-value addition.*

| # | Hebrew question | English gloss | WA type | New field |
|---|---|---|---|---|
| 8 | מה הכי חשוב לך בעבודה הבאה? (בחר עד 3) | What matters most? | list, multi (max 3) | `needsSuppliesFit` |
| 9 | כמה חשוב לך שהסידור יהיה קבוע וצפוי מראש? | How important is a fixed/predictable schedule? | buttons: `מאוד / נחמד שיהיה / אני גמיש/ה` | `scheduleTolerance` |
| 10 | משהו נוסף שחשוב לך במקום עבודה? (אופציונלי) | Anything else important? | text (short, optional) | `needsSuppliesFit` notes |

### Options for Q8 (needs-supplies fit list):

| Key | Hebrew | English |
|---|---|---|
| `steady_income` | הכנסה יציבה וצפויה | Steady/predictable income |
| `flexible_hours` | שעות גמישות | Flexible hours |
| `predictable_schedule` | סידור עבודה קבוע | Fixed/predictable schedule |
| `good_team` | צוות ומנהל טובים | Good team & manager |
| `close_to_home` | קרוב לבית | Close to home |
| `growth` | למידה והתקדמות | Learning & growth |
| `fast_pace` | קצב מהיר ועמוס | Fast-paced environment |
| `calm_pace` | קצב רגוע | Calm environment |

---

## Phase 3 — קצת על הניסיון שלך (Your Experience) · ~2–4 min · progressive

*Offered after Phase 2 completion with: "כמה שאלות נוספות כדי שנוכל להתאים לך בצורה הטובה ביותר — אופציונלי"*

*Structured scored questions are the top predictor of job performance (~.42, Sackett et al. 2022). Free text here — rubric scored 0–2.*

| # | Hebrew question | English gloss | WA type | Field |
|---|---|---|---|---|
| 11 | כמה ניסיון יש לך בתחום? | Years of relevant experience? | buttons: `אין / עד שנה / 1–2 / 3–5 / 5+` | `experience.totalYears` (capped/nonlinear — weak signal, ~.16) |
| 12 | איפה עבדת בעבר? (אופציונלי) | Where have you worked? | text (short, optional) | `experience.notableWorkplaces` |
| 13 | **[scored]** ערב עמוס, לקוח כועס על המתנה ארוכה — מה תעשה/י? | Busy night, angry customer — what do you do? | text | `interviewScores.serviceHandling` |
| 14 | **[scored]** ספר/י על משמרת שאת/ה גאה באיך שהתמודדת | Tell us about a shift you're proud of | text | `interviewScores.ownership` |

### Scoring rubric for Q13 (serviceHandling):
- **0** — Avoids, blames, or no answer
- **1** — Handles it but defensively; solution-first with no empathy
- **2** — Takes ownership, de-escalates, shows empathy, outcome-oriented

### Scoring rubric for Q14 (ownership):
- **0** — Vague answer or no real example
- **1** — A real example, thin on detail
- **2** — Concrete situation + what they did + result; shows growth/reflection

### Role-family swap for Q13/Q14:

| Role family | Q13 (pressure scenario) | Q14 (pride scenario) |
|---|---|---|
| Service / hospitality | ערב עמוס, לקוח כועס | משמרת שגאה בה |
| Kitchen | המטבח בעומס וחסר חבר צוות — מה עושים? | מנה/פריט שהצלחת בו |
| Retail / cashier | לקוח מתחיל להתווכח על מחיר | רגע שעזרת לצוות |
| Delivery | משלוח מתעכב, לקוח מתקשר — מה עושים? | משלוח מסובך שסגרת טוב |

---

## Cold-Start DNA Computation

Replaces the broken `priorHires/applicationCount` formula for zero-history candidates. See [`lib/dna.ts`](lib/dna.ts).

```
ColdStartDNA.score = (
  retentionFit   * 0.40   // needsSuppliesFit ⋈ venue + scheduleTolerance ⋈ venue  ← currently missing
  performance    * 0.30   // mean(interviewScores.serviceHandling, .ownership)
  logisticsFit   * 0.15   // from matching.ts: distance, availability, wage overlap
  experience     * 0.15   // capped(totalYears, 5), nonlinear
)

ColdStartDNA.reliability = (priorHires + α₀) / (applicationCount + α₀ + β₀)
// Empirical-Bayes: with 0/0 defaults to population mean, not 0
// α₀ / β₀ to be calibrated from real Huntch data once accumulated

ColdStartDNA.confidence = f(phases_completed, question_richness)
// Displayed as a band: "68 ± 12" not a point estimate
// Source: Wilson score interval principle (Brown/Cai/DasGupta 2001)
```

### Passive signals (confidence nudge ONLY — never displayed as quality):

```json
{
  "firstReplyLatencySec": null,
  "formCompletionSec": null,
  "useFor": "confidence_band_only",
  "caveat": "Speed influences hiring decisions (Fiverr study, 11.66M txns) but does NOT prove worker quality. Explicitly refuted claim (0-3 verification). Must never appear in displayed score."
}
```

### Display rule for zero-history profiles:

Show this in the DNA section instead of the current misleading `reliability: 0` pill:

```
פרופיל ראשוני · מבוסס על הרשמה
ציון: 68 ± 12
```

As real hires accumulate, EB shrinkage releases the candidate from the population-mean prior and the confidence band narrows.

---

## New Candidate Fields Required

Add to `Candidate` in [`lib/types.ts`](lib/types.ts):

```typescript
// Needs-supplies fit (Phase 2)
needsSuppliesFit?: string[];    // keys from Q8 options list
scheduleTolerance?: 'very' | 'nice' | 'flexible';

// Structured interview scores (Phase 3)
interviewScores?: {
  serviceHandling?: number;   // 0–2
  ownership?: number;         // 0–2
};

// Cold-start metadata
dnaSource?: 'cold_start' | 'platform_history' | 'hybrid';
dnaConfidence?: number;       // 0–1, drives ± display
```

Add to `PlatformSignals` in [`lib/types.ts`](lib/types.ts):

```typescript
// Passive signals — confidence only
formCompletionSec?: number;
firstReplyLatencySec?: number;
```

---

## WhatsApp API Integration Notes

- Use **WhatsApp Business API interactive messages** for Phases 1–2 (list + button types)
- Use plain text messages for Q13/Q14 (prose answers)
- Trigger: candidate scans QR → `consentSource: 'qr-scan'` → immediately send Phase 1
- After Phase 2 completes, send: *"כמה שאלות נוספות כדי שנוכל להתאים לך בצורה הטובה ביותר — אופציונלי 👇"*
- Store raw WA message IDs alongside answers for later audit
- Scoring of Q13/Q14: initially manual or rule-based keyword scoring; eventually LLM-assisted

### Message flow pseudocode:

```
onQrScan(candidateId, businessId)
  → sendPhase1Questions(candidateId)          // Q1–Q7, all taps
  → onPhase1Complete → sendPhase2Questions()  // Q8–Q10
  → onPhase2Complete → offerPhase3()          // "אופציונלי"
  → onPhase3Accept   → sendPhase3Questions()  // Q11–Q14
  → onPhase3Complete → recomputeDnaColdStart(candidateId)
  → notifyVenues(candidateId, updatedProfile)
```

---

## Research Basis (Evidence Quality)

| Finding | Source | Confidence |
|---|---|---|
| Needs-supplies fit β=−.58 for turnover | PMC12480616 (primary, cross-sectional) | High |
| Schedule instability +50% turnover | Choper/Schneider/Harknett, ILR Review 2022 | High |
| Structured questions ~.42 performance validity | Sackett et al. 2022, JAP (meta-analysis) | High |
| Experience ~.16, caps ~5yr | Schmidt & Oh 2016 (meta-analysis) | High |
| EB shrinkage / Wilson CI for cold-start | Brown/Cai/DasGupta 2001 (statistics) | High |
| GMA weakest for low-complexity roles (~.32) | Salgado & Moscoso 2019, PMC6811658 | High |
| Reply speed = signal to employers, NOT proven quality | Hart et al., Management Science 2024 | High (refuted stronger claim) |

**Critical caveat:** validity coefficients come from full selection instruments, not microform taps. These are the *right kinds* of signals — actual coefficients for Huntch must be validated against real retention outcomes once data accumulates.
