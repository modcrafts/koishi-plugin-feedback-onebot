import { Context, Schema } from "koishi";
interface Receiver {
    platform: string;
    selfId: string;
    channelId: string;
    guildId?: string;
}
declare const Receiver: Schema<Receiver>;
export interface Config {
    receivers?: Receiver[];
    replyTimeout?: number;
}
export declare const Config: Schema<Config>;
export declare const name = "feedback";
export declare function apply(ctx: Context, config: Config): void;
export {};
