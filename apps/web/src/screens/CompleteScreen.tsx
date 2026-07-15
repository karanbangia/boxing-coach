import { useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { WorkoutPerformance } from '@boxing-coach/core';

interface Props {
  performance: WorkoutPerformance;
  onReturnToGym: () => void;
}

const APP_NAME = 'Boxing Coach';
const DOWNLOAD_LINK = '';
const CONFETTI_COLORS = ['#ff1414', '#f9bdad', '#f5f0ef', '#ff5a4f'];

export function CompleteScreen({ performance, onReturnToGym }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const confetti = useMemo(() => Array.from({ length: 28 }, (_, index) => ({
    left: `${(index * 37) % 100}%`,
    delay: `${(index % 8) * 0.08}s`,
    duration: `${1.6 + (index % 5) * 0.16}s`,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    rotate: `${(index * 47) % 180}deg`,
  })), []);

  const handleShare = async () => {
    if (!cardRef.current || isSharing) return;
    setIsSharing(true);
    setShareStatus('');

    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#131313',
      });
      const response = await fetch(dataUrl);
      const file = new File([await response.blob()], 'boxing-coach-performance.png', { type: 'image/png' });
      const shareData: ShareData = {
        title: `${APP_NAME} performance`,
        text: DOWNLOAD_LINK ? `${APP_NAME}\n${DOWNLOAD_LINK}` : APP_NAME,
        files: [file],
        ...(DOWNLOAD_LINK ? { url: DOWNLOAD_LINK } : {}),
      };

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setShareStatus('SHARED');
      } else {
        const anchor = document.createElement('a');
        anchor.download = file.name;
        anchor.href = dataUrl;
        anchor.click();
        setShareStatus('IMAGE SAVED');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareStatus('TRY AGAIN');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <main className="relative flex h-full min-h-[100dvh] flex-col items-center overflow-hidden bg-[var(--color-bg)] px-6 pb-[34px] pt-10 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] overflow-hidden" aria-hidden="true">
        {confetti.map((piece, index) => (
          <span
            key={index}
            className="complete-confetti absolute -top-5 h-3 w-1.5"
            style={{
              left: piece.left,
              backgroundColor: piece.color,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              transform: `rotate(${piece.rotate})`,
            }}
          />
        ))}
      </div>

      <section
        ref={cardRef}
        className="relative flex w-full max-w-[400px] flex-1 flex-col items-center justify-center bg-[var(--color-bg)] px-5 py-5 text-center"
        aria-label="Workout performance summary"
      >
        <header className="font-['Anton'] uppercase leading-[0.86]">
          <h1 className="text-[46px] text-[var(--color-peach)]">SESSION</h1>
          <div className="text-[52px] text-[var(--color-accent)]">COMPLETE</div>
        </header>

        <div className="mt-12">
          <div className="font-['Space_Grotesk'] text-[9px] font-bold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
            Total volume
          </div>
          <div className="mt-1 font-['Anton'] text-[76px] leading-none tabular-nums text-white">
            {performance.punches}
          </div>
          <div className="font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Punches
          </div>
        </div>

        <div className="mt-8 grid w-full max-w-[300px] grid-cols-2 divide-x divide-[var(--color-border)]">
          <div className="px-3">
            <div className="font-['Space_Grotesk'] text-[8px] font-bold uppercase tracking-[0.23em] text-[var(--color-text-muted)]">Avg heart rate</div>
            <div className="mt-1 font-['Anton'] text-[40px] leading-none tabular-nums text-white">
              {performance.averageHeartRate}<span className="ml-1 font-['Space_Grotesk'] text-[9px] font-bold text-[var(--color-peach)]">BPM</span>
            </div>
          </div>
          <div className="px-3">
            <div className="font-['Space_Grotesk'] text-[8px] font-bold uppercase tracking-[0.23em] text-[var(--color-text-muted)]">Calories burned</div>
            <div className="mt-1 font-['Anton'] text-[40px] leading-none tabular-nums text-white">
              {performance.caloriesBurned}<span className="ml-1 font-['Space_Grotesk'] text-[9px] font-bold text-[var(--color-peach)]">KCAL</span>
            </div>
          </div>
        </div>
      </section>

      <div className="relative w-full max-w-[336px] shrink-0">
        <button
          type="button"
          onClick={handleShare}
          disabled={isSharing}
          className="flex min-h-[58px] w-full items-center justify-center bg-[var(--color-accent)] font-['Anton'] text-[24px] leading-8 tracking-[0.06em] text-white active:scale-[0.99] active:opacity-90 disabled:opacity-70"
        >
          {isSharing ? 'PREPARING...' : shareStatus || 'SHARE PERFORMANCE'}
        </button>
        <button
          type="button"
          onClick={onReturnToGym}
          className="mt-2.5 flex min-h-12 w-full items-center justify-center border border-[var(--color-border)] bg-[rgba(26,26,26,0.64)] font-['Space_Grotesk'] text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-muted)] active:scale-[0.99] active:opacity-90"
        >
          RETURN TO GYM
        </button>
      </div>
    </main>
  );
}
