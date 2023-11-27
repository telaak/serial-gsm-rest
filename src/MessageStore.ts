import sqlite3 from "sqlite3";
import { SMSMessage } from "./ModemTypes";

export type SqliteMessageRow = {
  rowid?: number;
  sender: string;
  message: string;
  msgStatus: number;
  dateTimeSent: Date;
  msgIndex: number;
  encoding: string;
  smsc: string;
  smscType: string;
  smscPlan: string;
  referenceNumber?: number;
  parts?: number;
  part?: number;
};

export type SentMessageRow = {
  rowid?: number;
  message: string;
  recipient: string;
  dateTimeSent: Date;
};

/**
 * Helper class for storing SMS messages (both received and sent) in a simple SQLite database
 */

export class MessageStore {
  
  public database: sqlite3.Database;

  /**
   * Creates a database at the path provided
   * Calls {@link createTables} to create the necessary tables
   * @param path 
   */

  constructor(path: string) {
    this.database = new sqlite3.Database(path);
    this.database.serialize();
    this.createTables();
  }

  /**
   * Creates tables for SMS messages (both received and sent)
   * Checks whether tables already exist `IF NOT EXISTS`
   */

  createTables() {
    const table = `CREATE TABLE IF NOT EXISTS messages
    (
        sender TEXT,
        message TEXT,
        msgStatus int, 
        dateTimeSent datetime,
        msgIndex int,
        encoding TEXT,
        smsc TEXT,
        smscType TEXT,
        smscPlan TEXT,
        referenceNumber int NULL,
        parts int NULL,
        part int NULL
    )`;
    this.database.run(table);
    const sent = `CREATE TABLE IF NOT EXISTS sent (message TEXT, recipient TEXT, dateTimeSent datetime)`;
    this.database.run(sent);
  }

  /**
   * Converts SQL rows to {@link SMSMessage}
   * @param row 
   * @returns 
   */

  serializeRow(row: SqliteMessageRow) {
    const message: SMSMessage = {
      rowid: row.rowid,
      sender: row.sender,
      message: row.message,
      msgStatus: row.msgStatus,
      dateTimeSent: new Date(row.dateTimeSent),
      index: row.msgIndex,
      header: {
        encoding: row.encoding,
        smsc: row.smsc,
        smscType: row.smscType,
        smscPlan: row.smscPlan,
      },
    };
    if (row.referenceNumber && row.part && row.parts) {
      Object.assign(message, {
        udh: {
          referenceNumber: row.referenceNumber,
          part: row.part,
          parts: row.parts,
        },
      });
    }
    return message;
  }

  /**
   * Saves a sent SMS message to the sent messages table
   * @param message message content
   * @param recipient recipient's phone number
   * @returns 
   */

  async saveSentMessage(message: string, recipient: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.database.run(
        "INSERT INTO sent VALUES ($message, $recipient, $dateTimeSent)",
        {
          $message: message,
          $recipient: recipient,
          $dateTimeSent: new Date().toISOString(),
        },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Gets a sent message
   * @param rowid 
   * @returns 
   */

  async getSentMessage(rowid: string | number): Promise<SentMessageRow> {
    return new Promise((resolve, reject) => {
      this.database.get(
        "SELECT rowid, * FROM sent where rowid=(?)",
        rowid,
        (err, result: SentMessageRow) => {
          if (err || !result) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  }

  /**
   * Gets all sent messages from the table
   * @returns 
   */

  async getSentMessages(): Promise<SentMessageRow[]> {
    return new Promise((resolve, reject) => {
      this.database.all(
        "SELECT rowid, * FROM sent",
        (err: any, rows: SentMessageRow[]) => {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }
  
  /**
   * Deletes a sent message from the table
   * @param rowid 
   * @returns 
   */

  async deleteSentMessage(rowid: string | number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.database.run("DELETE FROM sent WHERE rowid=(?)", rowid, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Deletes a received message from the table
   * @param rowid 
   * @returns 
   */

  async deleteMessage(rowid: string | number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.database.run(
        "DELETE FROM messages WHERE rowid=(?)",
        rowid,
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  /**
   * Gets a received message from the table
   * @param rowid 
   * @returns 
   */

  async getMessage(rowid: string | number): Promise<SMSMessage> {
    return new Promise((resolve, reject) => {
      this.database.get(
        "SELECT rowid, * FROM messages where rowid=(?)",
        rowid,
        (err, result: SqliteMessageRow) => {
          if (err || !result) {
            reject(err);
          } else {
            resolve(this.serializeRow(result));
          }
        }
      );
    });
  }

  /**
   * Gets all received messages from the table
   * @returns 
   */

  async getMessages(): Promise<SMSMessage[]> {
    return new Promise((resolve, reject) => {
      this.database.all(
        "SELECT rowid, * FROM messages",
        (err: any, rows: SqliteMessageRow[]) => {
          if (err) return reject(err);
          const serializedRows = rows.map((row) => this.serializeRow(row));
          resolve(serializedRows);
        }
      );
    });
  }

  /**
   * Saves a received message onto the table
   * @param message 
   * @returns 
   */

  saveMessage(message: SMSMessage): Promise<void> {
    const sql = this.database.prepare(
      "INSERT INTO messages VALUES ($sender, $message, $msgStatus, $dateTimeSent, $msgIndex, $encoding, $smsc, $smscType, $smscPlan, $referenceNumber, $parts, $part)"
    );
    return new Promise((resolve, reject) => {
      sql.run(
        {
          $sender: message.sender,
          $message: message.message,
          $msgStatus: message.msgStatus,
          $dateTimeSent: message.dateTimeSent.toISOString(),
          $msgIndex: message.index,
          $encoding: message.header.encoding,
          $smsc: message.header.smsc,
          $smscType: message.header.smscType,
          $smscPlan: message.header.smscPlan,
          $referenceNumber: message.udh ? message.udh.referenceNumber : null,
          $part: message.udh ? message.udh.part : null,
          $parts: message.udh ? message.udh.parts : null,
        },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }
}
