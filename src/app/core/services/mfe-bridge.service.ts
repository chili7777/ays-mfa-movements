import { Injectable, signal } from '@angular/core';

export interface SessionData {
  role: string | null;
  clientId: string | null;
  userName: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MfeBridgeService {
  private readonly _sessionData = signal<SessionData>({
    role: null,
    clientId: null,
    userName: null
  });

  private readonly trustedOrigins = [
    'http://localhost:4200',
    'https://ays-shl-account-management.ondigitalocean.app'
  ];

  readonly sessionData = this._sessionData.asReadonly();

  constructor() {
    this.initMessageListener();
    this.sendHandshake();
  }

  private initMessageListener() {
    window.addEventListener('message', (event) => {
      if (!this.isTrustedOrigin(event.origin)) return;

      const { type, payload } = event.data || {};

      if (type === 'SHELL_SESSION_DATA') {
        console.log('[MFE Movements Bridge] Datos recibidos:', payload);
        this._sessionData.set({
          role: payload.role || 'USER',
          clientId: payload.clientId || null,
          userName: payload.userName || 'Usuario'
        });
      }
    });
  }

  private sendHandshake() {
    console.log('[MFE Movements Bridge] Enviando MFE_READY');
    window.parent.postMessage({ type: 'MFE_READY' }, '*');
  }

  /**
   * Solicita a la Shell navegar a una ruta específica con parámetros.
   */
  navigateTo(path: string, queryParams?: any) {
    window.parent.postMessage({
      type: 'MFE_NAVIGATE',
      payload: { path, queryParams }
    }, '*');
  }

  private isTrustedOrigin(origin: string): boolean {
    return this.trustedOrigins.includes(origin) ||
           origin.endsWith('.ondigitalocean.app') ||
           origin.includes('localhost');
  }
}
