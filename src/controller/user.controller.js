import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
	try {

		const user = await User.findById(userId);
		const accessToken = user.generateAccessToken();
		const refreshToken = user.generateRefreshToken();


		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		return next(new ApiError(
			500,
			"Something went wrong while generating referesh and access token"
		))
	}
};


const registerUser = asyncHandler(async (req, res, next) => {
	try {
		const { fullName, email, password, phoneNo, otp, sex } = req.body;
	
		if ([fullName, email, password, sex].some((field) => field?.trim() === "")) {
			return next(new ApiError(400, "All fields are required"));
	
		}
	
		if (!phoneNo) {
			return next(new ApiError(400, "phoneNo is required"));
	
		}
	
		// Check if the user already exists
		const existedUser = await User.findOne({ email: email });
		if (existedUser) {
			return next(new ApiError(409, "User with email already exists"));
	
		}
	
		// Proceed with user registration
		const user = await User.create({
			fullName,
			email,
			password,
			phoneNo,
			sex,
		});
	
        // hum yha pr sensitive info delete kr denge users ki
		const createdUser = await User.findById(user._id).select("-password -refreshToken");
	
		// Check if user creation was successful
		if (!createdUser) {
			return next(new ApiError(500, "Something went wrong while registering the user"));
	
		}

		// Send success response
		return res.status(201).json(
			new ApiResponse(200, { createdUser }, "User registered successfully")
		);
	} catch (error) {
		console.log("err in Register Customer: ", error)
		return next(new ApiError(500, "internal server error in Customer registration",error))
	}
});


const loginUser = asyncHandler(async (req, res, next) => {
	
	try {
		const { email, password } = req.body;
		console.log("email:", email)
		if (!(email)) {
			throw new ApiError(
				400,
				"email is required"
			);
		}
	
		const user = await User.findOne({
			email
		});
	
		if (!user) {
			return next(new ApiError(404, "User does not exist"));
	
		}
	
		const isPasswordValid = await user.isPasswordCorrect(
			password
		);
	
		if (!isPasswordValid) {
			return next(new ApiError(401, "Invalid user credentials"));
	
		}
	
		const { accessToken, refreshToken } =
			await generateAccessAndRefereshTokens(user._id);
	
		const loggedInUser = await User.findById(user._id).select(
			"-password -refreshToken"
		);
	
		const options = {
			httpOnly: true,
			secure: true,
		};
	
		return res
			.status(200)
			.cookie("accessToken", accessToken, options)
			.cookie("refreshToken", refreshToken, options)
			.json(
				new ApiResponse(
					200,
					{
						user: loggedInUser,
						accessToken,
						refreshToken,
					},
					"User logged In Successfully"
				)
			);
	} catch (error) {
		console.error('Error in customers.controller (Login customer) :', error);
		return next(new ApiError(500, 'Internal server error in Login customer'));
	}
});

