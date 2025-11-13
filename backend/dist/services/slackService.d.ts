export declare class SlackService {
    sendInterestedNotification(email: any): Promise<void>;
    private buildSlackMessage;
    testConnection(): Promise<boolean>;
    sendCustomMessage(channel: string, message: string, blocks?: any[]): Promise<void>;
    getCategoryStatsMessage(stats: {
        byCategory: Record<string, number>;
    }): Promise<string>;
    sendDailyDigest(stats: {
        byCategory: Record<string, number>;
    }, newInterestedCount: number): Promise<void>;
}
export declare const slackService: SlackService;
//# sourceMappingURL=slackService.d.ts.map