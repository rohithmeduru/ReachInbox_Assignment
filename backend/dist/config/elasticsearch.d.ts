export declare const esClient: any;
export declare const emailIndexName = "emails";
export declare const emailMapping: {
    mappings: {
        properties: {
            messageId: {
                type: string;
            };
            threadId: {
                type: string;
            };
            subject: {
                type: string;
                fields: {
                    keyword: {
                        type: string;
                    };
                };
            };
            from: {
                properties: {
                    email: {
                        type: string;
                    };
                    name: {
                        type: string;
                    };
                };
            };
            to: {
                properties: {
                    email: {
                        type: string;
                    };
                    name: {
                        type: string;
                    };
                };
            };
            body: {
                type: string;
            };
            htmlBody: {
                type: string;
            };
            date: {
                type: string;
            };
            accountId: {
                type: string;
            };
            folder: {
                type: string;
            };
            flags: {
                type: string;
            };
            attachments: {
                properties: {
                    filename: {
                        type: string;
                    };
                    contentType: {
                        type: string;
                    };
                    size: {
                        type: string;
                    };
                };
            };
            category: {
                type: string;
            };
            categoryConfidence: {
                type: string;
            };
            aiProcessed: {
                type: string;
            };
            createdAt: {
                type: string;
            };
            updatedAt: {
                type: string;
            };
        };
    };
};
//# sourceMappingURL=elasticsearch.d.ts.map