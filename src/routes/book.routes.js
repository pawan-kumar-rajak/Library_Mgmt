import { Router } from "express";
import { upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { isAdmin } from "../middlewares/Admin.middleware.js";

import{
    AddBooks,
    updateBook,
    deleteBook,
    getAllBooks,
    BookDetails,
    searchBooks,
    filterBooks,
  } from "../controller/books.controller.js"

const router = Router();

router.route("/").get(getAllBooks)

router.route("/add").post(verifyJWT,upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'digitalFile', maxCount: 1 }
  ]),AddBooks);

router.route("/update/:id")
.put(verifyJWT, upload.single("digitalFile"), updateBook)

router.route("/delete/:id")
.delete(verifyJWT, deleteBook);

// router.route("/details/:BookId").get(verifyJWT, BookDetails)
router.route("/details/:BookId").get(BookDetails)

router.route("/search").get(searchBooks)

router.route("/filter").get(filterBooks)

export default router;
