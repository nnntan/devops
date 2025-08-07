import request from "supertest";
import app from "../../app";
import mongoose from "mongoose";
import { User } from "../../models/User";
import { Image } from "../../models/Image";
import * as authService from "../../services/auth.services";

jest.setTimeout(60000);

describe("Image API", () => {
  let testUser: any;
  let authToken: string;
  let testImage: any;

  const userData = {
    name: "Test User",
    email: "testimage@example.com",
    password: "123456",
  };

  beforeEach(async () => {
    await User.deleteMany({ email: userData.email });
    await Image.deleteMany({});

    testUser = await authService.register(userData);
    const loginResult = await authService.login({
      email: userData.email,
      password: userData.password,
    });
    authToken = loginResult.accessToken;
  });

  describe("POST /api/images/upload", () => {
    it("should return 400 when no image file provided", async () => {
      const res = await request(app)
        .post("/api/images/upload")
        .set("Authorization", `Bearer ${authToken}`)
        .field("description", "Test Image");

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Missing image file");
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app)
        .post("/api/images/upload")
        .field("description", "Test Image");

      expect(res.statusCode).toBe(401);
    });
  });
  describe("GET /api/images/public", () => {
    beforeEach(async () => {
      testImage = new Image({
        description: "This is a public test image",
        imageUrl: "https://test.com/image.jpg",
        publicId: "test-id",
        user: testUser._id,
        status: "approved",
        visibility: "public",
      });
      await testImage.save();

      const unapprovedImage = new Image({
        description: "This is a private test image",
        imageUrl: "https://test.com/private.jpg",
        publicId: "private-id",
        user: testUser._id,
        status: "pending",
        visibility: "public",
      });
      await unapprovedImage.save();
    });

    it("should get only approved public images", async () => {
      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("images");
      expect(Array.isArray(res.body.images)).toBe(true);
      expect(res.body.images.length).toBe(1);
      expect(res.body.images[0].description).toBe(
        "This is a public test image"
      );
      expect(res.body.images[0].status).toBe("approved");
    });

    it("should return empty array when no approved images", async () => {
      await Image.updateMany({}, { status: "pending" });

      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("images");
      expect(Array.isArray(res.body.images)).toBe(true);
      expect(res.body.images.length).toBe(0);
    });

    it("should include user information", async () => {
      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body.images[0]).toHaveProperty("user");
      expect(res.body.images[0].user).toHaveProperty("email");
    });

    it("should work without authentication", async () => {
      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("images");
      expect(Array.isArray(res.body.images)).toBe(true);
    });

    it("should sort images by creation date (newest first)", async () => {
      const newerImage = new Image({
        description: "Newer test image",
        imageUrl: "https://test.com/newer.jpg",
        publicId: "newer-id",
        user: testUser._id,
        status: "approved",
        visibility: "public",
      });
      await newerImage.save();

      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body.images.length).toBe(2);
      expect(res.body.images[0].description).toBe("Newer test image");
    });

    it("should not return private images even if approved", async () => {
      const privateImage = new Image({
        description: "Private approved image",
        imageUrl: "https://test.com/private.jpg",
        publicId: "private-approved-id",
        user: testUser._id,
        status: "approved",
        visibility: "private",
      });
      await privateImage.save();

      const res = await request(app).get("/api/images/public");

      expect(res.statusCode).toBe(200);
      expect(res.body.images.length).toBe(1);
    });
  });
});
