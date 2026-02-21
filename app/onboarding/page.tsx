import { teams } from '@/lib/data';
import { StepPanel } from '@/components/step-panel';

export default function OnboardingPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Identity Onboarding</h1>
      <StepPanel step={1} title="Create account" details="Use Supabase Auth with email or mobile OTP. This MVP page demonstrates the onboarding sequence before wiring auth." />
      <StepPanel step={2} title="Pick your EPL club" details="Your primary team is mandatory and locked after first selection. Team changes are admin-managed only." />
      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((team) => (
          <article key={team.id} className="card flex items-center justify-between">
            <span className="text-lg">{team.crest} {team.name}</span>
            <button className="rounded-md bg-red-600 px-3 py-1 text-sm">Select</button>
          </article>
        ))}
      </div>
    </section>
  );
}
