"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWsFillEvent = exports.isWsTradesEvent = exports.isWsSubscribedEvent = exports.isActivePosition = void 0;
function isActivePosition(pos) {
    return pos.size !== 0;
}
exports.isActivePosition = isActivePosition;
function isWsSubscribedEvent(msg) {
    return msg && msg.type === 'subscribed';
}
exports.isWsSubscribedEvent = isWsSubscribedEvent;
function isWsTradesEvent(msg) {
    return msg && msg.channel === 'trades' && msg.type === 'update' && Array.isArray(msg.data);
}
exports.isWsTradesEvent = isWsTradesEvent;
function isWsFillEvent(msg) {
    return msg && msg.channel === 'fills' && msg.type === 'update';
}
exports.isWsFillEvent = isWsFillEvent;
//# sourceMappingURL=typeGuards.js.map