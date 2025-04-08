import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'avatar') {
        cb(null, "./public/avatar");
      } else if (file.fieldname === 'banner') {
        cb(null, "./public/banner");
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


const bookStorage = multer.diskStorage({
  destination: function (req, file, cb) {
   
      cb(null, "./public/uploads/books");
   
},  
  filename: function (req, file, cb) {
    // Use original name with timestamp to prevent conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
;

const fileFilter = (req, file, cb) => {
  const filetypes = /pdf|epub|docx?/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, EPUB, and Word documents are allowed!'));
  }
};

export const BookUpload = multer({
  bookStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});


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
