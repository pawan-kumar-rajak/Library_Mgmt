import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';

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




// Function to get page count from PDF
export async function getPDFPageCount(filePath) {
  const pdfBytes = fs.readFileSync(filePath); // Read the file
  const pdfDoc = await PDFDocument.load(pdfBytes); // Load PDF
  return pdfDoc.getPages().length; // Return the number of pages
}