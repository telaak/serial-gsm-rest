import GSMHandler from "./GSMHandler";
import { SendSMSCallback, SMSMessage } from "./ModemTypes";
import { MessageStore } from "./MessageStore";
import express from "express";
import { gsmRouter } from "./routes/gsm";
import { sqliteRouter } from "./routes/sqlite";
const app = express();
app.use(express.json())
const port = 4000;


export const gsmHandler = new GSMHandler();
export const messageStore = new MessageStore(process.env.SQLITE_PATH as string);

gsmHandler.on("newMessage", async (messages: SMSMessage[]) => {
  messages.forEach(async (message) => {
    try {
      await messageStore.saveMessage(message);
      await gsmHandler.deleteMessage(message.index)
    } catch (error) {
      console.error(error);
    }
  });
});

gsmHandler.on("sentMessage", async (sentMessage: SendSMSCallback) => {
  try {
    await messageStore.saveSentMessage(sentMessage.data.message, sentMessage.data.recipient)
  } catch (error) {
    console.error(error)
  }
})


app.use(gsmRouter)
app.use(sqliteRouter)


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
