import { Request, Response } from "express"
import { StorageService, type UploadedFile } from "./storage.service"

interface MulterRequest extends Request {
  file?: UploadedFile
}

export class StorageController {
  static async uploadProductImage(req: Request, res: Response) {
    try {
      const file = (req as MulterRequest).file
      const { productId } = req.params

      if (!file) {
        return res.status(400).json({ message: "No file provided" })
      }

      const safeFileName = file.originalname.replace(/\s+/g, "-").toLowerCase()
      const key = `products/${productId}/${Date.now()}-${safeFileName}`

      const uploadedKey = await StorageService.uploadFile(file, key)

      return res.json({
        message: "Uploaded successfully",
        key: uploadedKey,
      })
    } catch (error) {
      return res.status(500).json({
        message: "Upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  static async getImageUrl(req: Request, res: Response) {
    try {
        const { key } = req.query;

        if (!key || typeof key !== "string") {
        return res.status(400).json({ message: "Key requerido" });
        }

        const url = await StorageService.getSignedUrl(key);

        return res.json({
        success: true,
        url,
        });

    } catch (error) {
        return res.status(500).json({
        message: "Error generando URL",
        error: (error as Error).message,
        });
    }
    }
}