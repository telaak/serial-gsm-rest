export type ModemCommandCallback = {
  status: "success" | "ERROR";
  request: string;
};

export type ModemInitializeCallback = {
  status: string;
  request: string;
  data: string;
};

export type SMSHeader = {
  encoding: string;
  smsc: string;
  smscType: string;
  smscPlan: string;
};

export type SMSUdh = {
  referenceNumber: number;
  parts: number;
  part: 1;
};

export type SMSMessage = {
  sender: string;
  index: number;
  message: string;
  dateTimeSent: Date;
  msgStatus: number;
  header: SMSHeader;
  udh?: SMSUdh;
  udhs?: SMSUdh[];
  rowid?: number | string;
};

export interface GetSimInboxCallback extends ModemCommandCallback {
  request: "getSimInbox";
  data: SMSMessage[];
}

export interface GetSimInboxError extends ModemCommandCallback {
  request: "getSimInbox";
  data: string;
}

export interface DeleteMessageCallback extends ModemCommandCallback {
  request: "deleteMessage";
  data: {
    deleted: SMSMessage[];
    errors: any[];
  };
}

export interface ReadSMSByIdCallback extends ModemCommandCallback {
  request: "readSMSById";
  data: SMSMessage[];
}

export interface SendSMSCallback extends ModemCommandCallback {
  request: "SENDSMS";
  data: {
    messageId: string;
    message: string;
    recipient: string;
    response: string;
  };
}
