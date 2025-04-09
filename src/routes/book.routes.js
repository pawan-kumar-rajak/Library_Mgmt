import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { isAdmin } from "../middlewares/Admin.middleware.js";

import {
  AddBooks,
  updateBook,
  deleteBook,
  getAllBooks,
  BookDetails,
  searchBooks,
  filterBooks,
} from "../controller/books.controller.js"

const router = Router();

router.route("/").get((req, res, next) => {
  if (req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "")) {
    return verifyJWT(req, res, next); // Only apply JWT middleware if the authorization header exists
  }
  next();
}, getAllBooks)

router.route("/add").post(verifyJWT, isAdmin, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'digitalFile', maxCount: 1 }
]),
  AddBooks);

router.route("/update/:id")
  .put(verifyJWT, isAdmin, upload.single("digitalFile"), updateBook)

router.route("/delete/:id")
  .delete(verifyJWT, isAdmin, deleteBook);

// router.route("/details/:BookId").get(verifyJWT, BookDetails)
router.route("/details/:BookId").get((req, res, next) => {
  if (req.cookies?.accessToken ||
req.header("Authorization")?.replace("Bearer ", "")) {
    return verifyJWT(req,res,next); // Only apply JWT middleware if the authorization header exists
  }
  next(); // If no token, continue to next middleware (filterByLocation for non-logged-in users)
},BookDetails)

router.route("/search").get(searchBooks)

router.route("/filter").get(filterBooks)

export default router;
