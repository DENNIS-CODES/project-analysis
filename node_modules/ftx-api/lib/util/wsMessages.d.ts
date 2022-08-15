export declare function getWsAuthMessage(key: string, signature: string, timestamp: number, subAccountName?: string): any;
export declare function getWsPingMessage(): {
    op: string;
};
export declare function isWsPong(message: any): boolean;
