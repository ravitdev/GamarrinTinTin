import { Router } from "express";
import { StorageController } from "./storage.controller";
import { upload } from "../../config/multer.config";

const router = Router();

router.post(
  "/products/:productId/image",
  upload.single("file"),
  StorageController.uploadProductImage,
);

router.get("/image", StorageController.getImageUrl);

export default router;