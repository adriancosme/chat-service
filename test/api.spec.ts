import request from "supertest";

import app from "../src/app";
import sequelize from "../src/models";
import { initModels } from "../src/models/init-models";

describe("Messages API", () => {
  beforeEach(async () => {
    initModels(sequelize);
  });
  afterEach(async () => {
    jest.clearAllMocks();
    await sequelize.close();
  });
  it("should return messages with pagination", (done) => {
    request(app)
      .get("/api/message/chat8_3")
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body).toEqual(
          expect.objectContaining({
            totalItems: expect.any(Number),
            messages: expect.any(Array),
            totalPages: expect.any(Number),
            currentPage: expect.any(Number),
          })
        );
        done();
      });
  });
});
