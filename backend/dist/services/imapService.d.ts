import { EmailAccount } from '../models/email';
export declare class ImapService {
    private connections;
    private reconnectAttempts;
    connectAccount(account: EmailAccount): Promise<void>;
    private startRealtimeSync;
    private performInitialSync;
    private fetchAndProcessEmail;
    private categorizeEmailAsync;
    private handleConnectionError;
    private scheduleReconnect;
    disconnectAccount(accountId: string): Promise<void>;
    getConnectionStatus(accountId: string): Promise<boolean>;
    getConnectedAccounts(): Promise<string[]>;
}
export declare const imapService: ImapService;
//# sourceMappingURL=imapService.d.ts.map