export declare class AiReplyService {
    private knowledgeBase;
    generateReplySuggestion(emailId: string): Promise<{
        suggestion: string;
        confidence: number;
        reasoning?: string;
    }>;
    private findRelevantKnowledge;
    private calculateConfidence;
    addToKnowledgeBase(fact: string): Promise<void>;
    getKnowledgeBase(): string[];
    generateMultipleSuggestions(emailId: string, count?: number): Promise<{
        suggestions: Array<{
            text: string;
            confidence: number;
            tone: string;
        }>;
    }>;
    refineReply(emailId: string, originalSuggestion: string, feedback: string): Promise<{
        refinedSuggestion: string;
        confidence: number;
    }>;
}
export declare const aiReplyService: AiReplyService;
//# sourceMappingURL=aiReplyService.d.ts.map