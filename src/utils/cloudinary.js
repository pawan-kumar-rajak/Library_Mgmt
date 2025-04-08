import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// A helper function to retry Cloudinary uploads
const uploadOnCloudinary = async (localFilePath, folderName = 'default', retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Set the folder dynamically based on the route (folderName)
      const folderPath = `/${folderName}/`;

      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto", // auto-detects the file type
        folder: folderPath,    // Specify the folder path here
        eager: [
          {
            width: 1000,
            height: 1000,
            crop: "limit",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
        overwrite: true,
        use_filename: true,
        secure: true,
      });

      // Delete the local file after successful upload
      fs.unlink(localFilePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log(`File deleted: ${localFilePath}`);
        }
      });

      return response;
    } catch (error) {
      console.error(
        `Error uploading file ${localFilePath} on attempt ${attempt}: `,
        error
      );

      // If we've exhausted all attempts, delete the file and throw error
      if (attempt === retries) {
        fs.unlink(localFilePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log(`File deleted: ${localFilePath}`);
          }
        });
      }

      // Optionally wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

// Multi-file upload to Cloudinary with specific folders
const MultiUploadOnCloudinary = async (localFilePaths, folderName = 'default') => {
  try {
    if (!localFilePaths || localFilePaths.length === 0) return [];

    const uploadPromises = localFilePaths.map((localFilePath, index) => {
      const folderPath = `/${folderName}/`;

      const transformations = [
        { width: 1000, crop: "scale" },
        { quality: "auto" },
        { fetch_format: "auto" },
        { flags: "lossy" },
      ];

      return cloudinary.uploader.upload(localFilePath, {
        resource_type: "auto", 
        folder: folderPath,  // Use the folder name passed to the function
        transformation: transformations,
      });
    });

    // Wait for all uploads to complete
    const responses = await Promise.all(uploadPromises);

    // Remove local files after upload
    localFilePaths.forEach((path) => fs.unlinkSync(path));

    // Return an array of Cloudinary URLs
    return responses.map((response) => response.secure_url);
  } catch (error) {
    localFilePaths.forEach((path) => fs.unlinkSync(path));
    console.error("Cloudinary upload failed", error);
    return [];
  }
};

// Function to delete all images from Cloudinary (existing functionality)
const deleteImageFromCloudinary = async (cloudinaryId) => {
    try {
        // Check if the cloudinaryId contains the full URL or only the public ID
        let publicId = cloudinaryId;

        // If the input is a full URL, extract the public ID part
        if (cloudinaryId.includes('cloudinary.com')) {
            const urlParts = cloudinaryId.split('/');
            publicId = urlParts.slice(-2).join('/').split('.')[0]; // Extract {folder}/{public_id}
        }

        console.log("Attempting to delete image with public ID:", publicId);

        // Delete the image from Cloudinary using the full public ID
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Cloudinary Deletion Result:', result);  // Log the result for debugging

        // Handle the case where the image is not found
        if (result.result === 'not found') {
            console.log(`Image with ID ${publicId} was not found on Cloudinary. It may have been deleted already.`);
            return; // No need to throw an error, just log that it's not found
        }

        // If deletion fails, log detailed error and throw
        if (result.result !== 'ok') {
            const errorMessage = result.error ? result.error.message : 'Unknown error during deletion';
            throw new Error(`Failed to delete image from Cloudinary: ${errorMessage}`);
        }

        console.log(`Image with ID ${publicId} deleted from Cloudinary successfully`);
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw new Error('Cloudinary image deletion failed');
    }
};



// Function to delete all images from Cloudinary (existing functionality)
const deleteAllImages = async () => {
  try {
    let next_cursor = null;
    let deletedImages = [];

    do {
      const resources = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        max_results: 100,
        next_cursor: next_cursor,
      });

      // Delete each image
      for (const image of resources.resources) {
        const public_id = image.public_id;
        await cloudinary.api.delete_resources(public_id);
        deletedImages.push(public_id);
      }

      // If there are more images, update the cursor to fetch the next set
      next_cursor = resources.next_cursor;
    } while (next_cursor);

    return deletedImages;
  } catch (error) {
    console.error('Error deleting images from Cloudinary:', error);
    throw error;
  }
};

export { uploadOnCloudinary, MultiUploadOnCloudinary, deleteImageFromCloudinary, deleteAllImages };




// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs";

