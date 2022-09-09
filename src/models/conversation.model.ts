import { model, Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const conversationSchema = new Schema(
  {
    room: {
      type: String,
      required: true,
    },
    last_message: {
      type: String,
      required: true,
    },
    unread_count: {
      type: Number,
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
    user: {
      type: Object,
      required: false,
    },
    user_to: {
      type: Object,
      required: false,
    },
  },
  { timestamps: true, autoIndex: false }
);

conversationSchema.plugin(mongoosePaginate);
const Conversation = model("Conversation", conversationSchema);

export default Conversation;
