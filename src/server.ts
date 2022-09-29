import { Server } from "http";
import mongoose from "mongoose";

import app from "./app";
import config from "./config/config";

/**
 * Start Express server.
 */
let server!: Server;
if (config.env !== "test") {  
  mongoose
    .connect(config.mongoose.url, { authSource: "admin" })
    .then(() => {
      server = app.listen(app.get("port"), async () => {
        console.log(
          "  App is running at http://localhost:%d in %s mode",
          app.get("port"),
          app.get("env")
        );
        console.log("  Press CTRL-C to stop\n");
      });
    })
    .catch((err) => {
      console.log(err);
    });
}
// const exitHandler = () => {
//   if (server) {
//     server.close(() => {
//       process.exit(1);
//     });
//   } else {
//     process.exit(1);
//   }
// };
// const unexpectedErrorHandler = (error: unknown) => {
//   console.log(error);
//   exitHandler();
// };
// process.on("uncaughtException", unexpectedErrorHandler);
// process.on("unhandledRejection", unexpectedErrorHandler);
// process.on("SIGTERM", () => {
//   console.info("SIGTERM received");
//   if (server) {
//     server.close();
//   }
// });

export default server;
