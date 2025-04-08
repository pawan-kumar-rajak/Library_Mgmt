import { Router } from "express";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

import{
    addReview,
    getAllReviews,
    getBookRatingStats
  } from "../controller/review.controller.js"

const router = Router();


router.route("/add/:BookId").post(verifyJWT, addReview);
router.route("/get/:BookId").get(getAllReviews);
router.route("/rating-stats/:BookId").get(getBookRatingStats);

export default router;