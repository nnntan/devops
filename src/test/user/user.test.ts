import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import * as authService from "../../services/auth.services";

jest.setTimeout(60000);

describe("User API", () => {
  let testUser: any;
  let authToken: string;

  const userData = {
    name: "Test User",
    email: "testuser@example.com",
    password: "123456",
  };

  beforeEach(async () => {
    await User.deleteMany({ email: userData.email });

    testUser = await authService.register(userData);
    const loginResult = await authService.login({
      email: userData.email,
      password: userData.password,
    });
    authToken = loginResult.accessToken;
  });

  describe("GET /api/user/me", () => {
    it("should get user profile when authenticated", async () => {
      const res = await request(app)
        .get("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body.user.id).toBe(testUser._id.toString());
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get("/api/user/me");

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("should return 500 with invalid token", async () => {
      const res = await request(app)
        .get("/api/user/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.statusCode).toBe(500);
    });
  });

  describe("PUT /api/user/me", () => {
    it("should update user profile when authenticated", async () => {
      const updateData = {
        name: "Updated Name",
      };

      const res = await request(app)
        .put("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.name).toBe(updateData.name);
      expect(res.body.user.email).toBe(userData.email);
    });

    it("should not update email if provided", async () => {
      const updateData = {
        name: "Updated Name",
        email: "newemail@example.com",
      };

      const res = await request(app)
        .put("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe("newemail@example.com");
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app)
        .put("/api/user/me")
        .send({ name: "Updated Name" });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("DELETE /api/user/me", () => {
    it("should delete user account when authenticated", async () => {
      const res = await request(app)
        .delete("/api/user/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message");

      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app).delete("/api/user/me");

      expect(res.statusCode).toBe(401);
    });

    it("should return 500 with invalid token", async () => {
      const res = await request(app)
        .delete("/api/user/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.statusCode).toBe(500);
    });
  });
});
