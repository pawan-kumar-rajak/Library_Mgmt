import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/Auth.middleware.js";

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    ProfileUpdate,
    changeCurrentPassword,
} from "../controller/user.controller.js"

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh").post(verifyJWT,refreshAccessToken);
router
    .route("/profile")
    .put(verifyJWT, ProfileUpdate)

router.route("/change-password").put(verifyJWT, changeCurrentPassword);

   

export default router;
