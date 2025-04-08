import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";
import { Book } from "../models/books.model.js";

const createCategory = asyncHandler(async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if ([name, description].some((field) => field?.trim() === "")) {
            return next(new ApiError(400, "All fields are required"));
        }

        const existedCategory = await Category.findOne({ name: name });
        if (existedCategory) {
            return next(new ApiError(409, "Category with this name already exists"));
        }

        const category = await Category.create({
            name,
            description,
        });

       res.status(201).json(new ApiResponse(201, category, 'category created Successfully'));
    } catch (error) {
        console.log("error in createCategory: ", error)
        return next(new ApiError(500, "Something went wrong while creating category",error));
    }
})

const deleteCategory = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return next(new ApiError(400, "Category ID is required"));
        }

        const category = await Category.findByIdAndDelete(id);

        if (!category) {
            return next(new ApiError(404, "Category not found"));
        }

        res.status(200).json(new ApiResponse(200, null, 'Category deleted successfully'));
    } catch (error) {
        console.log("error in deleteCategory: ", error)
        return next(new ApiError(500, "Something went wrong while deleting category"));
    }
}
)


const getCategoryNames = asyncHandler(async (req, res, next) => {
    try {
        const categories = await Category.find({}, { name: 1, _id: 0 });

        if (!categories) {
            return next(new ApiError(404, "No categories found"));
        }

        res.status(200).json(new ApiResponse(200, categories, 'Categories retrieved successfully'));
    } catch (error) {
        console.log("error in getCategoryNames: ", error)
        return next(new ApiError(500, "Something went wrong while retrieving categories"));
    }
})


const getCategoryBooks = asyncHandler(async(req,res,next)=>{
    try {
        const {categoryId} = req.params

        if(!categoryId){
            return next(new ApiError(400,"Category ID is required"))
        }

      const books = await Book.find({category: categoryId}).populate('category', 'name')

        res.status(200).json(new ApiResponse(200, books,'books retrieved successfully'))

    } catch (error) {
        console.log("error in getCategorybooks: ", error)
        return next(new ApiError(500, "Something went wrong while retrieving books"));
    }
})

export { createCategory, deleteCategory, getCategoryNames, getCategoryBooks };