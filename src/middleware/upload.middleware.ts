import multer from "multer";

const storage = multer.memoryStorage();

export const uploadSingleImage = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,      //max 5mb
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("hanya file gamabr yang diperbolehkaan!"));
        }
    },
}).single("image"); //"image" adalah nama key/field saat upload file 