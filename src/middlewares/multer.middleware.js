import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'coverImage') {
        cb(null, "./public/coverImage");
      } else if (file.fieldname === 'digitalFile') {
        cb(null, "./public/uploads/books");
      }
    else{
      cb(null, "./public/temp")
    }
  },  
    filename: function (req, file, cb) {
      
      cb(null,Date.now()+ '-'+ file.originalname)
    }
  })

  
export const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
})

// // Ensure the directory exists
// const uploadDir = './public/uploads/books';
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const bookStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadDir); // Set destination to the folder
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + uniqueSuffix + ext);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const filetypes = /pdf|epub|docx?/;
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = filetypes.test(file.mimetype);

//   if (extname && mimetype) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only PDF, EPUB, and Word documents are allowed!'));
//   }
// };

// export const BookUpload = multer({
//   storage: bookStorage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
// });


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Helper function to delete file
export const deleteFile = (filePath) => {
  if (!filePath) return;
  
  const fullPath = path.join(__dirname, '..', 'public', filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Successfully deleted file: ${fullPath}`);
    } catch (err) {
      console.error(`Error deleting file: ${fullPath}`, err);
    }
  }
};
