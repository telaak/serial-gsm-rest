import GSMHandler from "./GSMHandler";
import { SendSMSCallback, SMSMessage } from "./ModemTypes";
import { MessageStore } from "./MessageStore";
import { SocketHandler } from "./SocketHandler";
import HyperExpress from "hyper-express";
import { gsmRouter } from "./routes/gsm";
import { sqliteRouter } from "./routes/sqlite";

/**
 * HyperExpress Server instance
 * @const
 */

export const Server = new HyperExpress.Server();

/**
 * WebSocket handler instance
 * @constant
 */

export const socket = new SocketHandler();

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
      socket.emitWs(
        JSON.stringify({
          type: "newMessage",
          message,
        })
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
    socket.emitWs(
      JSON.stringify({
        type: "sentMessage",
        sentMessage,
      })
    );
    await messageStore.saveSentMessage(
      sentMessage.data.message,
      sentMessage.data.recipient
    );
  } catch (error) {
    console.error(error);
  }
});

Server.use("/ws", socket.router);
Server.use(gsmRouter);
Server.use(sqliteRouter);

Server.listen(Number(process.env.port || 4000))
  .then((socket) => console.log("Webserver started on port 4000"))
  .catch((error) => console.log("Failed to start webserver on port 4000"));
