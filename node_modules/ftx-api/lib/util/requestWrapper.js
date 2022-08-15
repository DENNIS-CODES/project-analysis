"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const node_support_1 = require("./node-support");
const requestUtils_1 = require("./requestUtils");
const getHeader = (headerId, domain = 'ftxcom') => {
    if (domain === 'ftxcom') {
        switch (headerId) {
            case 'key':
                return 'FTX-KEY';
            case 'ts':
                return 'FTX-TS';
            case 'sign':
                return 'FTX-SIGN';
            case 'subaccount':
                return 'FTX-SUBACCOUNT';
        }
    }
    if (domain === 'ftxus') {
        switch (headerId) {
            case 'key':
                return 'FTXUS-KEY';
            case 'ts':
                return 'FTXUS-TS';
            case 'sign':
                return 'FTXUS-SIGN';
            case 'subaccount':
                return 'FTXUS-SUBACCOUNT';
        }
    }
    console.warn('Unknown header requested: ', { headerId, domain });
    return 'null';
};
class RequestUtil {
    constructor(key, secret, baseUrl, options = {}, requestOptions = {}) {
        this.timeOffset = null;
        this.syncTimePromise = null;
        this.options = Object.assign({ recv_window: 5000, 
            // how often to sync time drift with exchange servers
            sync_interval_ms: 3600000, 
            // if true, we'll throw errors if any params are undefined
            strict_param_validation: false }, options);
        this.globalRequestOptions = Object.assign({ 
            // in ms == 5 minutes by default
            timeout: 1000 * 60 * 5, headers: {} }, requestOptions);
        if (typeof key === 'string') {
            this.globalRequestOptions.headers[getHeader('key', options.domain)] = key;
        }
        if (typeof this.options.subAccountName === 'string') {
            this.globalRequestOptions.headers[getHeader('subaccount', options.domain)] = this.options.subAccountName;
        }
        this.baseUrl = baseUrl;
        if (key && !secret) {
            throw new Error('API Key & Secret are both required for private endpoints');
        }
        if (this.options.disable_time_sync !== true) {
            this.syncTime();
            setInterval(this.syncTime.bind(this), +this.options.sync_interval_ms);
        }
        this.key = key;
        this.secret = secret;
    }
    get(endpoint, params) {
        return this._call('GET', endpoint, params);
    }
    post(endpoint, params) {
        return this._call('POST', endpoint, Object.assign(Object.assign({}, params), { [requestUtils_1.programKey]: requestUtils_1.isFtxUS(this.options) ? requestUtils_1.programId : requestUtils_1.programId2 }));
    }
    delete(endpoint, params) {
        return this._call('DELETE', endpoint, params);
    }
    /**
     * @private Make a HTTP request to a specific endpoint. Private endpoints are automatically signed.
     */
    _call(method, endpoint, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = Object.assign(Object.assign({}, this.globalRequestOptions), { method: method, json: true });
            options.url = endpoint.startsWith('https') ? endpoint : [this.baseUrl, endpoint].join('/');
            const isGetRequest = method === 'GET';
            const serialisedParams = requestUtils_1.serializeParamPayload(isGetRequest, params, this.options.strict_param_validation);
            // Add request sign
            if (this.key && this.secret) {
                if (this.timeOffset === null && !this.options.disable_time_sync) {
                    yield this.syncTime();
                }
                const { timestamp, sign } = yield this.getRequestSignature(method, endpoint, this.secret, serialisedParams);
                options.headers[getHeader('ts', this.options.domain)] = String(timestamp);
                options.headers[getHeader('sign', this.options.domain)] = sign;
            }
            if (isGetRequest) {
                options.url += serialisedParams;
            }
            else {
                options.data = params;
            }
            return axios_1.default(options).then(response => {
                if (response.status == 200) {
                    return response.data;
                }
                throw response;
            }).catch(e => this.parseException(e));
        });
    }
    /**
     * @private generic handler to parse request exceptions
     */
    parseException(e) {
        if (this.options.parse_exceptions === false) {
            throw e;
        }
        // Something happened in setting up the request that triggered an Error
        if (!e.response) {
            if (!e.request) {
                throw e.message;
            }
            // request made but no response received
            throw e;
        }
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const response = e.response;
        throw {
            code: response.status,
            message: response.statusText,
            body: response.data,
            headers: response.headers,
            requestOptions: this.options
        };
    }
    getRequestSignature(method, endpoint, secret, serialisedParams = '') {
        return __awaiter(this, void 0, void 0, function* () {
            const timestamp = Date.now() + (this.timeOffset || 0);
            if (!secret) {
                return {
                    timestamp,
                    sign: ''
                };
            }
            let signature_payload;
            if (serialisedParams === '?') {
                signature_payload = `${timestamp}${method}/api/${endpoint}`;
            }
            else {
                signature_payload = `${timestamp}${method}/api/${endpoint}${serialisedParams}`;
            }
            return {
                timestamp,
                sign: yield node_support_1.signMessage(signature_payload, secret)
            };
        });
    }
    /**
     * @private sign request and set recv window
     */
    signRequest(data) {
        const params = Object.assign(Object.assign({}, data), { api_key: this.key, timestamp: Date.now() + (this.timeOffset || 0) });
        // Optional, set to 5000 by default. Increase if timestamp/recv_window errors are seen.
        if (this.options.recv_window && !params.recv_window) {
            params.recv_window = this.options.recv_window;
        }
        if (this.key && this.secret) {
            const serializedParams = requestUtils_1.serializeParams(params, this.options.strict_param_validation);
            params.sign = node_support_1.signMessage(serializedParams, this.secret);
        }
        return params;
    }
    /**
     * @private trigger time sync and store promise
     */
    syncTime() {
        if (this.options.disable_time_sync === true) {
            return Promise.resolve(false);
        }
        if (this.syncTimePromise !== null) {
            return this.syncTimePromise;
        }
        this.syncTimePromise = this.getTimeOffset().then(offset => {
            this.timeOffset = offset;
            this.syncTimePromise = null;
        });
        return this.syncTimePromise;
    }
    /**
     * @deprecated move this somewhere else, because endpoints shouldn't be hardcoded here
     */
    getTimeOffset() {
        return __awaiter(this, void 0, void 0, function* () {
            const start = Date.now();
            try {
                const response = yield this.get('https://otc.ftx.com/api/time');
                const result = new Date(response.result).getTime();
                const end = Date.now();
                return Math.ceil(result - end + ((end - start) / 2));
            }
            catch (e) {
                return 0;
            }
        });
    }
}
exports.default = RequestUtil;
;
//# sourceMappingURL=requestWrapper.js.map