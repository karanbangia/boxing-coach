export type TimerCallback = (remaining: number) => void;

export class Timer {
  private duration: number;
  private remaining: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;
  private onTick: TimerCallback;
  private onComplete: () => void;
  private paused = false;

  constructor(
    durationSeconds: number,
    onTick: TimerCallback,
    onComplete: () => void
  ) {
    this.duration = durationSeconds;
    this.remaining = durationSeconds;
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  start(): void {
    this.remaining = this.duration;
    this.startTime = Date.now();
    this.paused = false;
    this.tick();
  }

  pause(): void {
    if (this.paused || this.intervalId === null) return;
    this.paused = true;
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.remaining = Math.max(0, this.remaining - elapsed);
    this.clearInterval();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.startTime = Date.now();
    this.tick();
  }

  reset(newDuration?: number): void {
    this.clearInterval();
    this.duration = newDuration ?? this.duration;
    this.remaining = this.duration;
    this.paused = false;
  }

  getRemaining(): number {
    if (this.paused) return this.remaining;
    if (this.intervalId === null) return this.remaining;
    const elapsed = (Date.now() - this.startTime) / 1000;
    return Math.max(0, this.remaining - elapsed);
  }

  isPaused(): boolean {
    return this.paused;
  }

  destroy(): void {
    this.clearInterval();
  }

  private tick(): void {
    this.clearInterval();
    this.intervalId = setInterval(() => {
      const current = this.getRemaining();
      this.onTick(current);
      if (current <= 0) {
        this.clearInterval();
        this.onComplete();
      }
    }, 250);
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
