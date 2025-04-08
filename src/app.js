import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/ApiError.js";
import path from "path";
import { fileURLToPath } from 'url';


import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import bookRoutes from "./routes/book.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import bookIntractionRoutes from "./routes/bookIntraction.routes.js";
import reviewRoutes from "./routes/review.routes.js";

const app = express();
app.use(express.json())
app.use(
	cors({
		origin: process.env.CORS_ORIGIN,
		credentials: true,
	})
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/public', express.static('public'))
app.use(cookieParser());



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("dirname: ", __dirname);
// Serve static files directly from the 'public' folder
app.use(express.static(path.join(__dirname, '..',  'public')));


//todo: routing
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/book", bookRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/intraction", bookIntractionRoutes);
app.use("/api/v1/review", reviewRoutes);



//todo:  Handle API Errors - Ensure JSON Response
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors || [],
        });
    }

    // Fallback for unknown errors
    return res.status(500).json({
        success: false,
        message: "Internal Server Error",
    });
});


export { app };
