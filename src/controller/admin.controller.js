import { ApiError } from "../utils/ApiError.js"; // Assuming you have a custom ApiError handler
import { Admin } from "../models/admin.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ActivityLog } from "../models/ActivityLog.model.js";
//todo:---------------------------AUTH---------
const generateAccessAndRefereshTokens = async (userId) => {
	try {

		const user = await Admin.findById(userId);
		const accessToken = user.generateAccessToken();
		console.log("access token=", accessToken);

		const refreshToken = user.generateRefreshToken();

		user.refreshToken = refreshToken;
		await user.save({ validateBeforeSave: false });

		return { accessToken, refreshToken };
	} catch (error) {
		throw new ApiError(
			500,
			"Something went wrong while generating referesh and access token"
		);
	}
};

const createAdmin = async (req, res, next) => {
	try {
		const { email, password, fullName } = req.body;


		if (
			[fullName, email, password].some(
				(field) => field?.trim() === ""
			)
		) {
			return next(new ApiError(400, "All fields are required"));

		}

		// Check if the admin already exists
		const existingAdmin = await Admin.findOne({ email });
		if (existingAdmin) {
			throw new ApiError(
				400,
				"Admin with this email already exists."
			);
		}


		// Create new admin
		const newAdmin = await Admin.create({
			email: email, // Use .env email if not provided
			password,
			fullName,
			// avatar: avatar
		});


		const createdAdmin = await Admin.findById(
			newAdmin._id
		).select("-password -refreshToken");

		if (!createdAdmin) {
			throw new ApiError(
				500,
				"Something went wrong while registering the user"
			);
		}

		res
			.status(201)
			.json(
				new ApiResponse(
					201,
					createdAdmin,
					"Admin created successfully"
				)
			);
	} catch (error) {
		console.error('Error in admin.controller (createAdmin) :', error);
		return next(new ApiError(500, 'Internal server error in createAdmin'));
	}
}

const loginAdmin = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			throw new ApiError(
				400,
				"Email and password are required."
			);
		}

		const admin = await Admin.findOne({
			email
		});

		if (!admin) {
			return next(new ApiError(404, "Admin not found."));

		}

		const isPasswordCorrect = await admin.isPasswordCorrect(
			password
		);
		if (!isPasswordCorrect) {
			return next(new ApiError(400, "Invalid credentials."));

		}

		const { accessToken, refreshToken } =
			await generateAccessAndRefereshTokens(admin?._id);


		// console.log(accessToken, refreshToken);

		const loggedInAdmin = await Admin.findById(
			admin._id
		).select("-password -refreshToken");

		console.log(
			`admin ${loggedInAdmin.fullName} is logged in !! \nDate: `,
			new Date().toDateString(),
			"\ntime: ",
			new Date().toLocaleTimeString()
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
						user: loggedInAdmin,
						accessToken,
						refreshToken,
					},
					`Welcome Admin : ${loggedInAdmin.fullName}`
				)
			);
	} catch (error) {
		console.error('Error in admin.controller (Login admin) :', error);
		return next(new ApiError(500, 'Internal server error in Login admin', error));
	}
}


const logoutAdmin = async (req, res, next) => {
	await Admin.findByIdAndUpdate(
		req.user_id,
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
		.json(new ApiResponse(200, {}, "Admin logged Out"));
}


const refreshAccessToken = async (req, res, next) => {
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

		const user = await Seller.findById(decodedToken?._id);

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
		throw new ApiError(
			401,
			error?.message || "Invalid refresh token"
		);
	}
}


const changeCurrentPassword = async (req, res, next) => {

	try {
		const { oldPassword, newPassword } = req.body;

		if (!newPassword || newPassword.trim() === "") {
			return next(new ApiError(400, "New password is required"));

		}


		const user = await Admin.findById(req.user?._id);
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



const getActivityLogs = async (req, res) => {
	const { page = 1, limit = 20, action, entityType, userId } = req.query;

	const filter = {};
	if (action) filter.action = action;
	if (entityType) filter.entityType = entityType;
	if (userId) filter.user = userId;

	const options = {
		page: parseInt(page),
		limit: parseInt(limit),
		sort: { createdAt: -1 },
		populate: [
			{ path: 'user', select: 'fullName email' },
			{ path: 'entityId', select: 'title name digitalFile' }
		]
	};

	const result = await ActivityLog.paginate(filter, options);

	res.status(200).json({
		success: true,
		data: result
	});
}

export {

	createAdmin,
	loginAdmin,
	logoutAdmin,
	refreshAccessToken,
	changeCurrentPassword,
	getActivityLogs,

};
