import { configs } from "./config/config";
import { sendMessage, bot } from "./core/telegram";
import express, { Request, Response } from "express";
import cors from "cors";

const start = async () => {
  console.log(`...`.repeat(3));
  console.log(`Firing up🚀🚀🚀`);
  console.log(`...`.repeat(3));
  console.log(`- - -`.repeat(5));
  console.log(`Re/Starting...`);

  try {
    console.log("Connecting to Telegram bot...\n---");
    await bot
      .launch()
      .then((_result: any) => {
        console.log("Telegram Connected🦾🦾");

        sendMessage(
          `Bot started at ${new Date()
            .toString()
            .replaceAll("(", "\\(")
            .replaceAll(")", "\\)")}...`
        );
      })
      .catch((error: any) => {
        console.log("Telegram error😪:", JSON.parse(JSON.stringify(error)));
      });
  } catch (error) {
    console.log(error);
  }
};
start();

const Main = async () => {
  try {
    const PORT = 5858;
    const app = express();
    app.use(express());
    app.use(cors());
    app.use(
      express.json({
        type: ["application/json", "text/plain"],
      })
    );
    app.use(
      express.urlencoded({
        extended: true,
      })
    );

    app.post(
      "/priceanlysis/api/v1/alerts",
      async (req: Request, res: Response) => {
        const { close, high, low, open, volume } = req.body;
        let message = `\nTV: \`${high}\` | \`${low}\` | \`${volume}\` | \`${open}\` | \`${close}\``;
        sendMessage(message);
        return res.status(200).json({
          error: false,
          message: "message successfully sent",
        });
      }
    );
  } catch (error) {
    console.log(error);
  }
};
Main();
