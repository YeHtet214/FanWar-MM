import Image from 'next/image';
import { memeTemplates, matches, teams } from '@/lib/data';

export default function MemePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Meme Generator (MVP)</h1>
      <div className="card space-y-3">
        <p>1) Choose match: Arsenal vs Chelsea</p>
        <p>2) Target rival: {teams.find((team) => team.id === matches[0].awayTeamId)?.name}</p>
        <p>3) Fill template slots and export with FanWar MM watermark.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {memeTemplates.map((template) => (
          <article key={template.id} className="card space-y-2">
            <Image src={template.imageUrl} alt={template.name} width={400} height={220} className="h-28 w-full rounded object-cover" />
            <h2 className="font-semibold">{template.name}</h2>
            <p className="text-xs text-slate-400">Slots: {template.textSlots.join(', ')}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
