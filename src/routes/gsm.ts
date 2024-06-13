import { gsmHandler } from "..";
import { Router } from "express";

/**
 * Router for the GSM API
 * @const
 */

export const gsmRouter = Router()

/**
 * Gets all messages from the SIM card's internal inbox
 */

gsmRouter.get("/gsm", async (req, res) => {
  try {
    const inbox = await gsmHandler.getSimInbox();
    res.json(inbox);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

/**
 * Sends a message to a phone number
 * Request's JSON body should have `recipient` and `message`
 * @param recipient phone number
 * @param message content
 */

gsmRouter.post("/gsm", async (req, res) => {
  const body = req.body
  if (!body.recipient || !body.message) return res.sendStatus(422);
  try {
    const sentMessages = await gsmHandler.sendMessage(
      body.recipient,
      body.message
    );
    res.json(sentMessages);
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

/**
 * Gets a message from the SIM card's internal inbox from specified index
 * @param index
 */

gsmRouter.get("/gsm/:index", async (req, res) => {
  try {
    const message = await gsmHandler.getMessage(Number(req.params.index));
    if (message) {
      res.json(message);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

/**
 * Deletes a message from the SIM card's internal inbox
 * @param index
 */

gsmRouter.delete("/gsm/:index", async (req, res) => {
  try {
    await gsmHandler.deleteMessage(Number(req.params.index));
    res.sendStatus(200);
  } catch (error) {
    if (error) {
      console.error(error);
      res.status(500).send(error);
    } else {
      res.sendStatus(404);
    }
  }
});
