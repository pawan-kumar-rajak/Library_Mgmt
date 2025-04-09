import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Book } from "../models/books.model.js";
import path from "path";
import { deleteFile } from "../middlewares/multer.middleware.js";
import { getPDFPageCount } from "../middlewares/multer.middleware.js";
import { Category } from "../models/category.model.js";
import { logActivity } from "../utils/ActivityLog.js";
const AddBooks = async (req, res, next) => {
  try {
    const { title, author, publisher, publicationYear, isbn, description, categories, availability, language } = req.body;
    
    const existedBook = await Book.findOne({ isbn: isbn });
    if (existedBook) {
      // return next(new ApiError(409, "Book with this ISBN already exists"));
    }

    const categoriesArray = await Category.find({ name: { $in: categories } }).select('_id'); // Query for categories by name
    const categoryIds = categoriesArray.map(category => category._id); // Extract the _id from the returned categories

    const totalPages = await getPDFPageCount(req.files.digitalFile[0].path);

    const digitalFile = req.files.digitalFile ? {
      localPath: `/uploads/books/${req.files.digitalFile[0].filename}`,
      universalPath:`${process.env.IP_ADDRESS}/uploads/books/${req.files.digitalFile[0].filename}`,
      mimeType: req.files.digitalFile[0].mimetype,
      size: req.files.digitalFile[0].size,
      originalName: req.files.digitalFile[0].originalname,
      totalPages: totalPages
    } : null;


    if (!digitalFile) {
      return next(new ApiError(400, "Digital file is required"));
    }


    const imagePath = `${process.env.IP_ADDRESS}/coverImage/${req.files.coverImage[0].filename}`; 
    



    const book = await Book.create({
      title,
      author,
      publisher,
      publicationYear,
      isbn,
      description,
      categories:categoryIds,
      digitalFile,
      availability,
      language,
      coverImage: imagePath
    });

    if (!book) {
      return next(new ApiError(409, "Book not created"));
    }

    await logActivity(req, 'CREATE_BOOK', 'Book', book.id,book);

    res.status(201).json(new ApiResponse(201, book, 'Book created Successfully'));
  } catch (error) {
    console.log("error in AddBooks: ", error)
    return next(new ApiError(500, "Something went wrong while creating book"));
  }
}


const updateBook = async (req, res, next) => {
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

    await logActivity(req, 'UPDATE_BOOK', 'Book', updatedBook.id, updatedBook);

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
}


const deleteBook = async (req, res, next) => {
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

    await logActivity(req, 'DELETE_BOOK', 'Book', book.id, book);

    res.status(200).json(new ApiResponse(200, null, 'Book deleted successfully'));
  } catch (error) {
    console.log("error in deleteBook: ", error)
    return next(new ApiError(500, "Something went wrong while deleting book"));
  }
}



const getAllBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    console.log("role", req.role)
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

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
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      populate: { path: 'categories', select: 'name' },
      select:"title description author publisher coverImage reads rating totalRating categories availability",
    };

    const result = await Book.paginate({ availability: availabilityFilter }, options);

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
}


const searchBooks = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    console.log("search: ", search)
    if (!search) {
      return next(new ApiError(400, "Search query is required"));
    }

    const query = {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { publisher: { $regex: search, $options: 'i' } },
        { 'categories.name': { $regex: search, $options: 'i' } } 
      ]
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: { path: 'categories', select: 'name' },
      select:"title description author publisher coverImage reads rating totalRating categories availability",
    };

    const result = await Book.paginate(query, options);

    if (!result.docs || result.docs.length === 0) {
      return next(new ApiError(404, "No books found matching your search"));
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


    res.status(200).json(new ApiResponse(200, response, 'Search results retrieved successfully'));
  } catch (error) {
    console.error("Error in searchBooks: ", error);
    return next(new ApiError(500, "Failed to search books"));
  }
}


const filterBooks = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      author,
      categories,
      publicationYear,
      resourceType,
      language
      
    } = req.query;

    const query = {};
    
    // Author filter (partial match)
    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }

    // Categories filter (array of category IDs)
    if (categories) {
      const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
      query.categories = { $in: categoryArray };
    }

    // Publication year filter (exact or range)
    if (publicationYear) {
      if (publicationYear.includes('-')) {
        const [start, end] = publicationYear.split('-').map(Number);
        query.publicationYear = { $gte: start, $lte: end };
      } else {
        query.publicationYear = Number(publicationYear);
      }
    }

    
    if(resourceType) {
      query.resourceType = { $regex: resourceType, $options: 'i' };
    }

    if(language) {
      query.language = { $regex: language, $options: 'i' };
    }

   

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: { path: 'categories', select: 'name' },
      select:"title description author publisher coverImage reads rating totalRating categories availability",
    };

    const result = await Book.paginate(query, options);

    if (!result.docs || result.docs.length === 0) {
      return next(new ApiError(404, "No books found matching your filters"));
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

    res.status(200).json(new ApiResponse(200, response, 'Filtered books retrieved successfully'));
  } catch (error) {
    console.error("Error in filterBooks: ", error);
    return next(new ApiError(500, "Failed to filter books"));
  }
}


const BookDetails = async (req, res, next) => {
  try {
    // const userId = req.user._id;
    const { BookId } = req.params;
    if (!BookId) {
      return next(new ApiError(400, "Book ID is required"));
    }
  console.log("books", BookId)
    // const user = await User.findById(userId).select("bookLimit")
  
    let book;
    // if(user.bookLimit <= 0){
    //   book = await Book.findById(BookId).populate('categories', 'name').select('-digitalFile');
    // }
    book = await Book.findById(BookId).populate('categories', 'name');
    if (!book) {
      return next(new ApiError(404, "Book not found"));
    }
  
    res.status(200).json(new ApiResponse(200, book, 'Book retrieved successfully'));
  } catch (error) {
    console.error("Error in BookDetails: ", error);
    return next(new ApiError(500, "Failed to retrieve book details"));
  }
}
  
export {
  AddBooks,
  updateBook,
  deleteBook,
  getAllBooks,
  searchBooks,
  BookDetails,
  filterBooks}