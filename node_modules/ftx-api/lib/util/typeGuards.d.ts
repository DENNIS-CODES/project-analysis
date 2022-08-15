import { ActiveFuturesPosition, FuturesPosition, WsEvent, WsEventSubscribed, WsEventTrades, WsFill } from "../";
export declare function isActivePosition(pos: FuturesPosition): pos is ActiveFuturesPosition;
export declare function isWsSubscribedEvent(msg: WsEvent): msg is WsEventSubscribed;
export declare function isWsTradesEvent(msg: WsEvent): msg is WsEventTrades;
export declare function isWsFillEvent(msg: WsEvent): msg is WsFill;
