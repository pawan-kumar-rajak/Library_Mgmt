import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Book } from "../models/books.model.js";
import { UserBookInteraction } from "../models/booksIntraction.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const markAsRead = asyncHandler(async (req, res, next) => {
    try {
        const { bookId } = req.params;
        const { currentPage, totalPages } = req.body;
        const userId = req.user._id;

        // Calculate percentage
        const percentage = Math.round((currentPage / totalPages) * 100);
        const isCompleted = percentage >= 100;

        // Atomic update operation
        const interaction = await UserBookInteraction.findOneAndUpdate(
            { user: userId, book: bookId },
            {
                $set: {
                    lastReadPage: currentPage,
                    readPercentage: percentage,
                    readStatus: isCompleted ? 'completed' : 'reading',
                    lastReadAt: new Date()
                },

            },
            { upsert: true, new: true }
        );


        if (isCompleted) {
            await Book.findByIdAndUpdate(bookId, { $inc: { reads: 1 } });
            await User.findByIdAndUpdate(userId, { $inc: { bookLimit: -1 } });
        }

        res.status(200).json(new ApiResponse(200,
            {
                readPercentage: interaction.readPercentage,
                status: interaction.readStatus
            },
            "Mark as read :success"
        ));
    } catch (error) {
        console.error('Error in BookIntraction.controller (Mark as read) :', error);
        return next(new ApiError(500, 'Internal server error in Mark as read'));
    }
});


const markAsFavorite = asyncHandler(async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user._id;

        const interaction = await UserBookInteraction.findOneAndUpdate(
            { user: userId, book: bookId },
            { $set: { isFavorite: true } },
            { upsert: true, new: true }
        );

        res.status(200).json(new ApiResponse(200,
            {
                isFavorite: interaction.isFavorite
            },
            "Mark as favorite : success"
        ));
    } catch (error) {
        console.error('Error in BookIntraction.controller (Mark as fav) :', error);
        return next(new ApiError(500, 'Internal server error in Mark as fav'));
    }
});


const removeFromFavorite = asyncHandler(async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user._id;

        const interaction = await UserBookInteraction.updateOne(
            { user: userId, book: bookId },
            { $set: { isFavorite: false } },
            { upsert: true, new: true }
        );

        res.status(200).json(new ApiResponse(200,
            {
                isFavorite: interaction.isFavorite
            },
            "remove from favorite: success"
        ));
    } catch (error) {
        console.error('Error in BookIntraction.controller (Mark as fav) :', error);
        return next(new ApiError(500, 'Internal server error in Mark as fav'));
    }
});



const getFavoriteBooks = asyncHandler(async (req, res) => {
  try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;
  
      const options = {
          page: parseInt(page),
          limit: parseInt(limit),
          populate: {
              path: 'book',
              select: 'title author coverImage',
              populate: {
                  path: 'categories',
                  select: 'name'
              }
          }
      };
  
      const result = await UserBookInteraction.paginate(
          { user: userId, isFavorite: true },
          options
      );
  
      res.status(200).json(new ApiResponse(200,
          {
              books: result.docs.map(doc => doc.book),
              pagination: {
                  total: result.totalDocs,
                  pages: result.totalPages,
                  page: result.page,
                  limit: result.limit
              },
          },
          "Favorite books retrieved successfully"
      ));
  } catch (error) {
    console.error('Error in BookIntraction.controller (Favourite Books) :', error);
    return next(new ApiError(500, 'Internal server error in Favourite Books'));
  }
});


const getReadBooks = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { page = 1, limit = 10, status='reading' } = req.query;

    const query = {
        user: userId,
        readPerentage: { $gt: 0 }
    };

    if (status === 'completed') {
        query.readStatus = 'completed';
    } else if (status === 'reading') {
        query.readStatus = 'reading';
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { lastReadAt: -1 },
        populate: {
            path: 'book',
            select: 'title author coverImage reads',
            populate: {
                path: 'categories',
                select: 'name'
            }
        }
    };

    const result = await UserBookInteraction.paginate(query, options);

    res.status(200).json(new ApiResponse(200,
        {
            books: result.docs.map(doc => ({
                ...doc.book.toObject(),
                readPercentage: doc.readPercentage,
                lastReadAt: doc.lastReadAt
            })),
            pagination: {
                total: result.totalDocs,
                pages: result.totalPages,
                page: result.page,
                limit: result.limit
            }
        },
        "Read books retrieved successfully"
    ));
});


const giveBookNotes = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const { notes } = req.body;
    const userId = req.user._id;

    const interaction = await UserBookInteraction.findOneAndUpdate(
        { user: userId, book: bookId },
        { $set: { bookNotes: notes } },
        { new: true }
    );

    if (!interaction) {
        return res.status(404).json(new ApiError(404, 'Book not found'));
    }

    res.status(200).json(new ApiResponse(200,
        {
            bookNotes: interaction.bookNotes
        },
        "Book notes updated successfully"
    ));
})

const getBookNotes = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const userId = req.user._id;

    const interaction = await UserBookInteraction.findOne(
        { user: userId, book: bookId },
        { bookNotes: 1 }
    );

    if (!interaction) {
        return res.status(404).json(new ApiError(404, 'Book not found'));
    }

    res.status(200).json(new ApiResponse(200,
        {
            bookNotes: interaction.bookNotes
        },
        "Book notes retrieved successfully"
    ));
});

export{
    markAsRead,
    markAsFavorite,
    removeFromFavorite,
    getFavoriteBooks,
    getReadBooks,
    getBookNotes,
    giveBookNotes
}