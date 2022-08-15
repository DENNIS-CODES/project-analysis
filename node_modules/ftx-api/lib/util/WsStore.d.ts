/// <reference types="node" />
import WebSocket from 'isomorphic-ws';
import { WsConnectionState } from '../websocket-client';
import { DefaultLogger } from '../logger';
import { WsChannel, WsTopic } from '../types/websockets';
declare type WsTopicList = Set<WsTopic>;
declare type KeyedWsTopicLists = {
    [key: string]: WsTopicList;
};
interface WsStoredState {
    ws?: WebSocket;
    connectionState?: WsConnectionState;
    activePingTimer?: NodeJS.Timeout | undefined;
    activePongTimer?: NodeJS.Timeout | undefined;
    subscribedTopics: WsTopicList;
}
export default class WsStore {
    private wsState;
    private logger;
    constructor(logger: typeof DefaultLogger);
    get(key: string, createIfMissing?: boolean): WsStoredState | undefined;
    getKeys(): string[];
    create(key: string): WsStoredState | undefined;
    delete(key: string): void;
    hasExistingActiveConnection(key: string): boolean | undefined;
    getWs(key: string): WebSocket | undefined;
    setWs(key: string, wsConnection: WebSocket): WebSocket;
    isWsOpen(key: string): boolean;
    getConnectionState(key: string): WsConnectionState;
    setConnectionState(key: string, state: WsConnectionState): void;
    isConnectionState(key: string, state: WsConnectionState): boolean;
    getTopics(key: string): WsTopicList;
    getTopicsByKey(): KeyedWsTopicLists;
    getMatchingTopic(key: string, topic: WsTopic | WsChannel): any;
    addTopic(key: string, topic: WsTopic | WsChannel): any;
    deleteTopic(key: string, topic: WsTopic | WsChannel): WsTopicList;
}
export {};
