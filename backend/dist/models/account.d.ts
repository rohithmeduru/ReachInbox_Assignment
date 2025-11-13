export interface EmailAccount {
    id: string;
    email: string;
    name: string;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    isActive: boolean;
    lastSync?: Date;
    syncFolders: string[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=account.d.ts.map