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
exports.WebsocketClient = exports.wsKeyGeneral = exports.WsConnectionState = void 0;
const events_1 = require("events");
const rest_client_1 = require("./rest-client");
const logger_1 = require("./logger");
const requestUtils_1 = require("./util/requestUtils");
const isomorphic_ws_1 = __importDefault(require("isomorphic-ws"));
const WsStore_1 = __importDefault(require("./util/WsStore"));
const wsMessages_1 = require("./util/wsMessages");
const node_support_1 = require("./util/node-support");
const loggerCategory = { category: 'ftx-ws' };
const READY_STATE_INITIAL = 0;
const READY_STATE_CONNECTING = 1;
const READY_STATE_CONNECTED = 2;
const READY_STATE_CLOSING = 3;
const READY_STATE_RECONNECTING = 4;
var WsConnectionState;
(function (WsConnectionState) {
    WsConnectionState[WsConnectionState["READY_STATE_INITIAL"] = 0] = "READY_STATE_INITIAL";
    WsConnectionState[WsConnectionState["READY_STATE_CONNECTING"] = 1] = "READY_STATE_CONNECTING";
    WsConnectionState[WsConnectionState["READY_STATE_CONNECTED"] = 2] = "READY_STATE_CONNECTED";
    WsConnectionState[WsConnectionState["READY_STATE_CLOSING"] = 3] = "READY_STATE_CLOSING";
    WsConnectionState[WsConnectionState["READY_STATE_RECONNECTING"] = 4] = "READY_STATE_RECONNECTING";
})(WsConnectionState = exports.WsConnectionState || (exports.WsConnectionState = {}));
;
exports.wsKeyGeneral = 'ftx';
;
class WebsocketClient extends events_1.EventEmitter {
    constructor(options, logger) {
        var _a;
        super();
        this.logger = logger || logger_1.DefaultLogger;
        this.wsStore = new WsStore_1.default(this.logger);
        this.options = Object.assign({ pongTimeout: 7500, pingInterval: 10000, reconnectTimeout: 500, reconnectOnClose: true }, options);
        if (options.domain != ((_a = this.options.restOptions) === null || _a === void 0 ? void 0 : _a.domain)) {
            this.options.restOptions = Object.assign(Object.assign({}, this.options.restOptions), { domain: options.domain });
        }
        this.restClient = new rest_client_1.RestClient(undefined, undefined, this.options.restOptions, this.options.requestOptions);
    }
    isLivenet() {
        return true;
    }
    /**
     * Add topic/topics to WS subscription list
     */
    subscribe(wsTopics) {
        const mixedTopics = Array.isArray(wsTopics) ? wsTopics : [wsTopics];
        const topics = mixedTopics.map(topic => {
            return typeof topic === 'string' ? { channel: topic } : topic;
        });
        topics.forEach(topic => this.wsStore.addTopic(this.getWsKeyForTopic(topic), topic));
        // attempt to send subscription topic per websocket
        this.wsStore.getKeys().forEach(wsKey => {
            // if connected, send subscription request
            if (this.wsStore.isConnectionState(wsKey, READY_STATE_CONNECTED)) {
                return this.requestSubscribeTopics(wsKey, topics);
            }
            // start connection process if it hasn't yet begun. Topics are automatically subscribed to on-connect
            if (!this.wsStore.isConnectionState(wsKey, READY_STATE_CONNECTING) &&
                !this.wsStore.isConnectionState(wsKey, READY_STATE_RECONNECTING)) {
                return this.connect(wsKey);
            }
        });
    }
    /**
     * Remove topic/topics from WS subscription list
     */
    unsubscribe(wsTopics) {
        const mixedTopics = Array.isArray(wsTopics) ? wsTopics : [wsTopics];
        const topics = mixedTopics.map(topic => {
            return typeof topic === 'string' ? { channel: topic } : topic;
        });
        topics.forEach(topic => this.wsStore.deleteTopic(this.getWsKeyForTopic(topic), topic));
        this.wsStore.getKeys().forEach(wsKey => {
            // unsubscribe request only necessary if active connection exists
            if (this.wsStore.isConnectionState(wsKey, READY_STATE_CONNECTED)) {
                this.requestUnsubscribeTopics(wsKey, topics);
            }
        });
    }
    close(wsKey) {
        var _a;
        this.logger.info('Closing connection', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
        this.setWsState(wsKey, READY_STATE_CLOSING);
        this.clearPingTimer(wsKey);
        this.clearPongTimer(wsKey);
        (_a = this.getWs(wsKey)) === null || _a === void 0 ? void 0 : _a.close();
    }
    /**
     * Request connection of all dependent websockets, instead of waiting for automatic connection by library
     */
    connectAll() {
        return [this.connect(exports.wsKeyGeneral)];
    }
    connect(wsKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.wsStore.isWsOpen(wsKey)) {
                    this.logger.error('Refused to connect to ws with existing active connection', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
                    return this.wsStore.getWs(wsKey);
                }
                if (this.wsStore.isConnectionState(wsKey, READY_STATE_CONNECTING)) {
                    this.logger.error('Refused to connect to ws, connection attempt already active', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
                    return;
                }
                if (!this.wsStore.getConnectionState(wsKey) ||
                    this.wsStore.isConnectionState(wsKey, READY_STATE_INITIAL)) {
                    this.setWsState(wsKey, READY_STATE_CONNECTING);
                }
                const url = requestUtils_1.getWsUrl(this.options);
                const ws = this.connectToWsUrl(url, wsKey);
                return this.wsStore.setWs(wsKey, ws);
            }
            catch (err) {
                this.parseWsError('Connection failed', err, wsKey);
                this.reconnectWithDelay(wsKey, this.options.reconnectTimeout);
                this.emit('error', { error: err, wsKey, type: 'CONNECTION_FAILED' });
            }
        });
    }
    requestTryAuthenticate(wsKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const { key, secret, subAccountName } = this.options;
            if (!key || !secret) {
                this.logger.debug(`Connection "${wsKey}" will remain unauthenticated due to missing key/secret`);
                return;
            }
            const timestamp = new Date().getTime();
            const authMsg = wsMessages_1.getWsAuthMessage(key, yield node_support_1.signWsAuthenticate(timestamp, secret), timestamp, subAccountName);
            this.tryWsSend(wsKey, JSON.stringify(authMsg));
        });
    }
    parseWsError(context, error, wsKey) {
        const logContext = Object.assign(Object.assign({}, loggerCategory), { wsKey, error });
        if (!error.message) {
            this.logger.error(`${context} due to unexpected error: `, logContext);
            return;
        }
        switch (error.message) {
            case 'Unexpected server response: 401':
                this.logger.error(`${context} due to 401 authorization failure.`, logContext);
                break;
            default:
                this.logger.error(`${context} due to unexpected response error: ${(error === null || error === void 0 ? void 0 : error.msg) || (error === null || error === void 0 ? void 0 : error.message) || error}`, logContext);
                break;
        }
    }
    /**
     * Return params required to make authorized request
     */
    getAuthParams(wsKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const { key, secret } = this.options;
            if (key && secret) {
                this.logger.debug('Getting auth\'d request params', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
                const timeOffset = yield this.restClient.getTimeOffset();
                const params = {
                    api_key: this.options.key,
                    expires: (Date.now() + timeOffset + 5000)
                };
                params.signature = node_support_1.signMessage('GET/realtime' + params.expires, secret);
                return params;
            }
            else if (!key || !secret) {
                this.logger.warning('Connot authenticate websocket, either api or private keys missing.', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
            }
            else {
                this.logger.debug('Starting public only websocket client.', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
            }
            return '';
        });
    }
    reconnectWithDelay(wsKey, connectionDelayMs) {
        this.clearPingTimer(wsKey);
        this.clearPongTimer(wsKey);
        if (this.wsStore.getConnectionState(wsKey) !== READY_STATE_CONNECTING) {
            this.setWsState(wsKey, READY_STATE_RECONNECTING);
        }
        setTimeout(() => {
            this.logger.info('Reconnecting to websocket', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
            this.connect(wsKey);
        }, connectionDelayMs);
    }
    ping(wsKey) {
        this.clearPongTimer(wsKey);
        this.logger.silly('Sending ping', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
        this.tryWsSend(wsKey, JSON.stringify({ op: 'ping' }));
        this.wsStore.get(wsKey, true).activePongTimer = setTimeout(() => {
            var _a;
            this.logger.info('Pong timeout - clearing timers & closing socket to reconnect', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
            this.clearPingTimer(wsKey);
            this.clearPongTimer(wsKey);
            (_a = this.getWs(wsKey)) === null || _a === void 0 ? void 0 : _a.close();
        }, this.options.pongTimeout);
    }
    // Send a ping at intervals
    clearPingTimer(wsKey) {
        const wsState = this.wsStore.get(wsKey);
        if (wsState === null || wsState === void 0 ? void 0 : wsState.activePingTimer) {
            clearInterval(wsState.activePingTimer);
            wsState.activePingTimer = undefined;
        }
    }
    // Expect a pong within a time limit
    clearPongTimer(wsKey) {
        const wsState = this.wsStore.get(wsKey);
        if (wsState === null || wsState === void 0 ? void 0 : wsState.activePongTimer) {
            clearTimeout(wsState.activePongTimer);
            wsState.activePongTimer = undefined;
        }
    }
    /**
     * Send WS message to subscribe to topics.
     */
    requestSubscribeTopics(wsKey, topics) {
        topics.forEach(topic => {
            const wsMessage = JSON.stringify(Object.assign({ op: 'subscribe' }, topic));
            this.tryWsSend(wsKey, wsMessage);
        });
    }
    /**
     * Send WS message to unsubscribe from topics.
     */
    requestUnsubscribeTopics(wsKey, topics) {
        topics.forEach(topic => {
            const wsMessage = JSON.stringify(Object.assign({ op: 'unsubscribe' }, topic));
            this.tryWsSend(wsKey, wsMessage);
        });
    }
    tryWsSend(wsKey, wsMessage) {
        var _a;
        try {
            this.logger.silly(`Sending upstream ws message: `, Object.assign(Object.assign({}, loggerCategory), { wsMessage, wsKey }));
            if (!wsKey) {
                throw new Error('Cannot send message due to no known websocket for this wsKey');
            }
            (_a = this.getWs(wsKey)) === null || _a === void 0 ? void 0 : _a.send(wsMessage);
        }
        catch (e) {
            this.logger.error(`Failed to send WS message`, Object.assign(Object.assign({}, loggerCategory), { wsMessage, wsKey, exception: e }));
        }
    }
    connectToWsUrl(url, wsKey) {
        this.logger.silly(`Opening WS connection to URL: ${url}`, Object.assign(Object.assign({}, loggerCategory), { wsKey }));
        const ws = new isomorphic_ws_1.default(url);
        ws.onopen = event => this.onWsOpen(event, wsKey);
        ws.onmessage = event => this.onWsMessage(event, wsKey);
        ws.onerror = event => this.onWsError(event, wsKey);
        ws.onclose = event => this.onWsClose(event, wsKey);
        return ws;
    }
    onWsOpen(event, wsKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.wsStore.isConnectionState(wsKey, READY_STATE_CONNECTING)) {
                this.logger.info('Websocket connected', Object.assign(Object.assign({}, loggerCategory), { wsKey, livenet: this.isLivenet() }));
                this.emit('open', { wsKey, event });
            }
            else if (this.wsStore.isConnectionState(wsKey, READY_STATE_RECONNECTING)) {
                this.logger.info('Websocket reconnected', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
                this.emit('reconnected', { wsKey, event });
            }
            this.setWsState(wsKey, READY_STATE_CONNECTED);
            yield this.requestTryAuthenticate(wsKey);
            this.requestSubscribeTopics(wsKey, [...this.wsStore.getTopics(wsKey)]);
            this.wsStore.get(wsKey, true).activePingTimer = setInterval(() => this.ping(wsKey), this.options.pingInterval);
        });
    }
    onWsMessage(event, wsKey) {
        try {
            this.clearPongTimer(wsKey);
            const msg = requestUtils_1.parseRawWsMessage(event);
            if (msg.channel) {
                this.emit('update', msg);
            }
            else {
                this.logger.debug('Websocket event: ', event.data || event);
                this.onWsMessageResponse(msg, wsKey);
            }
        }
        catch (e) {
            this.logger.error('Exception parsing ws message: ', Object.assign(Object.assign({}, loggerCategory), { rawEvent: event, wsKey, error: e }));
            this.emit('error', { wsKey, error: e, rawEvent: event });
        }
    }
    onWsError(err, wsKey) {
        this.parseWsError('Websocket error', err, wsKey);
        if (this.wsStore.isConnectionState(wsKey, READY_STATE_CONNECTED)) {
            this.emit('error', err);
        }
    }
    onWsClose(event, wsKey) {
        this.logger.info('Websocket connection closed', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
        if (this.wsStore.getConnectionState(wsKey) !== READY_STATE_CLOSING && this.options.reconnectOnClose) {
            this.reconnectWithDelay(wsKey, this.options.reconnectTimeout);
            this.emit('reconnect');
        }
        else {
            this.setWsState(wsKey, READY_STATE_INITIAL);
            this.emit('close');
        }
    }
    onWsMessageResponse(response, wsKey) {
        if (wsMessages_1.isWsPong(response)) {
            this.logger.silly('Received pong', Object.assign(Object.assign({}, loggerCategory), { wsKey }));
            this.clearPongTimer(wsKey);
        }
        else {
            this.emit('response', response);
        }
    }
    getWs(wsKey) {
        return this.wsStore.getWs(wsKey);
    }
    setWsState(wsKey, state) {
        this.wsStore.setConnectionState(wsKey, state);
    }
    getWsKeyForTopic(topic) {
        return exports.wsKeyGeneral;
    }
}
exports.WebsocketClient = WebsocketClient;
;
//# sourceMappingURL=websocket-client.js.map