const logoutUser = asyncHandler(async (req, res, next) => {
	await User.findByIdAndUpdate(
		req.user._id,
		{
			$unset: {
				refreshToken: 1, // this removes the field from document
			},
		},
		{
			new: true,
		}
	);

	const options = {
		httpOnly: true,
		secure: true,
	};

	return res
		.status(200)
		.clearCookie("accessToken", options)
		.clearCookie("refreshToken", options)
		.json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(
	async (req, res, next) => {
		const incomingRefreshToken =
			req.cookies.refreshToken || req.body.refreshToken || req.header("Authorization")?.replace("Bearer ", "");;

		if (!incomingRefreshToken) {
			return next(new ApiError(401, "unauthorized request"));

		}

		try {
			const decodedToken = jwt.verify(
				incomingRefreshToken,
				process.env.REFRESH_TOKEN_SECRET
			);

			const user = await User.findById(decodedToken?._id);

			if (!user) {
				return next(new ApiError(401, "Invalid refresh token"));

			}

			if (incomingRefreshToken !== user?.refreshToken) {
				throw new ApiError(
					401,
					"Refresh token is expired or used"
				);
			}

			const options = {
				httpOnly: true,
				secure: true,
			};

			const { accessToken, refreshToken } =
				await generateAccessAndRefereshTokens(user._id);

			return res
				.status(200)
				.cookie("accessToken", accessToken, options)
				.cookie("refreshToken", refreshToken, options)
				.json(
					new ApiResponse(
						200,
						{ user, accessToken, refreshToken: refreshToken },
						"Access token refreshed"
					)
				)
				.on('finish', () => {
					console.log('Cookies Set:', res.getHeaders()['set-cookie']);
				});

		} catch (error) {
			console.error('Error verifying JWT:', error);  // Log the error
			return next( new ApiError(
				401,
				error?.message || "Invalid refresh token"
			))
		}
	}
);

const ProfileUpdate = asyncHandler(async (req, res, next) => {
	try {
		const { DOB, sex, phoneNo, fullName } = req.body;
		const userId = req.user._id; // Assuming the user's ID is available via the authenticated request.
	
	
	
		// Find the user by email
		const existingUser = await User.findById(userId);
		if (!existingUser) {
			return next(new ApiError(404, "User not found. Bad authentication"));
	
		}
	
		// Update the profile fields if they are provided in the request body
		if (fullName) existingUser.fullName = fullName;
		if (phoneNo) existingUser.phoneNo = phoneNo;
		if (DOB) existingUser.DOB = DOB;
		if (sex) existingUser.sex = sex;
	
	
	
		// Save the updated user
		const updatedUser = await existingUser.save();
	
		// Ensure user data is returned without sensitive information like password or refreshToken
		const userResponse = await User.findById(updatedUser._id).select("-password -refreshToken");
	
		// Send response with updated user data
		return res.status(200).json(
			new ApiResponse(200, userResponse, "User profile updated successfully")
		);
	} catch (error) {
		console.log("error in Customer Profile Update: ", error);
		return next(new ApiError(500,"Internal Server Error in Profile Update"))
	}
});

const changeCurrentPassword = asyncHandler(
	async (req, res, next) => {

		// const incomingRefreshToken =
		// 	req.cookies.refreshToken || req.body.refreshToken;

		// if (!incomingRefreshToken) {
		// 	return next(new ApiError(401, "unauthorized request"));

		// }

		try {
			const { oldPassword, newPassword } = req.body;
	
			if (!newPassword || newPassword.trim() === "") {
				return next(new ApiError(400, "New password is required"));
	
			}
	
	
			const user = await User.findById(req.user?._id);
			console.log("user password: ", user.password)
	
			if (user.password) {
	
				if (!oldPassword || oldPassword.trim() === "") {
					return next(new ApiError(400, "Old password is required"));
	
				}
	
				const isPasswordCorrect = await user.isPasswordCorrect(
					oldPassword
				);
	
				if (!isPasswordCorrect) {
					return next(new ApiError(400, "Invalid old password"));
	
				}
	
				user.password = newPassword;
				await user.save({ validateBeforeSave: false });
	
			} else {
				user.password = newPassword;
				await user.save()
			}
	
			return res
				.status(200)
				.json(
					new ApiResponse(
						200,
						{},
						"Password changed successfully"
					)
				);
		} catch (error) {
			console.error('Error in customers.controller (change password) :', error);
			return next(new ApiError(500, 'Internal server error in change password'));
		}
	}
);

const getProfile = asyncHandler(async (req, res, next) => {
	try {
		const userId = req.user._id; // Assuming the user's ID is available via the authenticated request.

		// Find the user by ID and exclude sensitive fields
		const user = await User.findById(userId).select("-password -refreshToken");

		if (!user) {
			return next(new ApiError(404, "User not found"));
		}

		return res.status(200).json(
			new ApiResponse(200, { user }, "User profile fetched successfully")
		);
	} catch (error) {
		console.error('Error in customers.controller (get profile) :', error);
		return next(new ApiError(500, 'Internal server error in get profile'));
	}
})



const resetBookLimits = async () => {
	try {
	  const now = new Date();
	  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	  
	  // Find users whose registration anniversary is this month
	  const result = await User.updateMany(
		{
		  $expr: {
			$eq: [{ $month: "$createdAt" }, now.getMonth() + 1]
		  }
		},
		{
		  $set: { bookLimit: 20 },
		  $inc: { unreadNotifications: 1 }
		}
	  );
  
	  console.log(`Reset book limits for ${result.modifiedCount} users`);
	} catch (error) {
	  console.error('Error resetting book limits:', error);
	}
  };
  
  

export {
	
	registerUser,
	loginUser,
	logoutUser,
    refreshAccessToken,
    ProfileUpdate,
    changeCurrentPassword,
	getProfile,
	resetBookLimits

}