// cloudinary.config({
// 	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
// 	api_key: process.env.CLOUDINARY_API_KEY,
// 	api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // A helper function to retry Cloudinary uploads
// const uploadOnCloudinary = async (localFilePath, retries = 3) => {
// 	for (let attempt = 1; attempt <= retries; attempt++) {
// 		try {
// 			// Optionally, add a timeout option in your Cloudinary config if needed.
// 			const response = await cloudinary.uploader.upload(localFilePath, {
// 				resource_type: "auto",
// 				eager: [
// 					{
// 						width: 1000,
// 						height: 1000,
// 						crop: "limit",
// 						quality: "auto",
// 						fetch_format: "auto",
// 					},
// 				],
// 				overwrite: true,
// 				use_filename: true,
// 				secure: true,
// 			});
// 			// Delete local file after successful upload
// 			fs.unlink(localFilePath, (err) => {
// 				if (err) {
// 					console.error("Error deleting file:", err);
// 				} else {
// 					console.log(`File deleted: ${localFilePath}`);
// 				}
// 			});
// 			return response;
// 		} catch (error) {
// 			console.error(
// 				`Error uploading file ${localFilePath} on attempt ${attempt}: `,
// 				error
// 			);

// 			// If we've exhausted all attempts, delete the file and throw error
// 			if (attempt === retries) {
// 				// Only unlink the file after all retries have failed
// 				fs.unlink(localFilePath, (err) => {
// 					if (err) {
// 					  console.error("Error deleting file:", err);
// 					} else {
// 					  console.log(`File deleted: ${localFilePath}`);
// 					}
// 				  });
// 			}

// 			// Optionally wait before retrying
// 			await new Promise((resolve) => setTimeout(resolve, 1000));
// 		}
// 	}
// };



// const MultiUploadOnCloudinary = async (localFilePaths) => {
// 	try {
// 		if (!localFilePaths || localFilePaths.length === 0) return [];

// 		// Handle the first image differently for background replacement
// 		const uploadPromises = localFilePaths.map((localFilePath, index) => {
// 			const transformations = [
// 				{ width: 1000, crop: "scale" },  // Resize image to 1000px wide while maintaining aspect ratio
// 				{ quality: "auto" },  // Auto-quality for optimal compression
// 				{ fetch_format: "auto" },  // Automatically choose the best format (JPEG, WebP, etc.)
// 				{ flags: "lossy" },  // Apply lossy compression for better optimization
// 			];

// 			// For the first image, apply the background replace effect
// 			if (index === 0) {
// 				transformations.push({ effect: "gen_background_replace:prompt_Light that is suitable for e-commerce platform" });
// 			}

// 			return cloudinary.uploader.upload(localFilePath, {
// 				resource_type: "auto",  // auto-detects file type (image/video)
// 				transformation: transformations,
// 			});
// 		});

// 		// Wait for all uploads to complete
// 		const responses = await Promise.all(uploadPromises);

// 		// Remove local files after upload
// 		localFilePaths.forEach((path) => fs.unlinkSync(path));

// 		// Return an array of Cloudinary URLs
// 		return responses.map((response) => response.secure_url);
// 	} catch (error) {
// 		// If any upload fails, clean up the files and return empty array
// 		localFilePaths.forEach((path) => fs.unlinkSync(path));
// 		console.error("Cloudinary upload failed", error);
// 		return [];
// 	}
// };

// /**
//  * Deletes an image from Cloudinary using its public ID.
//  * @param {string} cloudinaryId - The public ID of the image to delete.
//  * @returns {Promise<void>} - Resolves when the image is deleted or rejects if an error occurs.
//  */
// const deleteImageFromCloudinary = async (cloudinaryId) => {
// 	try {
// 		// Call the destroy method from Cloudinary to delete the image by its public_id
// 		const result = await cloudinary.uploader.destroy(cloudinaryId);

// 		// If successful, result will contain info about the deletion
// 		console.log(`Image with ID ${cloudinaryId} deleted from Cloudinary`, result);

// 		// If result is an error, it will be thrown here, you can handle that accordingly
// 		if (result.result !== 'ok') {
// 			throw new Error('Failed to delete image from Cloudinary');
// 		}
// 	} catch (error) {
// 		console.error('Error deleting image from Cloudinary:', error);
// 		throw new Error('Cloudinary image deletion failed');
// 	}
// };


// // Function to delete all images from Cloudinary
// const deleteAllImages = async () => {
// 	try {
// 	  let next_cursor = null;
// 	  let deletedImages = [];
  
// 	  do {
// 		const resources = await cloudinary.api.resources({
// 		  type: 'upload',
// 		  resource_type: 'image',
// 		  max_results: 100,
// 		  next_cursor: next_cursor,
// 		});
  
// 		// Delete each image
// 		for (const image of resources.resources) {
// 		  const public_id = image.public_id;
// 		  await cloudinary.api.delete_resources(public_id);
// 		  deletedImages.push(public_id);
// 		}
  
// 		// If there are more images, update the cursor to fetch the next set
// 		next_cursor = resources.next_cursor;
// 	  } while (next_cursor); // Loop until there are no more images
  
// 	  return deletedImages;
// 	} catch (error) {
// 	  console.error('Error deleting images from Cloudinary:', error);
// 	  throw error;
// 	}
//   };

// export { uploadOnCloudinary, MultiUploadOnCloudinary, deleteImageFromCloudinary, deleteAllImages };


