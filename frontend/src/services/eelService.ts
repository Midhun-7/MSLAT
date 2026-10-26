// Eel TypeScript integration service

declare global {
  interface Window {
    eel: {
      expose: (fn: Function, name?: string) => void;
      waitForStart: () => void;
      stop: () => void;
      print_image?: (data: string) => void;
      print_label?: (data: string) => void;
      startStop?: () => void;
    };
  }
}

type ImageCallback = (base64Image: string) => void;
type LabelCallback = (label: string) => void;
type StatusCallback = (status: 'idle' | 'starting' | 'running' | 'stopping') => void;

class EelBridge {
  private isConnected = false;
  private imageListeners: Set<ImageCallback> = new Set();
  private labelListeners: Set<LabelCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private currentStatus: 'idle' | 'starting' | 'running' | 'stopping' = 'idle';

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      const exposeEel = () => {
        if (!window.eel) return false;
        this.isConnected = true;

        // Expose print_image to Python
        window.eel.expose(this.handleImage.bind(this), 'print_image');

        // Expose print_label to Python
        window.eel.expose(this.handleLabel.bind(this), 'print_label');

        // Expose startStop to Python
        window.eel.expose(this.handleStartStop.bind(this), 'startStop');

        // Also expose directly on window for fallback compatibility
        (window as any).print_image = this.handleImage.bind(this);
        (window as any).print_label = this.handleLabel.bind(this);
        (window as any).startStop = this.handleStartStop.bind(this);

        console.log('Eel bridge successfully connected');
        return true;
      };

      if (!exposeEel()) {
        // Retry if eel.js is still initializing
        const interval = setInterval(() => {
          if (exposeEel()) clearInterval(interval);
        }, 100);
        setTimeout(() => clearInterval(interval), 3000);
      }
    }
  }

  private handleImage(data: any) {
    try {
      // If we receive an image frame while in 'starting' state, switch to 'running' immediately
      if (this.currentStatus === 'starting') {
        this.setStatus('running');
      }

      let parsed = data;
      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = { image: data };
        }
      }
      const imgB64 = parsed?.image ?? parsed;
      if (imgB64 && typeof imgB64 === 'string') {
        const imgSrc = imgB64.startsWith('data:') ? imgB64 : 'data:image/jpeg;base64,' + imgB64;
        this.imageListeners.forEach(cb => cb(imgSrc));
      }
    } catch (e) {
      console.error('Error parsing image frame from Eel:', e);
    }
  }

  private handleLabel(data: any) {
    try {
      let parsed = data;
      if (typeof data === 'string') {
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = { label: data };
        }
      }
      const rawLabel = parsed?.label !== undefined ? parsed.label : parsed;
      const cleanLabel = (rawLabel === null || rawLabel === 'None' || rawLabel === undefined) ? '' : String(rawLabel);
      this.labelListeners.forEach(cb => cb(cleanLabel));
    } catch (e) {
      console.error('Error parsing label from Eel:', e);
    }
  }

  private handleStartStop() {
    if (this.currentStatus === 'starting') {
      this.setStatus('running');
    } else if (this.currentStatus === 'stopping') {
      this.setStatus('idle');
    }
  }

  public start() {
    if (window.eel && window.eel.waitForStart) {
      this.setStatus('starting');
      window.eel.waitForStart();
    } else {
      // Mock for browser dev mode
      this.setStatus('running');
    }
  }

  public stop() {
    if (window.eel && window.eel.stop) {
      this.setStatus('stopping');
      window.eel.stop();
    } else {
      this.setStatus('idle');
    }
  }

  private setStatus(status: 'idle' | 'starting' | 'running' | 'stopping') {
    this.currentStatus = status;
    this.statusListeners.forEach(cb => cb(status));
  }

  public onImage(cb: ImageCallback) {
    this.imageListeners.add(cb);
    return () => this.imageListeners.delete(cb);
  }

  public onLabel(cb: LabelCallback) {
    this.labelListeners.add(cb);
    return () => this.labelListeners.delete(cb);
  }

  public onStatus(cb: StatusCallback) {
    this.statusListeners.add(cb);
    cb(this.currentStatus);
    return () => this.statusListeners.delete(cb);
  }

  public getIsConnected() {
    return this.isConnected;
  }
}

export const eelBridge = new EelBridge();

