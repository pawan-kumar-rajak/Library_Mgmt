import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/index.js";
import { app } from "./app.js";
import cron from "node-cron";
import express from "express";
import { fileURLToPath } from 'url';
import path from 'path';




connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000; // Correct port assignment
    app.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`); // Fixed typo
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

