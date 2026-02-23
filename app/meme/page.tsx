'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { memeTemplates } from '@/lib/data';
import { useAsyncData } from '@/lib/hooks/use-async-data';
import { useLanguage } from '@/lib/language';
import { getMatches } from '@/lib/repositories/matches';
import { getTeams } from '@/lib/repositories/teams';
import { Match, Team } from '@/lib/types';

const WATERMARK = 'FanWar MM';

async function composeMeme(templateUrl: string, lines: string[]) {
  const image = new window.Image();
  image.crossOrigin = 'anonymous';
  image.src = templateUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to load template image'));
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not available');
  }

  ctx.drawImage(image, 0, 0);
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.fillStyle = '#fff';
  ctx.lineWidth = Math.max(4, Math.floor(image.width * 0.008));
  ctx.font = `bold ${Math.max(28, Math.floor(image.width * 0.065))}px Impact, Arial Black, sans-serif`;

  const activeLines = lines.filter((line) => line.trim().length > 0);
  if (activeLines[0]) {
    const y = Math.floor(image.height * 0.12);
    ctx.strokeText(activeLines[0].toUpperCase(), image.width / 2, y);
    ctx.fillText(activeLines[0].toUpperCase(), image.width / 2, y);
  }

  if (activeLines[1]) {
    const y = Math.floor(image.height * 0.92);
    ctx.strokeText(activeLines[1].toUpperCase(), image.width / 2, y);
    ctx.fillText(activeLines[1].toUpperCase(), image.width / 2, y);
  }

  if (activeLines.length > 2) {
    ctx.font = `bold ${Math.max(24, Math.floor(image.width * 0.05))}px Impact, Arial Black, sans-serif`;
    const maxExtraLines = 4;
    const extras = activeLines.slice(2, 2 + maxExtraLines);
    const startY = Math.floor(image.height * 0.25);
    const endY = Math.floor(image.height * 0.82);
    const spacing = extras.length > 1 ? (endY - startY) / (extras.length - 1) : 0;

    extras.forEach((line, index) => {
      const y = Math.floor(startY + spacing * index);
      ctx.strokeText(line.toUpperCase(), image.width / 2, y);
      ctx.fillText(line.toUpperCase(), image.width / 2, y);
    });
  }

  ctx.textAlign = 'right';
  ctx.lineWidth = 2;
  ctx.font = `600 ${Math.max(16, Math.floor(image.width * 0.03))}px Inter, sans-serif`;
  ctx.strokeText(WATERMARK, image.width - 16, image.height - 16);
  ctx.fillText(WATERMARK, image.width - 16, image.height - 16);

  return canvas.toDataURL('image/png');
}

