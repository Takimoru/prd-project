import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as PostHog from "../lib/posthog";

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter - allow images and PDFs
const fileFilter = (
  req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images and PDFs are allowed"));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

// Single file upload endpoint
// Per PRD: File storage strategy with analytics tracking
router.post("/single", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  
  // Track file upload analytics (per PRD Section D.5)
  const userId = (req as any).auth?.userId || (req as any).auth?.email || 'anonymous';
  const targetId = req.body.targetId || 'unknown';
  const targetType = req.body.targetType || 'general';
  
  PostHog.trackFileUploaded(
    userId,
    req.file.originalname,
    req.file.mimetype,
    targetId,
    targetType
  );

  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// Multiple files upload endpoint
router.post("/multiple", upload.array("files", 10), (req, res) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const userId = (req as any).auth?.userId || (req as any).auth?.email || 'anonymous';
  const targetId = req.body.targetId || 'unknown';
  const targetType = req.body.targetType || 'general';

  const files = (req.files as Express.Multer.File[]).map((file) => {
    // Track each file upload
    PostHog.trackFileUploaded(
      userId,
      file.originalname,
      file.mimetype,
      targetId,
      targetType
    );

    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  });

  res.json({
    success: true,
    files,
  });
});

// Generate upload URL (for client-side direct uploads if needed)
router.post("/generate-url", (req, res) => {
  const { filename, contentType } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({ error: "filename and contentType required" });
  }

  const uniqueName = `${uuidv4()}${path.extname(filename)}`;
  const fileUrl = `/uploads/${uniqueName}`;

  res.json({
    uploadUrl: fileUrl,
    filename: uniqueName,
  });
});

// Serve uploaded files
router.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.sendFile(filePath);
});

// Stream file download
router.get("/download", (req, res) => {
  const { file, name } = req.query;

  if (!file || typeof file !== "string") {
    return res.status(400).json({ error: "File parameter required" });
  }

  // Prevent directory traversal
  const safeFilename = path.basename(file);
  const filePath = path.join(uploadsDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  // Set filename for download (use provided name or fallback to stored filename)
  const downloadName = typeof name === "string" ? name : safeFilename;

  res.download(filePath, downloadName, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  });
});

export default router;

