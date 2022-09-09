import cors from "cors";
import express from "express";
import * as fs from "fs";
import morgan from "morgan";
import path from "path";

import { loadApiEndpoints } from "./controllers/api";
// Create Express server
const app = express();
// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(
  express.static(path.join(__dirname, "../public"), { maxAge: 31557600000 })
);
// log only 4xx and 5xx responses to console
app.use(
  morgan("dev", {
    skip: function (_req, res) {
      return res.statusCode < 400;
    },
  })
);

// log all requests to access.log
app.use(
  morgan("common", {
    stream: fs.createWriteStream(path.join(__dirname, "access.log"), {
      flags: "a",
    }),
  })
);

loadApiEndpoints(app);

export default app;
