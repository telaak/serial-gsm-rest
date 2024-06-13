import { Router } from "express";
import { messageStore } from "..";

/**
 * Router for the SQLite API
 * @const
 */

export const sqliteRouter = Router();

/**
 * Gets all received messages from the database
 */

sqliteRouter.get("/", async (req, res) => {
  try {
    const messages = await messageStore.getMessages();
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

/**
 * Gets a specified received message from the database
 * @param rowId 
 */

sqliteRouter.get("/messages/:rowid", async (req, res) => {
  try {
    const message = await messageStore.getMessage(req.params.rowid);
    res.json(message);
  } catch (error) {
    if (error) {
      console.error(error);
      res.status(500).send(error);
    } else {
      res.sendStatus(404);
    }
  }
});

/**
 * Deletes a specified received message from the database
 * @param rowId 
 */

sqliteRouter.delete("/messages/:rowid", async (req, res) => {
  try {
    const message = await messageStore.getMessage(req.params.rowid);
    // await gsmHandler.deleteMessage(message.index);
    await messageStore.deleteMessage(message.rowid as number);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

/**
 * Gets all sent messages from the database
 */

sqliteRouter.get("/sent", async (req, res) => {
  try {
    const messages = await messageStore.getSentMessages();
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

/**
 * Gets a specified sent message from the database
 */

sqliteRouter.get("/sent/:rowid", async (req, res) => {
  try {
    const message = await messageStore.getSentMessage(req.params.rowid);
    res.json(message);
  } catch (error) {
    if (error) {
      console.error(error);
      res.status(500).send(error);
    } else {
      res.sendStatus(404);
    }
  }
});

/**
 * Deletes a specified sent message from the database
 */

sqliteRouter.delete("/sent/:rowid", async (req, res) => {
  try {
    const message = await messageStore.getSentMessage(req.params.rowid);
    await messageStore.deleteSentMessage(message.rowid as number);
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});
