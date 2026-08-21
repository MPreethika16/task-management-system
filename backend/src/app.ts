import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import { notFound, errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;