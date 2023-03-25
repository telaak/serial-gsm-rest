import { Router } from "express";
import { gsmHandler, messageStore } from "..";

export const sqliteRouter = Router();

sqliteRouter
  .route("/messages")

  .get(async (req, res) => {
    try {
      const messages = await messageStore.getMessages();
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });

sqliteRouter
  .route("/messages/:rowid")

  .get(async (req, res) => {
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
  })

  .delete(async (req, res) => {
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

sqliteRouter
  .route("/sent")

  .get(async (req, res) => {
    try {
      const messages = await messageStore.getSentMessages();
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });

sqliteRouter
  .route("/sent/:rowid")

  .get(async (req, res) => {
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
  })

  .delete(async (req, res) => {
    try {
      const message = await messageStore.getSentMessage(req.params.rowid);
      await messageStore.deleteSentMessage(message.rowid as number);
      res.sendStatus(200);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });
