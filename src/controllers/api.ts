import axios from "axios";
import { Application, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import HttpStatus from "http-status-codes";
import mongoose from "mongoose";

import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import { TypeMessage } from "../types/type-message.enum";
import pick from "../utils/pick";

const createRoom = (user1: number, user2: number) => {
  if (user1 > user2) {
    return `chat${user1}_${user2}`;
  } else {
    return `chat${user2}_${user1}`;
  }
};

const updateUserToConversation = async (message: {
  room: string;
  id_user_to: number;
  id_user: number;
  type: TypeMessage;
  message: string;
}) => {
  const userData = await getUserData(message.id_user, message.id_user_to);
  const roomGenerated = createRoom(message.id_user, message.id_user_to);
  if(roomGenerated !== message.room) {
    return;
  }
  await Conversation.findOneAndUpdate(
    {
      room: message.room,
      id_user: message.id_user,
      id_user_to: message.id_user_to,
    },
    {
      $inc: {
        unread_count: 0,
      },
      last_message:
        message.type === TypeMessage.IMAGE ||
        message.type === TypeMessage.QUOTE_IMAGE
          ? "Image..."
          : message.message,
      user: userData.user,
      user_to: userData.user_to,
    },
    { upsert: true, new: true }
  );
  await Conversation.findOneAndUpdate(
    {
      room: message.room,
      id_user: message.id_user_to,
      id_user_to: message.id_user,
    },
    {
      $inc: {
        unread_count: 1,
      },
      last_message:
        message.type === TypeMessage.IMAGE ||
        message.type === TypeMessage.QUOTE_IMAGE
          ? "Image..."
          : message.message,
      user: userData.user_to,
      user_to: userData.user,
    },
    { upsert: true, new: true }
  );
};

const getUserData = async (id_user: number, id_user_to: number) => {
  const params = new URLSearchParams();
  params.append("id_user", `${id_user}`);
  params.append("id_user_to", `${id_user_to}`);
  const userData = await axios.get<{ user?: object; user_to?: object }>(
    `${process.env.SINCELOVE_API}api/user/get`,
    {
      params,
      headers: {
        "X-Authorization": process.env.API_KEY || "",
      },
    }
  );
  return userData.data;
};

export const loadApiEndpoints = (app: Application): void => {
  app.get("/api/message/:room", async (req: Request, res: Response) => {
    try {
      const filter = pick(req.params, ["room"]);
      const options = pick(req.query, ["limit", "page", "sort"]);
      // options["sort"] = {
      //   createdAt: -1,
      // };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const messages = await Message.paginate(filter, options);
      return res.status(HttpStatus.OK).json(messages);
    } catch (error) {
      console.log(error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ errorCode: 500, message: error });
    }
  });
  app.get("/api/message/:room/search", async (req: Request, res: Response) => {
    if (!req.query.text) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: "text is required" });
    }
    const room = pick(req.params, ["room"]);
    const options = pick(req.query, ["limit", "page", "sort"]);
    const textFilter = {
      $text: { $search: req.query.text },
    };
    const filter = { ...room, ...textFilter };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const messages = await Message.paginate(filter, options);
    return res.status(HttpStatus.OK).json(messages);
  });
  app.post(
    "/api/message",
    body("id")
      .exists()
      .withMessage("id is required")
      .isString()
      .withMessage("id must be a string")
      .notEmpty()
      .withMessage("id must not be empty"),
    body("message")
      .exists()
      .withMessage("message is required")
      .isString()
      .withMessage("message must be a string")
      .notEmpty()
      .withMessage("message must not be empty"),
    body("type")
      .exists()
      .withMessage("type is required")
      .isString()
      .withMessage("type must be a string")
      .notEmpty()
      .withMessage("type must not be empty")
      .isIn(["message", "image", "quote_image"])
      .withMessage("invalid type"),
    body("room")
      .exists()
      .withMessage("room is required")
      .isString()
      .withMessage("room must be a string")
      .notEmpty()
      .withMessage("room must not be empty"),
    body("id_user")
      .exists()
      .withMessage("id_user is required")
      .isInt({ min: 1 })
      .withMessage("id_user must be a number and not 0")
      .toInt(),
    body("id_user_to")
      .exists()
      .withMessage("id_user_to is required")
      .isInt({ min: 1 })
      .withMessage("id_user_to must be a number and not 0")
      .toInt(),
    body("quote").optional(),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ errors: errors.array() });
      }
      const { id, message, type, room, id_user, id_user_to, quote } = req.body;
      let typeMessage: TypeMessage = type.trim().toLowerCase();
      let quoteMesage: string | undefined = undefined;
      if (quote != null) {
        typeMessage = TypeMessage.QUOTE;
        if (quote.type === TypeMessage.IMAGE) {
          typeMessage = TypeMessage.QUOTE_IMAGE;
        }
        quoteMesage = quote.message;
      }
      try {
        const messageCreated = await Message.create({
          id: id,
          message: message,
          room: room,
          type: typeMessage,
          id_user: id_user,
          id_user_to: id_user_to,
          read: 0,
          quote: quoteMesage,
        });
        await updateUserToConversation(messageCreated.toJSON());
        return res.status(HttpStatus.CREATED).json({
          message: messageCreated,
        });
      } catch (error) {
        console.log(error);
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ message: "Error trying to create message" });
      }
    }
  );
  app.delete("/api/message/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const messageDeleted = await Message.findOneAndDelete({ id });
    return res
      .status(HttpStatus.OK)
      .json({ success: true, data: messageDeleted });
  });
  app.post("/api/chat/read", async (req: Request, res: Response) => {
    try {
      const { room, id_user, id_user_to } = req.body;
      await Message.updateMany(
        { room, id_user, id_user_to },
        {
          $set: {
            read: true,
          },
        }
      );
      await Conversation.updateOne(
        { room, id_user, id_user_to },
        { $set: { unread_count: 0 } }
      );
      res.status(HttpStatus.OK).json({
        message: "Succesfully updated!",
      });
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Error trying setting as read" });
    }
  });
  app.get(
    "/api/:id_user/conversations",
    async (req: Request, res: Response) => {
      try {
        const filter = pick(req.params, ["id_user"]);
        const options = pick(req.query, ["sort", "limit", "page"]);
        filter["user"] = { ...filter["id_user"], $exists: true, $ne: null };
        filter["user_to"] = { $exists: true, $ne: null };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const conversations = await Conversation.paginate(filter, options);
        return res.status(HttpStatus.OK).json(conversations);
      } catch (error) {
        console.error(
          `Error getting user conversations ${JSON.stringify(error)}`
        );
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ errorCode: 500, message: error });
      }
    }
  );
  app.get("/api/conversation/lastone", async (req: Request, res: Response) => {
    const filters = pick(req.query, ["id_user"]);
    const conversation = await Conversation.findOne(filters).sort({
      createdAt: -1,
    });
    return res.status(200).json(conversation);
  });
  app.post("/api/conversation", async (req: Request, res: Response) => {
    const { id_user, id_user_to } = req.body;
    const room = createRoom(id_user, id_user_to);
    let userData;
    try {
      userData = await getUserData(id_user, id_user_to);
    } catch (err) {
      console.log(err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Error trying to get user data" });
    }
    try {
      const conversation = await Conversation.findOneAndUpdate(
        { room, id_user, id_user_to },
        {
          $set: {
            room,
            id_user,
            id_user_to,
            last_message: "",
            unread_count: 0,
            user: userData.user,
            user_to: userData.user_to,
          },
        },
        { upsert: true, new: true }
      );
      return res.status(HttpStatus.OK).json(conversation);
    } catch (error) {
      console.log(error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Error trying to create conversation" });
    }
  });
  app.get("/api/conversation/:id", async (req: Request, res: Response) => {
    try {
      const conversation = await Conversation.findOne({ _id: req.params.id });
      return res.status(HttpStatus.OK).json(conversation);
    } catch (error) {
      console.log(error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Error trying to get conversation" });
    }
  });
};
