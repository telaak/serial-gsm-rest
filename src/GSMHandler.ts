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

/**
 * Options for the GSM modem
 * @const
 */

const options = {
  enableConcatenation: false,
  incomingCallIndication: true,
  incomingSMSIndication: true,
  cnmiCommand: "AT+CNMI=2,1,0,2,1",
  logger: console,
  baudRate: 9600,
};

/**
 * Cuts a string into chunks
 * Used to cut text messages into parts
 * @param str 
 * @param size 
 * @returns 
 */

function chunkSubstr(str: string, size: number) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array(numChunks);

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.slice(o, size);
  }

  return chunks;
}

/**
 * Splits a text message into chunks of 140 characters
 * @param message 
 * @returns 
 */

function splitMessage(message: string) {
    return chunkSubstr(message, 140)
}

/**
 * Main class for handling the GSM-modem's connection
 * Emits events on received and sent messages
 * Uses serialport-gsm's functions wrapped in Promises
 */

export default class GSMHandler extends EventEmitter {
  private modem = serialportgsm.Modem();
  public isOpen = false;

  constructor() {
    super();
    this.init();
  }

  /**
   * Promise for checking whether the modem's connection is open (ready)
   * Loops until it resolves
   */

  private isModemOpenPromise = new Promise((resolve, reject) => {
    const loop = () =>
      this.isOpen
        ? resolve(true)
        : setTimeout(() => {
            loop();
          }, 10);
    loop();
  });

  /**
   * Opens and initializes the moden's connection
   */

  async openModem() {
    const modemConnection = await this.modem.open(process.env.GSMTTY, options);
    const gsmModem = await this.modem.initializeModem();
    // await this.modem.setModemMode(console.log, 'SMS')

    this.isOpen = true;
  }

  /**
   * Gets all the messages from the SIM card's internal inbox
   * @returns Promise with either {@link GetSimInboxCallback} or {@link GetSimInboxError}
   */

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

  /**
   * Sends a message to phone number specified
   * Splits message into chunks if it's too large and sends multiple messages
   * Creates promises for each message and resolves only if every one succeeds
   * Emits event for a sent message `sentMessage` {@link SendSMSCallback}
   * @param recipient phone number
   * @param message content
   * @param alert whether to send the message as an alert (type 0, silent)
   * @returns 
   */

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

  /**
   * Deletes a message from the SIM card's internal inbox
   * @param index 
   * @returns 
   */

  async deleteMessage(index: number) {
    await this.isModemOpenPromise;
    const deleteCommand: DeleteMessageCallback = await this.modem.deleteMessage(
      { index }
    );
    return deleteCommand;
  }

  /**
   * Reads a message from the SIM card's internal inbox
   * @param index 
   * @returns 
   */

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

  /**
   * Deletes all messages from the SIM card's internal inbox
   * @returns 
   */

  async deleteAllMessages() {
    await this.isModemOpenPromise;
    const deleteCommand = await this.modem.deleteAllSimMessages();
    return deleteCommand;
  }

  /**
   * Opens the modem and sets the event emitter
   */

  async init() {
    await this.openModem();
    this.modem.on("onNewMessage", (message: SMSMessage) => {
      this.emit("newMessage", message);
    });
  }
}
