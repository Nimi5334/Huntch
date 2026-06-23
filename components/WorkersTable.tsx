'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { computeDna } from '@/lib/dna';

const ROLE_HE: Record<string, string> = {
  barista: 'בריסטה', server: 'מלצרות', cook: 'טבחות', 'line-cook': 'טבח קו',
  dishwasher: 'שטיפה', bartender: 'ברמנות', cashier: 'קופה', host: 'מארח/ת',
  delivery: 'שליחות', 'shift-manager': 'אחמ״ש',
};

const CHURN_HE: Record<string, string> = { low: 'יציב', medium: 'בינוני', high: 'גבוה' };

type SortKey = 'name' | 'role' | 'neighborhood' | 'distance' | 'dna';
interface SortState { key: SortKey; order: 'asc' | 'desc'; }

// Sortable shadcn Table for the neighborhood worker pool (desktop data list).
export default function WorkersTable({ rows }: { rows: any[] }) {
  const router = useRouter();
  const [sort, setSort] = useState<SortState>({ key: 'dna', order: 'desc' });

  const data = useMemo(() => {
    const withDna = rows.map((c) => ({ c, dna: computeDna(c) }));
    const val = (x: { c: any; dna: any }): string | number => {
      switch (sort.key) {
        case 'name': return x.c.name;
        case 'role': return ROLE_HE[x.c.roles[0]] ?? x.c.roles[0];
        case 'neighborhood': return x.c.neighborhood;
        case 'distance': return x.c.willingRangeKm;
        case 'dna': return x.dna.score;
      }
    };
    return withDna.sort((a, b) => {
      const av = val(a), bv = val(b);
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sort.order === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort.key, sort.order]);

  const toggle = (key: SortKey) =>
    setSort((s) => ({ key, order: s.key === key && s.order === 'asc' ? 'desc' : 'asc' }));

  const arrow = (key: SortKey) =>
    sort.key === key ? <span className="mr-1">{sort.order === 'asc' ? '↑' : '↓'}</span> : null;

  const scoreColor = (score: number) =>
    score >= 70 ? '#16a34a' : score >= 50 ? '#8a5e17' : '#b91c1c';

  return (
    <div className="rounded-[18px] border border-border bg-card overflow-hidden"
         style={{ boxShadow: 'var(--shadow-glass)' }}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer select-none text-right" onClick={() => toggle('name')}>
              שם {arrow('name')}
            </TableHead>
            <TableHead className="cursor-pointer select-none text-right" onClick={() => toggle('role')}>
              תפקיד {arrow('role')}
            </TableHead>
            <TableHead className="cursor-pointer select-none text-right" onClick={() => toggle('neighborhood')}>
              שכונה {arrow('neighborhood')}
            </TableHead>
            <TableHead className="cursor-pointer select-none text-right" onClick={() => toggle('distance')}>
              מרחק {arrow('distance')}
            </TableHead>
            <TableHead className="cursor-pointer select-none text-right" onClick={() => toggle('dna')}>
              ציון DNA {arrow('dna')}
            </TableHead>
            <TableHead className="text-right">סיכון עזיבה</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(({ c, dna }) => (
            <TableRow
              key={c.id}
              className="cursor-pointer"
              onClick={() => router.push(`/candidate/${c.id}`)}
            >
              <TableCell className="font-medium text-foreground">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: c.avatarColor }}
                  >
                    {c.initials}
                  </span>
                  {c.name}
                </span>
              </TableCell>
              <TableCell>{ROLE_HE[c.roles[0]] ?? c.roles[0]}</TableCell>
              <TableCell>{c.neighborhood}</TableCell>
              <TableCell style={{ fontFamily: 'var(--font-mono)' }}>{c.willingRangeKm} ק"מ</TableCell>
              <TableCell style={{ fontFamily: 'var(--font-mono)', color: scoreColor(dna.score), fontWeight: 700 }}>
                {dna.score}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    dna.churnRisk === 'high'
                      ? 'border-red-300 text-red-700'
                      : dna.churnRisk === 'medium'
                      ? 'border-amber-300 text-amber-700'
                      : 'border-emerald-300 text-emerald-700'
                  }
                >
                  {CHURN_HE[dna.churnRisk]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
