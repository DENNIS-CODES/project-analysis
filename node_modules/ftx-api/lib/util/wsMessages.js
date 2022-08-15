"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWsPong = exports.getWsPingMessage = exports.getWsAuthMessage = void 0;
function getWsAuthMessage(key, signature, timestamp, subAccountName) {
    const msg = {
        op: 'login',
        args: {
            key: key,
            sign: signature,
            time: timestamp
        }
    };
    if (subAccountName) {
        msg.args.subaccount = subAccountName;
    }
    return msg;
}
exports.getWsAuthMessage = getWsAuthMessage;
;
function getWsPingMessage() {
    return { op: 'ping' };
}
exports.getWsPingMessage = getWsPingMessage;
;
function isWsPong(message) {
    return (message === null || message === void 0 ? void 0 : message.type) === 'pong';
}
exports.isWsPong = isWsPong;
;
//# sourceMappingURL=wsMessages.js.map