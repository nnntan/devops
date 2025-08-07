import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import dotenv from "dotenv";
dotenv.config();

jest.setTimeout(60000);

describe("Auth API", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "123456",
  };

  beforeEach(async () => {
    try {
      await User.deleteMany({ email: testUser.email });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    if (res.statusCode !== 201) console.log("REGISTER ERROR:", res.body);
    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty("email", testUser.email);
  });

  it("should login successfully", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    if (res.statusCode !== 200) console.log("LOGIN ERROR:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("should not login with wrong password", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrongpass" });
    if (res.statusCode !== 401) {
      console.log("LOGIN WRONG PASS ERROR:", res.body);
    }
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message");
  });
  it("should not register with duplicate email", async () => {
    await request(app).post("/api/auth/register").send(testUser);
    const res = await request(app).post("/api/auth/register").send(testUser);
    if (res.statusCode !== 400) {
      console.log("DUPLICATE REGISTER ERROR:", res.body);
    }
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});
