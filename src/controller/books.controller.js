import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../models/category.model.js";
import { Book } from "../models/books.model.js";
import path from "path";
import fs from "fs";
import { deleteFile } from "../middlewares/multer.middleware.js";

//helper function
// Function to convert date string to year format
function convertToPublicationYear(dateString) {
  // Split the date string by the slash ('/') separator
  const dateParts = dateString.split('/');

  // Extract the year part (third part of the array)
  const year = parseInt(dateParts[2], 10);

  // Check if the year is a valid number and if it is less than or equal to the current year
  if (isNaN(year) || year > new Date().getFullYear()) {
      throw new Error(`${year} is not a valid publication year!`);
  }

  // Return the valid year
  return year;
}

const AddBooks = asyncHandler(async (req, res, next) => {
    try {
        const { title, author, publisher, publicationYear, isbn, description, categories, availability, language } = req.body;

        if ([title, author, publisher, publicationYear, isbn, description, categories, availability].some((field) => field?.trim() === "")) {
            return next(new ApiError(400, "All fields are required"));  
        }

        const existedBook = await Book.findOne({ isbn: isbn });
        if (existedBook) {
            return next(new ApiError(409, "Book with this ISBN already exists"));
        }

        const publicationDate = convertToPublicationYear(publicationYear);

        const digitalFile = req.file ? {
            path: `/uploads/books/${req.file.filename}`,
            mimeType: req.file.mimetype,
            size: req.file.size,
            originalName: req.file.originalname
          } : null;

        if(!digitalFile) {
            return next(new ApiError(400, "Digital file is required"));
        }

        console.log("digitalFile: ", req.file)
        const book = await Book.create({
            title,
            author,
            publisher,
            publicationYear:publicationDate,
            isbn,
            description,
            categories,
            digitalFile,
            availability,
            language,
        });

        if(!book){
            return next(new ApiError(409, "Book not created"));
        }
        res.status(201).json(new ApiResponse(201, book, 'Book created Successfully'));
    } catch (error) {
        console.log("error in AddBooks: ", error)
        return next(new ApiError(500, "Something went wrong while creating book"));
    }
})


const updateBook = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { 
          title, 
          author, 
          publisher, 
          publicationYear, 
          isbn, 
          description, 
          categories, 
          availability,
          removeDigitalFile // Flag to indicate if we should remove the existing file
        } = req.body;
    
        // Find the existing book first
        const existingBook = await Book.findById(id);
        if (!existingBook) {
          return next(new ApiError(404, "Book not found"));

        }
    
        // Prepare update data
        const updateData = {
          title: title || existingBook.title,
          author: author || existingBook.author,
          publisher: publisher || existingBook.publisher,
          publicationYear: publicationYear || existingBook.publicationYear,
          isbn: isbn || existingBook.isbn,
          description: description || existingBook.description,
          categories: categories ? JSON.parse(categories) : existingBook.categories,
          availability: availability || existingBook.availability
        };
    
        // Handle file removal/update
        if (req.file || removeDigitalFile === 'true') {
          // Delete the old file if it exists
          if (existingBook.digitalFile && existingBook.digitalFile.path) {
            deleteFile(existingBook.digitalFile.path);
          }
    
          if (req.file) {
            // Add new file info
            updateData.digitalFile = {
              path: `/uploads/books/${req.file.filename}`,
              mimeType: req.file.mimetype,
              size: req.file.size,
              originalName: req.file.originalname
            };
          } else {
            // Remove the digital file reference
            updateData.digitalFile = null;
          }
        }
    
        // Update the book
        const updatedBook = await Book.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        )

        if (!updatedBook) {
          return next(new ApiError(404, "Book not found"));
        }

        res.status(200).json(new ApiResponse(200, updatedBook, 'Book updated successfully'));
    } catch (error) {

        //delete newly uploaded file if it exists and there was an error
        if (req.file) {
            const newFilePath = path.join(__dirname, '../public/uploads/books', req.file.filename);
            deleteFile(newFilePath);
          }
        console.log("error in updateBook: ", error)
        return next(new ApiError(500, "Something went wrong while updating book"));
    }
})
    

const deleteBook = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return next(new ApiError(400, "Book ID is required"));
        }

        const book = await Book.findByIdAndDelete(id);

        if (!book) {
            return next(new ApiError(404, "Book not found"));
        }

        // Delete the digital file if it exists
        if (book.digitalFile && book.digitalFile.path) {
            deleteFile(book.digitalFile.path);
        }

        res.status(200).json(new ApiResponse(200, null, 'Book deleted successfully'));
    } catch (error) {
        console.log("error in deleteBook: ", error)
        return next(new ApiError(500, "Something went wrong while deleting book"));
    }
})



const getAllBooks = asyncHandler(async (req, res, next) => {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
        populate: { path: 'categories', select: 'name' }
      };
  
      const result = await Book.paginate({}, options);
  
      if (!result.docs || result.docs.length === 0) {
        return next(new ApiError(404, "No books found"));
      }
  
      const response = {
        books: result.docs,
        pagination: {
          totalBooks: result.totalDocs,
          totalPages: result.totalPages,
          currentPage: result.page,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          nextPage: result.nextPage,
          prevPage: result.prevPage,
          limit: result.limit
        }
      };
  
      res.status(200).json(new ApiResponse(200, response, 'Books retrieved successfully'));
    } catch (error) {
      console.error("Error in getAllBooks: ", error);
      return next(new ApiError(500, "Failed to retrieve books"));
    }
  });

  export{
    AddBooks,
    updateBook,
    deleteBook,
    getAllBooks
  }