export default function MemePage() {
  const { t } = useLanguage();
  const { data, loading, error } = useAsyncData<[Match[], Team[]]>(async () => Promise.all([getMatches(), getTeams()]), []);

  const matches = data?.[0] ?? [];
  const teams = data?.[1] ?? [];
  const [selectedTemplateId, setSelectedTemplateId] = useState(memeTemplates[0]?.id ?? '');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [slotValues, setSlotValues] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedTemplate = useMemo(
    () => memeTemplates.find((template) => template.id === selectedTemplateId) ?? memeTemplates[0],
    [selectedTemplateId]
  );

  const teamsMap = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);

  useEffect(() => {
    setSlotValues(selectedTemplate?.textSlots.map(() => '') ?? []);
    setPreviewDataUrl('');
    setUploadedUrl('');
  }, [selectedTemplate?.id]);

  const handleCompose = async () => {
    if (!selectedTemplate) {
      return;
    }

    const tooLong = slotValues.find((value) => value.length > 80);
    if (tooLong) {
      setStatus('Each text slot must be 80 characters or less.');
      return;
    }

    setBusy(true);
    setStatus('Rendering preview...');
    try {
      const rendered = await composeMeme(selectedTemplate.imageUrl, slotValues);
      setPreviewDataUrl(rendered);
      setStatus('Preview ready. Export when you are happy with it.');
      previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (composeError) {
      setStatus((composeError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    if (!selectedTemplate || !previewDataUrl) {
      setStatus('Generate a preview first.');
      return;
    }

    setBusy(true);
    setStatus('Uploading meme...');
    try {
      const response = await fetch('/api/memes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateSlug: selectedTemplate.slug,
          imageDataUrl: previewDataUrl,
          matchId: selectedMatchId || undefined,
          targetTeamId: selectedTeamId || undefined,
          caption,
          textSlots: slotValues.map((value) => value.trim())
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to upload meme');
      }

      const payload = (await response.json()) as { imageUrl: string };
      setUploadedUrl(payload.imageUrl);
      setStatus('Uploaded. Copy the link and attach it in a post.');
    } catch (uploadError) {
      setStatus((uploadError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyLink = async () => {
    if (!uploadedUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(uploadedUrl);
      setStatus('Link copied. You can now paste it in war room or match post attachments.');
    } catch (error) {
      setStatus(`Failed to copy link: ${(error as Error).message || 'Please copy manually.'}`);
    }
  };

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">{t('memeGenerator')}</h1>
      {loading && <p className="card text-slate-300">Loading match data...</p>}
      {error && <p className="card text-red-300">Failed to load meme setup data.</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="card space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Template</span>
            <select className="w-full rounded bg-slate-900 p-2" value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
              {memeTemplates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Match (optional)</span>
              <select className="w-full rounded bg-slate-900 p-2" value={selectedMatchId} onChange={(event) => setSelectedMatchId(event.target.value)}>
                <option value="">None</option>
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {teamsMap.get(match.homeTeamId)?.name && teamsMap.get(match.awayTeamId)?.name
                      ? `${teamsMap.get(match.homeTeamId)?.name} vs ${teamsMap.get(match.awayTeamId)?.name}`
                      : match.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-300">Target team (optional)</span>
              <select className="w-full rounded bg-slate-900 p-2" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>
                <option value="">None</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedTemplate?.textSlots.map((slot, index) => (
            <label key={`${slot}-${index}`} className="block space-y-1 text-sm">
              <span className="text-slate-300">{slot}</span>
              <input
                className="w-full rounded bg-slate-900 p-2"
                value={slotValues[index] ?? ''}
                onChange={(event) => setSlotValues((current) => current.map((entry, entryIndex) => (entryIndex === index ? event.target.value.slice(0, 80) : entry)))}
                maxLength={80}
              />
            </label>
          ))}

          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Caption (optional)</span>
            <input className="w-full rounded bg-slate-900 p-2" value={caption} maxLength={200} onChange={(event) => setCaption(event.target.value)} />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="rounded bg-blue-600 px-3 py-2 text-sm" onClick={handleCompose} disabled={busy}>Preview</button>
            <button type="button" className="rounded bg-emerald-600 px-3 py-2 text-sm" onClick={handleExport} disabled={busy || !previewDataUrl}>Export & Upload</button>
          </div>
          {status && <p className="text-sm text-slate-300">{status}</p>}
        </div>

        <div ref={previewRef} className="card space-y-2">
          <h2 className="font-semibold">Mobile preview</h2>
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded border border-slate-700 bg-slate-950">
            <Image
              src={previewDataUrl || selectedTemplate?.imageUrl || '/templates/late-winner.svg'}
              alt="Meme preview"
              width={600}
              height={600}
              className="h-auto w-full"
              unoptimized
            />
          </div>

          {uploadedUrl && (
            <div className="space-y-2 rounded border border-slate-700 p-2 text-sm">
              <p className="break-all text-slate-300">{uploadedUrl}</p>
              <div className="flex gap-2">
                <a href={uploadedUrl} target="_blank" rel="noreferrer" className="rounded bg-slate-700 px-2 py-1">Open</a>
                <button type="button" className="rounded bg-slate-700 px-2 py-1" onClick={handleCopyLink}>Copy link</button>
              </div>
              <p className="text-xs text-slate-400">Paste this link into the "meme/image URL" field when creating a war room or match post.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
