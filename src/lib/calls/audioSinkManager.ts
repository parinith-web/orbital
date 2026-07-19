import { CallTrack } from "./types";


interface AudioSinkEntry {
  element: HTMLAudioElement;
  trackId: string;
}

function createAudioElement(trackId: string): HTMLAudioElement {
  const element = document.createElement("audio");
  element.autoplay = true;
  element.setAttribute("playsinline", "true");
  element.controls = false;
  element.dataset.callTrackId = trackId;
  element.style.position = "absolute";
  element.style.top = "0";
  element.style.left = "-9999px";
  element.style.width = "1px";
  element.style.height = "1px";
  element.style.opacity = "0.01";
  element.style.pointerEvents = "none";
  element.volume = 1;
  (element as any).preservesPitch = false;
  element.muted = false;
  document.body.appendChild(element);
  return element;
}


export class RemoteAudioSinkManager {
  private readonly entries = new Map<string, AudioSinkEntry>();
  private interactionListenerActive = false;

  private ensureInteractionListener(): void {
    if (this.interactionListenerActive || typeof document === "undefined") return;

    this.interactionListenerActive = true;
    const resumeAll = () => {
      this.entries.forEach((entry) => {
        if (entry.element.paused) {
          entry.element.play().catch(() => undefined);
        }
      });
      document.removeEventListener("click", resumeAll);
      document.removeEventListener("touchstart", resumeAll);
      this.interactionListenerActive = false;
    };

    document.addEventListener("click", resumeAll);
    document.addEventListener("touchstart", resumeAll);
  }

  attach(track: CallTrack): void {

    const trackId = track.id;
    if (this.entries.has(trackId)) {
      const entry = this.entries.get(trackId)!;
      if (track.stream && entry.element.srcObject !== track.stream) {
        entry.element.srcObject = track.stream;
      }
      return;
    }

    const element = createAudioElement(trackId);
    
    if (track.stream) {
      element.srcObject = track.stream;
    }

    element.play().catch((err) => {
      if (err.name === "NotAllowedError") {
        console.warn("[RemoteAudioSinkManager] Autoplay blocked for track:", trackId);
        this.ensureInteractionListener();
      } else {
        console.error("[RemoteAudioSinkManager] Error playing audio:", err);
      }
    });

    this.entries.set(trackId, { element, trackId });
  }

  detach(trackId: string): void {
    const entry = this.entries.get(trackId);
    if (!entry) return;

    entry.element.srcObject = null;
    entry.element.pause();
    entry.element.remove();
    this.entries.delete(trackId);
  }

  clear(): void {
    for (const trackId of Array.from(this.entries.keys())) {
      this.detach(trackId);
    }
  }
}