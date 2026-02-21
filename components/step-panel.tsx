export function StepPanel({ step, title, details }: { step: number; title: string; details: string }) {
  return (
    <article className="card">
      <p className="text-xs uppercase tracking-wide text-red-400">Step {step}</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-slate-300">{details}</p>
    </article>
  );
}
