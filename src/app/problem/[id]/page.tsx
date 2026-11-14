import { notFound } from 'next/navigation';
import { SqlWorkbench } from '@/components/SqlWorkbench';
import { CHALLENGES } from '@/data/challenges';

export function generateStaticParams() {
  return CHALLENGES.map((c) => ({
    id: c.id,
  }));
}

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = CHALLENGES.find((c) => c.id === id);

  if (!challenge) {
    notFound();
  }

  return <SqlWorkbench key={id} initialChallengeId={id} />;
}
