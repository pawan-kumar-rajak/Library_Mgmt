import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { isAdmin } from "../middlewares/Admin.middleware.js";

import { createAdmin,loginAdmin, logoutAdmin } from "../controller/admin.controller.js";

const router = Router();

router.route("/signup").post(createAdmin);
router.route("/login").post(loginAdmin);
router.route("/logout").post(verifyJWT,isAdmin, logoutAdmin)

export default router;
