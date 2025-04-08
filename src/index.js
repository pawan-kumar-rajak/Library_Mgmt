import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/index.js";
import { app } from "./app.js";
import cron from "node-cron";
import express from "express";
import { fileURLToPath } from 'url';
import path from 'path';
import { resetBookLimits } from "./controller/user.controller.js";


// Schedule to run at 00:01 on the 1st of every month
export const startCronJobs = () => {
  cron.schedule('1 0 1 * *', resetBookLimits, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('Monthly book limit reset');
};

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000; // Correct port assignment
    // const PORT = 5173; // Correct port assignment
    app.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`); // Fixed typo
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });

