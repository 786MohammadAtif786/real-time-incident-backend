import { Router } from "express";
import { login, register, refreshTokenHandler, profile, logout, updateUser, deleteUser, getMe } from "../controllers/userControllers.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/Upload.js";

const router = Router();


router.post("/register", upload.single("profilePic"), register);
router.post("/login", login);
router.post("/refresh",  refreshTokenHandler);
router.get("/profile", protect, profile);
router.post("/logout", protect, logout);
router.put(
  "/update-user",
  protect,
  upload.single("profilePic"),
  updateUser
);

router.delete(
  "/delete",
  protect,
  deleteUser
);

router.get(
  "/me",
  protect,
  getMe
);



export default router
