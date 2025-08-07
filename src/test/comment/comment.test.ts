import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import { Comment } from "../../models/Comment";
import * as authService from "../../services/auth.services";

jest.setTimeout(60000);

describe("Comment API", () => {
  let testUser: any;
  let testUser2: any;
  let authToken: string;
  let authToken2: string;
  let testImage: any;

  const userData = {
    name: "Test User",
    email: "testcomment@example.com",
    password: "123456",
  };

  const userData2 = {
    name: "Test User 2",
    email: "testcomment2@example.com",
    password: "123456",
  };

  beforeEach(async () => {
    await User.deleteMany({
      email: { $in: [userData.email, userData2.email] },
    });
    await Image.deleteMany({});
    await Comment.deleteMany({});

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
      description: "This is a test image for comment functionality",
      imageUrl: "https://test.com/image.jpg",
      publicId: "test-id",
      user: testUser._id,
      status: "approved",
    });
    await testImage.save();
  });

  describe("POST /api/comments/:imageId", () => {
    it("should create comment when authenticated with valid data", async () => {
      const commentData = {
        content: "This is a test comment",
      };

      const res = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(commentData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("comment");
      expect(res.body.comment.content).toBe(commentData.content);
      expect(res.body.comment.image).toBe(testImage._id.toString());
      expect(res.body.comment.user).toBe(testUser._id.toString());
      expect(res.body.comment).toHaveProperty("createdAt");
    });

    it("should allow multiple comments from same user", async () => {
      const comment1 = { content: "First comment" };
      const comment2 = { content: "Second comment" };

      const res1 = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(comment1);

      const res2 = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(comment2);

      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(201);

      const commentsCount = await Comment.countDocuments({
        image: testImage._id,
        user: testUser._id,
      });
      expect(commentsCount).toBe(2);
    });

    it("should allow multiple users to comment on same image", async () => {
      const commentData = { content: "Test comment from user" };

      const res1 = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Comment from user 1" });

      const res2 = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken2}`)
        .send({ content: "Comment from user 2" });

      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(201);

      const commentsCount = await Comment.countDocuments({
        image: testImage._id,
      });
      expect(commentsCount).toBe(2);
    });

    it("should return 401 when not authenticated", async () => {
      const commentData = { content: "Test comment" };

      const res = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .send(commentData);

      expect(res.statusCode).toBe(401);
    });

    it("should return 500 when content is missing", async () => {
      const res = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(res.statusCode).toBe(500);
    });

    it("should return 500 when content is empty", async () => {
      const res = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "" });

      expect(res.statusCode).toBe(500);
    });

    it("should create comment with whitespace content", async () => {
      const res = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "   " });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment.content).toBe("   ");
    });

    it("should return 500 with invalid imageId", async () => {
      const res = await request(app)
        .post("/api/comments/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Test comment" });

      expect(res.statusCode).toBe(500);
    });

    it("should create comment even when image doesn't exist", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/comments/${nonExistentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Test comment" });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment.content).toBe("Test comment");
    });
    it("should handle long comments correctly", async () => {
      const longContent = "A".repeat(1000);

      const res = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: longContent });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment.content).toBe(longContent);
    });

    it("should keep whitespace in comment content", async () => {
      const contentWithSpaces = "  This is a comment with spaces  ";

      const res = await request(app)
        .post(`/api/comments/${testImage._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: contentWithSpaces });

      expect(res.statusCode).toBe(201);
      expect(res.body.comment.content).toBe(contentWithSpaces);
    });
  });
});
