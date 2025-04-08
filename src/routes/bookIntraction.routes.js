import { Router } from "express";
import { upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { isAdmin } from "../middlewares/Admin.middleware.js";

import{
    markAsRead,
    markAsFavorite,
    removeFromFavorite,
    getFavoriteBooks,
    getReadBooks,
    getBookNotes,
    giveBookNotes
  } from "../controller/BookIntraction.controller.js"

const router = Router();


router.route("/mark-as-read/:bookId").post(verifyJWT, markAsRead);
router.route("/mark-as-favorite/:bookId").post(verifyJWT, markAsFavorite);
router.route("/remove-from-favorite/:bookId").post(verifyJWT, removeFromFavorite);
router.route("/favorite-books").get(verifyJWT, getFavoriteBooks);
router.route("/read-books").get(verifyJWT, getReadBooks);
router.route("/book-notes/:bookId").post(verifyJWT, giveBookNotes);
router.route("/book-notes/:bookId").get(verifyJWT, getBookNotes);

export default router;
