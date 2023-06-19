import HyperExpress, { SendableData } from "hyper-express";
import { gsmHandler } from "..";
export const gsmRouter = new HyperExpress.Router();

gsmRouter.get("/gsm", async (req, res) => {
  try {
    const inbox = await gsmHandler.getSimInbox();
    res.json(inbox);
  } catch (error) {
    console.error(error);
    res.status(500).send(error as SendableData);
  }
});
gsmRouter.post("/gsm", async (req, res) => {
  const { recipient, message } = req.body;
  if (!recipient || !message) return res.sendStatus(422);
  try {
    const sentMessages = await gsmHandler.sendMessage(recipient, message);
    res.json(sentMessages);
  } catch (error) {
    console.error(error);
    res.status(500).send(error as SendableData);
  }
});

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
    res.status(500).send(error as SendableData);
  }
});

gsmRouter.delete("/gsm/:index", async (req, res) => {
  try {
    await gsmHandler.deleteMessage(Number(req.params.index));
    res.sendStatus(200);
  } catch (error) {
    if (error) {
      console.error(error);
      res.status(500).send(error as SendableData);
    } else {
      res.sendStatus(404);
    }
  }
});
