import HyperExpress, { SendableData } from "hyper-express";
import { messageStore } from "..";
export const sqliteRouter = new HyperExpress.Router();

sqliteRouter.get("/", async (req, res) => {
  try {
    const messages = await messageStore.getMessages();
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send(error as SendableData);
  }
});

sqliteRouter.get("/messages/:rowid", async (req, res) => {
  try {
    const message = await messageStore.getMessage(req.params.rowid);
    res.json(message);
  } catch (error) {
    if (error) {
      console.error(error);
      res.status(500).send(error as SendableData);
    } else {
      res.sendStatus(404);
    }
  }
});
sqliteRouter.delete("/messages/:rowid", async (req, res) => {
  try {
    const message = await messageStore.getMessage(req.params.rowid);
    // await gsmHandler.deleteMessage(message.index);
    await messageStore.deleteMessage(message.rowid as number);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send(error as SendableData);
  }
});

sqliteRouter.get("/sent", async (req, res) => {
  try {
    const messages = await messageStore.getSentMessages();
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send(error as SendableData);
  }
});

sqliteRouter.get("/sent/:rowid", async (req, res) => {
  try {
    const message = await messageStore.getSentMessage(req.params.rowid);
    res.json(message);
  } catch (error) {
    if (error) {
      console.error(error);
      res.status(500).send(error as SendableData);
    } else {
      res.sendStatus(404);
    }
  }
});

sqliteRouter.delete("/sent/:rowid", async (req, res) => {
  try {
    const message = await messageStore.getSentMessage(req.params.rowid);
    await messageStore.deleteSentMessage(message.rowid as number);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send(error as SendableData);
  }
});
