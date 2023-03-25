const serialportgsm = require("serialport-gsm");
import * as dotenv from "dotenv";
import EventEmitter from "events";
import {
  DeleteMessageCallback,
  GetSimInboxCallback,
  GetSimInboxError,
  ReadSMSByIdCallback,
  SendSMSCallback,
  SMSMessage,
} from "./ModemTypes";
dotenv.config();

const options = {
  enableConcatenation: false,
  incomingCallIndication: true,
  incomingSMSIndication: true,
  cnmiCommand: "AT+CNMI=2,1,0,2,1",
  logger: console,
  baudRate: 9600,
};

function chunkSubstr(str: string, size: number) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.slice(o, size);
  }

  return chunks;
}

function splitMessage(message: string) {
    return chunkSubstr(message, 140)
}

export default class GSMHandler extends EventEmitter {
  private modem = serialportgsm.Modem();
  public isOpen = false;

  constructor() {
    super();
    this.init();
  }

  private isModemOpenPromise = new Promise((resolve, reject) => {
    const loop = () =>
      this.isOpen
        ? resolve(true)
        : setTimeout(() => {
            loop();
          }, 10);
    loop();
  });

  async openModem() {
    const modemConnection = await this.modem.open(process.env.GSMTTY, options);
    const gsmModem = await this.modem.initializeModem();
    // await this.modem.setModemMode(console.log, 'SMS')

    this.isOpen = true;
  }

  async getSimInbox(): Promise<SMSMessage[]> {
    await this.isModemOpenPromise;
    return new Promise(async (resolve, reject) => {
      try {
        const inbox: GetSimInboxCallback = await this.modem.getSimInbox();
        resolve(inbox.data);
      } catch (error) {
        reject(error as GetSimInboxError);
      }
    });
  }

  async sendMessage(
    recipient: string,
    message: string,
    alert = false
  ): Promise<SendSMSCallback[]> {
    return new Promise(async (resolve, reject) => {
      const messages: string[] = splitMessage(message);
      const promises: Promise<SendSMSCallback>[] = messages.map((messageChunk) => {
        return new Promise(async (resolve, reject) => {
          const result: SendSMSCallback = await this.modem.sendSMS(
            recipient,
            messageChunk,
            alert
          );
          if (result.status === "success") {
            this.emit('sentMessage', result)
            resolve(result);
          } else {
            reject(result);
          }
        });
      });
      try {
        const results = await Promise.all(promises)
        resolve(results)
      } catch (error) {
        reject(error)
      }
    });
  }

  async deleteMessage(index: number) {
    await this.isModemOpenPromise;
    const deleteCommand: DeleteMessageCallback = await this.modem.deleteMessage(
      { index }
    );
    return deleteCommand;
  }

  async getMessage(index: number): Promise<SMSMessage> {
    await this.isModemOpenPromise;
    return new Promise((resolve, reject) => {
      this.modem.readSMSById(
        index,
        (result: ReadSMSByIdCallback, error: any) => {
          if (error) {
            reject(error);
          } else {
            const message = result.data.pop() as SMSMessage;
            resolve(message);
          }
        }
      );
    });
  }

  async deleteAllMessages() {
    await this.isModemOpenPromise;
    const deleteCommand = await this.modem.deleteAllSimMessages();
    return deleteCommand;
  }

  async init() {
    await this.openModem();
    this.modem.on("onNewMessage", (message: SMSMessage) => {
      this.emit("newMessage", message);
    });
  }
}
