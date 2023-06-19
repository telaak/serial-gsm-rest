import GSMHandler from "./GSMHandler";
import { SendSMSCallback, SMSMessage } from "./ModemTypes";
import { MessageStore } from "./MessageStore";
import { SocketHandler } from "./SocketHandler";
import HyperExpress from "hyper-express";
import { gsmRouter } from "./routes/gsm";
import { sqliteRouter } from "./routes/sqlite";

const Server = new HyperExpress.Server();
const socket = new SocketHandler();

export const gsmHandler = new GSMHandler();
export const messageStore = new MessageStore(process.env.SQLITE_PATH as string);

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
