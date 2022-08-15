import { AxiosRequestConfig } from 'axios';
export declare type FtxDomain = 'ftxcom' | 'ftxus';
export interface RestClientOptions {
    recv_window?: number;
    sync_interval_ms?: number | string;
    disable_time_sync?: boolean;
    strict_param_validation?: boolean;
    baseUrl?: string;
    parse_exceptions?: boolean;
    subAccountName?: string;
    domain?: FtxDomain;
}
export interface WSClientConfigurableOptions {
    key?: string;
    secret?: string;
    subAccountName?: string;
    pongTimeout?: number;
    pingInterval?: number;
    reconnectTimeout?: number;
    restOptions?: RestClientOptions;
    requestOptions?: AxiosRequestConfig;
    reconnectOnClose?: boolean;
    wsUrl?: string;
    domain?: FtxDomain;
}
export interface WebsocketClientOptions extends WSClientConfigurableOptions {
    pongTimeout: number;
    pingInterval: number;
    reconnectTimeout: number;
    reconnectOnClose: boolean;
}
export declare type GenericAPIResponse = Promise<any>;
export declare function serializeParams(params?: object, strict_validation?: boolean): string;
export declare function serializeParamPayload(isGetRequest: boolean, params?: string | object, strictParamValidation?: boolean): string | undefined;
export declare type apiNetwork = 'ftxcom' | 'ftxus';
export declare const programId = "ftxnodeapi";
export declare const programId2 = "ftxnodeapi2";
export declare const programKey = "externalReferralProgram";
export declare function isFtxUS(clientOptions: RestClientOptions | WebsocketClientOptions): boolean;
export declare function getRestBaseUrl(restClientOptions: RestClientOptions): string;
export declare function getWsUrl(options: WebsocketClientOptions): string;
export declare function isPublicEndpoint(endpoint: string): boolean;
export declare function parseRawWsMessage(event: MessageEvent): any;
