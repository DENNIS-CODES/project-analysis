import 'dotenv/config'

export const configs = {
      /**
   * FTX configs
   */
  API_KEY: process.env.API_KEY || "",
  API_SECRET: process.env.API_SECRET || "",
  ACCOUNT_NAME: process.env.ACCOUNT_NAME || "",
  SUB_API_KEY: process.env.SUB_API_KEY || "",
  SUB_API_SECRET: process.env.SUB_API_SECRET || "",
  SUB_ALT_THREE: process.env.SUB_ALT_THREE || "",
  MAX_RETRIES: 50,
  /**
   * TELEGRAM configs
   */
  BOT_TOKEN: process.env.BOT_TOKEN!,
  BOT_TOKEN2: process.env.BOT_TOKEN2!,
  WHITELISTED_USERS: [1195869296],
  TELEGRAM_DELETE_MESSAGE_INTERVAL: 1,

  /**
   * google sheet configs
  */
   google_key: process.env.gcp_sheets_key || "",
   google_email: process.env.gcp_sheets_email || "",
   sheed_id: process.env.sheet_id || "",

  DB_URL: process.env.DB_URL!,
  /**
   * CHECK_PRICE_INTERVAL Price check interval in minutes
   */
  CHECK_PRICE_INTERVAL: 10,
}
