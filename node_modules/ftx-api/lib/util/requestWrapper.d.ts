import { AxiosRequestConfig, Method } from 'axios';
import { RestClientOptions, GenericAPIResponse } from './requestUtils';
export default class RequestUtil {
    private timeOffset;
    private syncTimePromise;
    private options;
    private baseUrl;
    private globalRequestOptions;
    private key;
    private secret;
    constructor(key: string | undefined, secret: string | undefined, baseUrl: string, options?: RestClientOptions, requestOptions?: AxiosRequestConfig);
    get(endpoint: string, params?: any): GenericAPIResponse;
    post(endpoint: string, params?: any): GenericAPIResponse;
    delete(endpoint: string, params?: any): GenericAPIResponse;
    /**
     * @private Make a HTTP request to a specific endpoint. Private endpoints are automatically signed.
     */
    _call(method: Method, endpoint: string, params?: string | object): GenericAPIResponse;
    /**
     * @private generic handler to parse request exceptions
     */
    parseException(e: any): unknown;
    private getRequestSignature;
    /**
     * @private sign request and set recv window
     */
    signRequest(data: any): Promise<any>;
    /**
     * @private trigger time sync and store promise
     */
    syncTime(): GenericAPIResponse;
    /**
     * @deprecated move this somewhere else, because endpoints shouldn't be hardcoded here
     */
    getTimeOffset(): Promise<number>;
}
