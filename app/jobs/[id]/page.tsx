import { redirect } from 'next/navigation';
export default function OldJobPage({ params }: { params: Promise<{ id: string }> }) {
  // Static redirect — dynamic param not usable in server redirect here
  redirect('/hiring/jobs');
}
