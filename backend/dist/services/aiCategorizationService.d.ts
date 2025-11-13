import { EmailCategory } from '../models/email';
export declare class AiCategorizationService {
    categorizeEmail(emailId: string): Promise<{
        category: EmailCategory;
        confidence: number;
        reasoning?: string;
    }>;
    private prepareEmailContent;
    private validateCategory;
    private triggerInterestedNotifications;
    batchCategorizeUncategorized(limit?: number): Promise<void>;
    reclassifyEmail(emailId: string, forcedCategory: EmailCategory): Promise<void>;
}
export declare const aiCategorizationService: AiCategorizationService;
//# sourceMappingURL=aiCategorizationService.d.ts.map