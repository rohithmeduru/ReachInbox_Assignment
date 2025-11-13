import { Email } from '../models/email';
export declare class ElasticsearchService {
    initializeIndex(): Promise<void>;
    indexEmail(email: Email): Promise<string>;
    updateEmailCategory(emailId: string, category: string, confidence: number): Promise<void>;
    searchEmails(params: {
        query?: string;
        accountId?: string;
        folder?: string;
        category?: string;
        dateFrom?: Date;
        dateTo?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{
        emails: Email[];
        total: number;
    }>;
    getEmailById(emailId: string): Promise<Email | null>;
    getEmailStats(accountId?: string): Promise<{
        total: number;
        byCategory: Record<string, number>;
        byFolder: Record<string, number>;
    }>;
    deleteEmail(emailId: string): Promise<void>;
    updateEmail(emailId: string, updates: Partial<Email>): Promise<void>;
}
export declare const elasticsearchService: ElasticsearchService;
//# sourceMappingURL=elasticsearchService.d.ts.map