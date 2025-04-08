import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName:  { type: String, required: true },
  avatar: {type:String, default:"https://res.cloudinary.com/drnbjnbzn/image/upload/v1731772553/360_F_227450952_KQCMShHPOPebUXklULsKsROk5AvN6H1H_nqolnb.jpg"},
  refreshToken: {
    type: String
},
},{Timestamp:true});


adminSchema.pre("save", async function (next) {

    //agar password change na hua ho to run mt kro
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

adminSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}


adminSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
            role: 'Admin'
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            // expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            expiresIn: '1h'
        }
    )
}
adminSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const Admin = mongoose.model('Admin', adminSchema);

