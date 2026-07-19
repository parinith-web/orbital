export class SpeakerDetector {
  private audioContext: AudioContext | null = null;
  private analysers = new Map<string, AnalyserNode>();
  private sources = new Map<string, MediaStreamAudioSourceNode>();
  private activeSpeakers = new Set<string>();
  private loopId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly onChange: () => void) {}

  ensureReady(): void {
    if (!this.audioContext) {
      this.audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }

    if (this.loopId) return;

    this.loopId = setInterval(() => {
      if (this.audioContext?.state === "suspended") {
        this.audioContext.resume().catch(() => {});
      }

      let changed = false;

      this.analysers.forEach((analyser, peerId) => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;

        const isSpeaking = average > 10;
        const wasSpeaking = this.activeSpeakers.has(peerId);

        if (isSpeaking && !wasSpeaking) {
          this.activeSpeakers.add(peerId);
          changed = true;
        } else if (!isSpeaking && wasSpeaking) {
          this.activeSpeakers.delete(peerId);
          changed = true;
        }
      });

      if (changed) this.onChange();
    }, 100);
  }

  attachTrack(peerId: string, track: MediaStreamTrack): void {
    this.ensureReady();
    if (!this.audioContext) return;

    this.detach(peerId);

    const source = this.audioContext.createMediaStreamSource(
      new MediaStream([track]),
    );
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.4;
    source.connect(analyser);

    this.analysers.set(peerId, analyser);
    this.sources.set(peerId, source);
  }

  detach(peerId: string): void {
    const source = this.sources.get(peerId);
    if (source) {
      try {
        source.disconnect();
      } catch {
        // no-op
      }
      this.sources.delete(peerId);
    }

    this.analysers.delete(peerId);
    this.activeSpeakers.delete(peerId);
  }

  getActiveSpeakerPeerIds(): string[] {
    return Array.from(this.activeSpeakers);
  }

  async dispose(): Promise<void> {
    if (this.loopId) {
      clearInterval(this.loopId);
      this.loopId = null;
    }

    this.sources.forEach((source) => {
      try {
        source.disconnect();
      } catch {
        // no-op
      }
    });

    this.sources.clear();
    this.analysers.clear();
    this.activeSpeakers.clear();

    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch {
        // no-op
      }
      this.audioContext = null;
    }
  }
}
