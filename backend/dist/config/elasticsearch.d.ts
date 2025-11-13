import { Client } from '@elastic/elasticsearch';
import type { MappingProperty } from '@elastic/elasticsearch';
export declare const esClient: Client;
export declare const emailIndexName = "emails";
export declare const emailMapping: {
    mappings: {
        properties: {
            messageId: MappingProperty;
            threadId: MappingProperty;
            subject: MappingProperty;
            from: MappingProperty;
            to: MappingProperty;
            body: MappingProperty;
            htmlBody: MappingProperty;
            date: MappingProperty;
            accountId: MappingProperty;
            folder: MappingProperty;
            flags: MappingProperty;
            attachments: MappingProperty;
            category: MappingProperty;
            categoryConfidence: MappingProperty;
            aiProcessed: MappingProperty;
            createdAt: MappingProperty;
            updatedAt: MappingProperty;
        };
    };
};
//# sourceMappingURL=elasticsearch.d.ts.map