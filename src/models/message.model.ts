import { Model, model, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import validator from "validator";

interface IMessage {
  id: string;
  message: string;
  type: string;
  quote: string | null;
  read: boolean;
  room: string;
  id_user: number;
  id_user_to: number;
  user: object;
  user_to: object;
}
type MessageModel = Model<IMessage>;
const messageSchema = new Schema<IMessage, MessageModel>(
  {
    id: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      validate(value: string) {
        if (
          !validator.isIn(value, ["message", "image", "quote", "quote_image"])
        ) {
          throw new Error("Invalid type");
        }
      },
    },
    quote: {
      type: String,
      required: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
    room: {
      type: String,
      required: true,
    },
    id_user: {
      type: Number,
      required: true,
    },
    id_user_to: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true, autoIndex: false }
);
messageSchema.index({ id: 1, createdAt: -1 });

messageSchema.plugin(mongoosePaginate);

const Message = model<IMessage, MessageModel>("Message", messageSchema);

export default Message;
