import express from "express";
import expressWs from "express-ws";
import GSMHandler from "./GSMHandler";
import { SendSMSCallback, SMSMessage } from "./ModemTypes";
import { MessageStore } from "./MessageStore";
import { gsmRouter } from "./routes/gsm";
import { sqliteRouter } from "./routes/sqlite";
import "dotenv/config";

const app = express();
app.use(express.json());
const expressWebsocket = expressWs(app);

/**
 * Websocket routing and logging
 */

expressWebsocket.app.ws("/ws", function (ws, req) {
  ws.on("message", console.log);
  ws.on("open", (data: any) =>
    console.log(`New websocket connection: ${data}`)
  );
});

app.use(gsmRouter);
app.use(sqliteRouter);

app.listen(4000);

/**
 * GSM Handler instance
 * @const
 */

export const gsmHandler = new GSMHandler();

/**
 * SQLite message store instance
 * @const
 */

export const messageStore = new MessageStore(process.env.SQLITE_PATH as string);

/**
 * Event handler for new messages received
 * Emits an event to each WebSocket connection
 * Saves the message to the SQLite database
 * Deletes the message from the SIM card
 * @function
 */

gsmHandler.on("newMessage", async (messages: SMSMessage[]) => {
  messages.forEach(async (message) => {
    try {
      expressWebsocket.getWss().clients.forEach((c) =>
        c.send(
          JSON.stringify({
            type: "newMessage",
            message,
          })
        )
      );
      await messageStore.saveMessage(message);
      await gsmHandler.deleteMessage(message.index);
    } catch (error) {
      console.error(error);
    }
  });
});

/**
 * Event handler for sent messages
 * Emits an event to each WebSocket connection
 * Saves the message to the SQLite database
 * @function
 */

gsmHandler.on("sentMessage", async (sentMessage: SendSMSCallback) => {
  try {
    expressWebsocket.getWss().clients.forEach((c) =>
      c.send(
        JSON.stringify({
          type: "sentMessage",
          sentMessage,
        })
      )
    );
    await messageStore.saveSentMessage(
      sentMessage.data.message,
      sentMessage.data.recipient
    );
  } catch (error) {
    console.error(error);
  }
});
