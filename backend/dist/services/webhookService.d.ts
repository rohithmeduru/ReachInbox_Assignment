export declare class WebhookService {
    triggerInterestedWebhook(email: any): Promise<void>;
    testWebhook(): Promise<boolean>;
    triggerCustomWebhook(url: string, payload: any, headers?: Record<string, string>): Promise<void>;
    batchTriggerWebhooks(webhooks: Array<{
        url: string;
        payload: any;
        headers?: Record<string, string>;
    }>): Promise<void>;
    retryFailedWebhook(url: string, payload: any, maxRetries?: number): Promise<void>;
    sendBulkEmailSummary(emails: any[], category: string): Promise<void>;
}
export declare const webhookService: WebhookService;
//# sourceMappingURL=webhookService.d.ts.map