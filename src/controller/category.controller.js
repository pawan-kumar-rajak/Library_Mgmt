import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";
import { Book } from "../models/books.model.js";

const createCategory = async (req, res, next) => {
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
}

const deleteCategory = async (req, res, next) => {
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



const getCategoryNames = async (req, res, next) => {
    try {
        const categories = await Category.find({}, { name: 1, _id: 1 });

        if (!categories) {
            return next(new ApiError(404, "No categories found"));
        }

        res.status(200).json(new ApiResponse(200, categories, 'Categories retrieved successfully'));
    } catch (error) {
        console.log("error in getCategoryNames: ", error)
        return next(new ApiError(500, "Something went wrong while retrieving categories"));
    }
}


const getCategoryBooks = async(req,res,next)=>{
    try {
        const {categoryId} = req.params
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
        if(!categoryId){
            return next(new ApiError(400,"Category ID is required"))
        }
        // Extracting the user's role
            const role = req.role;
        
            // Determine which availability to filter by based on the user's role
            let availabilityFilter = 'public'; // Default to public books for "user" role
        
        
            if (role === 'User') {
              availabilityFilter = { $in: ['public', 'students'] };
            }
        
            else if (role === 'Admin') {
              availabilityFilter = { $in: ['public', 'students', 'admin'] };
            }
        
            else if (role === 'Faculty') {
              availabilityFilter = { $in: ['public', 'students', 'faculty'] };
            }
           availabilityFilter = { $in: ['public', 'students'] };

            const options = {
              page: parseInt(page),
              limit: parseInt(limit),
              sort,
              populate: { path: 'categories', select: 'name' },
              select:"title description author publisher coverImage reads rating totalRating categories availability",
            };
        

      const books = await Book.paginate({availability:availabilityFilter,categories:{$in:categoryId}},options)

        res.status(200).json(new ApiResponse(200, books,'books retrieved successfully'))

    } catch (error) {
        console.log("error in getCategorybooks: ", error)
        return next(new ApiError(500, "Something went wrong while retrieving books"));
    }
}

export { createCategory, deleteCategory, getCategoryNames, getCategoryBooks };