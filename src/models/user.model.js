import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        // username: {
        //     type: String,
        //     required: true,
        //     unique: true,
        //     lowercase: true,
        //     trim: true, 
        //     index: true
        // },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        },

        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },

        phoneNo: {
            type: Number,
            trim:true,
            },
        
        DOB: {
            type:String,
        },

        sex: {
            type:String,
            enum:['Male', 'Female', 'Other'],
           
            },
        
        password: {
            type: String
        },
        refreshToken: {
            type: String
        },

        bookLimit:{
            type: Number,
            default:20
        },
        

        unreadNotifications:{
            type: Number,
            default: 0,
        }

    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {

    //agar password change na hua ho to run mt kro
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    try {
        return jwt.sign(
            {
                _id: this._id,
                email: this.email,
                fullName: this.fullName,
                role: 'user'
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        );
    } catch (error) {
        console.error('Error generating access token:', error);
        throw new Error('Could not generate access token');
    }
};

userSchema.methods.generateRefreshToken = function(){
    try {
        return jwt.sign(
            {
                _id: this._id,
            },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        );
    } catch (error) {
        console.error('Error generating refresh token:', error);
        throw new Error('Could not generate refresh token');
    }
};


export const User = mongoose.model("User",userSchema)