import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { isAdmin } from "../middlewares/Admin.middleware.js";
import { createCategory, deleteCategory, getCategoryNames, getCategoryBooks} from "../controller/category.controller.js"


const router = Router();

router.route("/:id").delete(verifyJWT, isAdmin, deleteCategory);
router.route("/books/:categoryId").get(getCategoryBooks)
router.route("/add").post(verifyJWT,isAdmin,createCategory);
router.route("/").get(getCategoryNames)


export default router;
