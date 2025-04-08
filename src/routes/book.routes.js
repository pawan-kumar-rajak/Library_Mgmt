import { Router } from "express";
import { upload, BookUpload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { isAdmin } from "../middlewares/Admin.middleware.js";

import{
    AddBooks,
    updateBook,
    deleteBook,
    getAllBooks
  } from "../controller/books.controller.js"

const router = Router();

router.route("/").get(getAllBooks).post(verifyJWT, upload.single("digitalFile"), AddBooks);

router.route("/:id")
.put(verifyJWT, upload.single("digitalFile"), updateBook)
.delete(verifyJWT, deleteBook);

router.route("/add").post(verifyJWT,isAdmin, BookUpload.single("digitalFile"), AddBooks);


export default router;
