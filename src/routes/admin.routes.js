import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";
import { isAdmin } from "../middlewares/Admin.middleware.js";

import { createAdmin,loginAdmin, logoutAdmin,changeCurrentPassword, getActivityLogs, getProfile } from "../controller/admin.controller.js";

const router = Router();

router.route("/signup").post(createAdmin);
router.route("/login").post(loginAdmin);
router.route("/logout").post(verifyJWT,isAdmin, logoutAdmin)
router.route("/change-password").put(verifyJWT,isAdmin, changeCurrentPassword)
router.route("/activity-logs").get(verifyJWT,isAdmin, getActivityLogs)
router.route("/profile").get(verifyJWT,isAdmin, getProfile)

export default router;
