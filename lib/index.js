var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/locales/zh-CN.yml
var require_zh_CN = __commonJS({
  "src/locales/zh-CN.yml"(exports2, module2) {
    module2.exports = { commands: { feedback: { description: "发送反馈信息给作者", options: { "receive.true": "添加到反馈频道列表", "receive.false": "从反馈频道列表移除" }, messages: { "expect-text": "请输入要发送的文本。", receive: "收到来自 {0} 的反馈信息：\n{1}", success: "反馈信息发送成功！", updated: "反馈频道更新成功！", "not-modified": "反馈频道没有改动。" } } } };
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  name: () => name
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var Receiver = import_koishi.Schema.object({
  platform: import_koishi.Schema.string().required().description("平台名称。"),
  selfId: import_koishi.Schema.string().required().description("机器人 ID。"),
  channelId: import_koishi.Schema.string().required().description("频道 ID。"),
  guildId: import_koishi.Schema.string().description("群组 ID。")
});
var Config = import_koishi.Schema.object({
  receivers: import_koishi.Schema.array(Receiver).role("table").hidden().description("反馈接收列表。"),
  replyTimeout: import_koishi.Schema.number().default(import_koishi.Time.day).description("反馈回复时限。")
});
var name = "feedback";
function apply(ctx, config) {
  ctx.i18n.define("zh-CN", require_zh_CN());
  const logger = ctx.logger("feedback");
  const feedbacks = {};
  ctx.command("feedback <message:text>").userFields(["name", "id"]).option("receive", "-r", { authority: 3, value: true }).option("receive", "-R", { authority: 3, value: false }).action(async ({ session, options }, text) => {
    if (typeof options.receive === "boolean") {
      const index = config.receivers.findIndex((receiver) => {
        return (0, import_koishi.deepEqual)(
          (0, import_koishi.pick)(receiver, ["platform", "selfId", "channelId", "guildId"]),
          (0, import_koishi.pick)(session, ["platform", "selfId", "channelId", "guildId"])
        );
      });
      if (options.receive) {
        if (index >= 0) return session.text(".not-modified");
        config.receivers.push(
          (0, import_koishi.pick)(session, ["platform", "selfId", "channelId", "guildId"])
        );
        logger.info(
          `add receiver ${session.platform}:${session.selfId}:${session.channelId}:${session.guildId}`
        );
      } else {
        if (index < 0) return session.text(".not-modified");
        config.receivers.splice(index, 1);
        logger.info(
          `remove receiver ${session.platform}:${session.selfId}:${session.channelId}:${session.guildId}`
        );
      }
      ctx.scope.update(config, false);
      return session.text(".updated");
    }
    if (!text) return session.text(".expect-text");
    const { username: name2, userId } = session;
    const nickname = name2 === "" + userId ? userId : `${name2} (${userId})`;
    const message = session.text(".receive", [nickname, text]);
    const delay = ctx.root.config.delay.broadcast;
    const data = [
      session.sid,
      session.channelId,
      session.guildId,
      session.userId,
      session.isDirect
    ];
    for (let index = 0; index < config.receivers.length; ++index) {
      if (index && delay) await (0, import_koishi.sleep)(delay);
      const { platform, selfId, channelId, guildId } = config.receivers[index];
      const bot = ctx.bots.find(
        (bot2) => bot2.platform === platform && bot2.selfId === selfId
      );
      if (!bot) {
        logger.warn(`cannot find bot (${platform}:${selfId})`);
        continue;
      }
      await bot.sendMessage(channelId, message, guildId).then(
        (ids) => {
          for (const id of ids) {
            feedbacks[id] = data;
            ctx.setTimeout(() => delete feedbacks[id], config.replyTimeout);
          }
        },
        (error) => {
          logger.warn(error);
        }
      );
    }
    return session.text(".success");
  });
  ctx.middleware(async (session, next) => {
    const { quote, stripped } = session;
    if (!stripped.content || !quote) return next();
    const data = feedbacks[quote.id];
    if (!data) return next();
    if (data[4] && data[3]) {
      await ctx.bots[data[0]].sendPrivateMessage(
        data[3],
        stripped.content,
        data[2]
      );
    } else {
      await ctx.bots[data[0]].sendMessage(data[1], stripped.content, data[2]);
    }
  });
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  name
});
//# sourceMappingURL=index.js.map
