"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRawWsMessage = exports.isPublicEndpoint = exports.getWsUrl = exports.getRestBaseUrl = exports.isFtxUS = exports.programKey = exports.programId2 = exports.programId = exports.serializeParamPayload = exports.serializeParams = void 0;
;
;
function serializeParams(params = {}, strict_validation = false) {
    return Object.keys(params)
        .sort()
        .map(key => {
        const value = params[key];
        if (strict_validation === true && typeof value === 'undefined') {
            throw new Error('Failed to sign API request due to undefined parameter');
        }
        return `${key}=${value}`;
    })
        .join('&');
}
exports.serializeParams = serializeParams;
;
function serializeParamPayload(isGetRequest, params, strictParamValidation) {
    if (!params) {
        return '';
    }
    if (!isGetRequest) {
        return JSON.stringify(params);
    }
    if (typeof params === 'string') {
        return '?' + params;
    }
    return '?' + serializeParams(params, strictParamValidation);
}
exports.serializeParamPayload = serializeParamPayload;
;
exports.programId = 'ftxnodeapi';
exports.programId2 = 'ftxnodeapi2';
exports.programKey = 'externalReferralProgram';
function isFtxUS(clientOptions) {
    return clientOptions.domain === 'ftxus';
}
exports.isFtxUS = isFtxUS;
function getRestBaseUrl(restClientOptions) {
    if (restClientOptions.baseUrl) {
        return restClientOptions.baseUrl;
    }
    if (isFtxUS(restClientOptions)) {
        return 'https://ftx.us/api';
    }
    return 'https://ftx.com/api';
}
exports.getRestBaseUrl = getRestBaseUrl;
;
function getWsUrl(options) {
    if (options.wsUrl) {
        return options.wsUrl;
    }
    if (isFtxUS(options)) {
        return 'wss://ftx.us/ws/';
    }
    return 'wss://ftx.com/ws/';
}
exports.getWsUrl = getWsUrl;
;
function isPublicEndpoint(endpoint) {
    if (endpoint.startsWith('https')) {
        return true;
    }
    if (endpoint.startsWith('v2/public')) {
        return true;
    }
    if (endpoint.startsWith('public/linear')) {
        return true;
    }
    return false;
}
exports.isPublicEndpoint = isPublicEndpoint;
;
function parseRawWsMessage(event) {
    if (typeof event === 'string') {
        const parsedEvent = JSON.parse(event);
        if (parsedEvent.data) {
            if (typeof parsedEvent.data === 'string') {
                return parseRawWsMessage(parsedEvent.data);
            }
            return parsedEvent.data;
        }
    }
    if (event === null || event === void 0 ? void 0 : event.data) {
        return JSON.parse(event.data);
    }
    return event;
}
exports.parseRawWsMessage = parseRawWsMessage;
//# sourceMappingURL=requestUtils.js.map