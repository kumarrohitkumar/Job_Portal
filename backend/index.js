import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
const __dirname = path.resolve();
const app = express();
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Dynamically Set CORS Based on Environment
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? "https://job-portal-ckeu.onrender.com" // Production API
      : "http://localhost:5173", // Local Frontend
  credentials: true,
};
app.use(cors(corsOptions));
const PORT = process.env.PORT || 3000;
// API Routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);
// Serve Frontend in Production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}
app.listen(PORT, () => {
  connectDB();
  console.log(`Server running at port ${PORT} in ${process.env.NODE_ENV} mode`);
});
