import mongoose from "mongoose";
import { Book } from "./books.model.js";

const reviewSchema = new mongoose.Schema({
    BookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewText: {
        type: String,
        // default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the average rating in the Product schema
reviewSchema.post("save", async function () {
    await updateBookRating(this.BookId);
});

reviewSchema.post("findOneAndUpdate", async function (doc) {
    if (doc) await updateBookRating(doc.BookId);
});

reviewSchema.post("remove", async function (doc) {
    if (doc) await updateBookRating(doc.BookId);
});

// Helper function to calculate and update avgRating and totalRatings
async function updateBookRating(BookId) {
    const reviews = await mongoose.model("Review").find({ BookId });

    const totalRatings = reviews.length;
    const avgRating =
        totalRatings > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) /
              totalRatings
            : 0;

    await Book.findByIdAndUpdate(BookId, {
        rating:avgRating,
        totalRatings: totalRatings,
    });
}



export const Review = mongoose.model("Review", reviewSchema)
