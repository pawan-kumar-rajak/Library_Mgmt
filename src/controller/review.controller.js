import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Review } from "../models/reviews.model.js";
import mongoose from "mongoose";
import { Book } from "../models/books.model.js";
import { User } from "../models/user.model.js";
import { UserBookInteraction } from "../models/booksIntraction.model.js";

//!----------------------PRODUCTS REVIWINGS------------------------
const addReview = asyncHandler(async (req, res, next) => {
	try {
		const { BookId } = req.params;
		const reviewer = req.user._id;
		const { rating, reviewText } = req.body;

		if (!rating || !reviewText) {
			return next( new ApiError(
				400,
				"rating,reviewText required in body"
			))
		}


		// sirf completed books ko hi review karne ki permission hai
		const validBookReview = await UserBookInteraction.findOne({
			user: reviewer,
			book: new mongoose.Types.ObjectId(BookId),
			readStatus: ["completed", "reading"],
		});

		

		if (!validBookReview) {
		    return next(new ApiError(401, 'You can only review book you have read up'));
		}

		// Check if the user has already reviewed this product
		const existingReview = await Review.findOne({ reviewer, BookId });
		if (existingReview) {
		    return next(new ApiError(400, 'You have already reviewed this book'));
		}

		const newReview = await Review.create({
			BookId,
			reviewer,
			rating,
			reviewText,
		});

		if (!newReview) {
			return next(new ApiError(500, "failed to create reivew"));

		}


		return res
			.status(200)
			.json(
				new ApiResponse(
					200,
					{ review: newReview },
					"review Added Successfully"
				)
			);
	} catch (error) {
		console.log("error in addReview", error);
		return next(new ApiError(500, "Internal Server Error"));
	}
});

// Controller to get all reviews for a product
const getAllReviews = asyncHandler(async (req, res, next) => {
	try {
		const { BookId } = req.params;
		const page = parseInt(req.query.page) || 1;  // Get the page number, default to 1 if not provided
		const limit = parseInt(req.query.limit) || 10; // Define the number of products per page
		const skip = (page - 1) * limit; // Skip based on the page number


		// Convert page and limit to numbers
		const pageNumber = parseInt(page, 10);
		const pageLimit = parseInt(limit, 10);

		// Validate productId
		if (!mongoose.Types.ObjectId.isValid(BookId)) {
			return next(new ApiError(400, "Invalid book ID format"));
		}


		// Ensure that page and limit are valid positive numbers
		if (pageNumber <= 0 || pageLimit <= 0) {
			return next(new ApiError(400, "Page and limit must be positive numbers"));
		}



		// Fetch reviews for the product and populate reviewer details with pagination
		const reviews = await Review.aggregate([
			{
				$match: {
					BookId: new mongoose.Types.ObjectId(BookId), // Match reviews for the given product
				},
			},
			{
				$lookup: {
					from: "user", // Assuming "customers" collection stores reviewer details
					localField: "reviewer",
					foreignField: "_id",
					as: "reviewerDetails",
				},
			},
			{
				$unwind: {
					path: "$reviewerDetails",
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				$project: {
					_id: 1,
					BookId: 1,
					reviewer: 1,
					rating: 1,
					reviewText: 1,
					createdAt: 1,
					reviewerDetails: {
						_id: 1,
						fullName: 1,
						
					},
				},
			},
			{
				$sort: { createdAt: -1 }, // Sort reviews by creation date (latest first)
			},
			{ $skip: skip },  // Skip based on the page number
			{ $limit: limit },  // Limit the number of products per page
		]);

		// Get the total count of reviews for pagination metadata
		const totalReviews = await Review.countDocuments({ BookId: new mongoose.Types.ObjectId(BookId) });

		// Check if no reviews found
		if (!reviews || reviews.length === 0) {
			return res
				.status(404)
				.json(
					new ApiResponse(
						404,
						[],
						"No reviews found for this product"
					)
				);
		}

		// Return paginated reviews with reviewer details and pagination metadata
		return res
			.status(200)
			.json(
				new ApiResponse(
					200,
					{
						reviews,
						pagination: {
							currentPage: pageNumber,
							totalPages: Math.ceil(totalReviews / pageLimit),
							totalReviews,
						},
					},
					"All reviews retrieved successfully"
				)
			);
	} catch (error) {
		console.log("error in getAllReviews", error);
		return next(new ApiError(500, "Internal Server Error"));
	}
});


const getBookRatingStats = asyncHandler(
	async (req, res, next) => {
		const { BookId } = req.params;

		if (!BookId) {
			throw new ApiError(
				400,
				"please provide Product id in params"
			);
		}

		// Fetch reviews grouped by rating
		const ratingStats = await Review.aggregate([
			{
				$match: {
					BookId: new mongoose.Types.ObjectId(BookId),
				},
			}, // Filter by product
			{ $group: { _id: "$rating", count: { $sum: 1 } } }, // Group by rating and count
		]);

		if (!ratingStats) {
			return res
				.status(404)
				.json(
					new ApiResponse(
						404,
						[],
						"No reviews found for this"
					)
				);
		}

		// Calculate total reviews
		const totalReviews = ratingStats.reduce(
			(acc, curr) => acc + curr.count,
			0
		);

		// Prepare response data with percentages
		const ratingsData = Array.from(
			{ length: 5 },
			(_, i) => {
				const rating = 5 - i; // Start from 5 stars
				const ratingStat = ratingStats.find(
					(stat) => stat._id === rating
				);
				const count = ratingStat ? ratingStat.count : 0;

				return {
					rating,
					count,
					percentage: totalReviews
						? ((count / totalReviews) * 100).toFixed(2)
						: 0,
				};
			}
		);
		if (!ratingsData) {
			throw new ApiError(
				500,
				"error while fetching rating Data"
			);
		}

		res.status(200).json(
			new ApiResponse(
				200,
				{
					totalReviews,
					ratingsData,
				},
				"Rating statistics retrieved successfully"
			)
		);
	}
);



export{
    addReview,
    getAllReviews,
    getBookRatingStats
}