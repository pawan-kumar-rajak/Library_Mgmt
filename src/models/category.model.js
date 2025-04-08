import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const categorySchema  = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true, 
            index: true
        },
        description:{
            type:String,
            required:true,
        },

        createdAt:{
            type: Date,
            default: Date.now
        },
     
    }
)

export const Category = mongoose.model('Category', categorySchema);