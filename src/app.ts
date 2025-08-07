import express from "express";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import imageRoutes from "./routes/image.routes";

import likeRoutes from "./routes/like.routes";
import commentRoutes from "./routes/comment.routes";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "🎉 Welcome to Image App API! 🎉",
    status: "Server is running successfully",
    endpoints: {
      auth: "/api/auth",
      user: "/api/user",
      admin: "/api/admin",
      images: "/api/images",
      likes: "/api/likes",
      comments: "/api/comments",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/images", imageRoutes);

app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);

export default app;
