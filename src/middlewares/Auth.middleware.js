import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Admin } from "../models/admin.model.js";

export const verifyJWT = async (req, _, next) => {
		try {
			// console.log("req: ",req)
			const token =
				req.cookies?.accessToken ||
				req.header("Authorization")?.replace("Bearer ", "");
		
			if (!token) {
				return next(new ApiError(401, "Unauthorized request"))
			}

			const decodedToken = jwt.verify(
				token,
				process.env.ACCESS_TOKEN_SECRET
			);

			// Determine the user model to query based on the role
			let user,role;
			
			
			switch (decodedToken.role) {
				
				case "user":{ 
					user = await User.findById(
						decodedToken._id
					).select("-password -refreshToken");

					role = "User"
					break;
				}
				case "Admin":{
					user = await Admin.findById(
						decodedToken._id
					).select("-password -refreshToken");
					role= "Admin"
					
					break;

				}

			
				default:
					return next(new ApiError(401, "Invalid role in token"))
			}

			if (!user) {
				return next(new ApiError(401, "Invalid Access Token"))
			}

			req.user = user;
			req.role = role;
			
			next();
		} catch (error) {
			return next( new ApiError(
				401,
				error?.message || "Invalid access token"
			))
		}
	}
