import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import { Like } from "../../models/Like";
import * as authService from "../../services/auth.services";

jest.setTimeout(60000);

describe("Like API", () => {
  let testUser: any;
  let testUser2: any;
  let authToken: string;
  let authToken2: string;
  let testImage: any;

  const userData = {
    name: "Test User",
    email: "testlike@example.com",
    password: "123456",
  };

  const userData2 = {
    name: "Test User 2",
    email: "testlike2@example.com",
    password: "123456",
  };

  beforeEach(async () => {
    await User.deleteMany({
      email: { $in: [userData.email, userData2.email] },
    });
    await Image.deleteMany({});
    await Like.deleteMany({});

    testUser = await authService.register(userData);
    const loginResult = await authService.login({
      email: userData.email,
      password: userData.password,
    });
    authToken = loginResult.accessToken;

    testUser2 = await authService.register(userData2);
    const loginResult2 = await authService.login({
      email: userData2.email,
      password: userData2.password,
    });
    authToken2 = loginResult2.accessToken;

    testImage = new Image({
      description: "This is a test image for like functionality",
      imageUrl: "https://test.com/image.jpg",
      publicId: "test-id",
      user: testUser._id,
      status: "approved",
    });
    await testImage.save();
  });

  describe("POST /api/likes/:imageId", () => {
    it("should add like when user hasn't liked the image", async () => {
      const res = await request(app)
        .post(`/api/likes/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("liked");
      expect(res.body.liked).toBe(true);

      const like = await Like.findOne({
        image: testImage._id,
        user: testUser._id,
      });
      expect(like).not.toBeNull();
    });

    it("should remove like when user has already liked the image", async () => {
      const existingLike = new Like({
        image: testImage._id,
        user: testUser._id,
      });
      await existingLike.save();

      const res = await request(app)
        .post(`/api/likes/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("liked");
      expect(res.body.liked).toBe(false);

      const like = await Like.findOne({
        image: testImage._id,
        user: testUser._id,
      });
      expect(like).toBeNull();
    });

    it("should allow multiple users to like the same image", async () => {
      const res1 = await request(app)
        .post(`/api/likes/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res1.statusCode).toBe(200);

      const res2 = await request(app)
        .post(`/api/likes/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken2}`);

      expect(res2.statusCode).toBe(200);

      const likesCount = await Like.countDocuments({ image: testImage._id });
      expect(likesCount).toBe(2);
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app).post(`/api/likes/${testImage._id}`);

      expect(res.statusCode).toBe(401);
    });

    it("should return 500 with invalid imageId", async () => {
      const res = await request(app)
        .post("/api/likes/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(500);
    });

    it("should return 200 when image doesn't exist (creates like anyway)", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/likes/${nonExistentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.liked).toBe(true);
    });
    it("should handle toggle like correctly multiple times", async () => {
      const res1 = await request(app)
        .post(`/api/likes/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(res1.statusCode).toBe(200);
      expect(res1.body.liked).toBe(true);

      const res2 = await request(app)
        .post(`/api/likes/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(res2.statusCode).toBe(200);
      expect(res2.body.liked).toBe(false);

      const res3 = await request(app)
        .post(`/api/likes/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`);
      expect(res3.statusCode).toBe(200);
      expect(res3.body.liked).toBe(true);

      const likesCount = await Like.countDocuments({
        image: testImage._id,
        user: testUser._id,
      });
      expect(likesCount).toBe(1);
    });
  });
});
