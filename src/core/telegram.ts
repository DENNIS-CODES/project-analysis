import { Context, Telegraf, Markup } from "telegraf";
import { configs } from "../config/config";
import { normalizeMessage } from "../utils";

const bot = new Telegraf(configs.BOT_TOKEN);

const messageHome = async (message: string, ctx: Context) => {
  return ctx.replyWithMarkdown(message);
};

bot.use(async (ctx: any, next: any) => {
  try {
    const params = ctx.message?.from ? ctx?.message?.from : "undefined";

    const { id, first_name, last_name, username } = params;

    if (!configs.WHITELISTED_USERS.includes(id)) {
      return ctx.reply(
        `Hello ${
          first_name || last_name || username
        }, You are not whitelisted to receive notifications`
      );
    }
    await next();
  } catch (error) {
    console.log(error);
  }
});

bot.start(async (ctx: any) => {
  const defaultMessage =
    `Hello Welcome to ${ctx?.me}, an Arbitrage notification Bot Powered by NGENI.IO🔥`.replaceAll(
      "_",
      "\\_"
    );
  await messageHome(defaultMessage, ctx);
});

const sendMessage = async (
  message: string,
  delete_message: boolean = false
) => {
  try {
    for (const id of configs.WHITELISTED_USERS) {
      await bot.telegram
        .sendMessage(id, normalizeMessage(message), {
          parse_mode: "MarkdownV2",
          disable_web_page_preview: true,
        })
        .then(({ message_id }) => {
          if (delete_message) {
            setTimeout(
              () => bot.telegram.deleteMessage(id, message_id),
              configs.TELEGRAM_DELETE_MESSAGE_INTERVAL
            );
          }
        })
        .catch((error: any) => {
          console.error(`Error:`, error);
        });
    }
  } catch (error) {
    console.log(error);
  }
};

export { bot, sendMessage };
