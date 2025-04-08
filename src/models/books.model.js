import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2"

const bookSchema = new Schema(
    {

        title: {
            type: String,
            required: true,
            trim: true
        },
        author: {
            type: String,
            required: true,
          
        },
        publisher: {
            type: String,
            trim: true
        },
        publicationYear: {
            type: Number,
            validate: {
                validator: function (v) {
                    return v <= new Date().getFullYear();
                },
                message: props => `${props.value} is not a valid publication year!`
            }
        },
        coverImage: {
            type: String,
        },
        
        isbn: {
            type: String,
            unique: true,
            trim: true,
            validate: {
              validator: function(v) {
                return /^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(v);
              },
              message: props => `${props.value} is not a valid ISBN!`
            }
          },

          digitalFile: {
            localPath: String,
            universalPath: String,
            mimeType: String,
            size: Number,
            originalName: String
          },
      
        description: {
            type: String,
            trim: true
        },
        categories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }], 

        availability: {
            type: String,
            enum: ['public', 'students', 'faculty', 'admin'],
            default: 'public'
          },

        reads:{
            type: Number,
            default: 0
        },

        language: {
            type: String,
            enum: ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'],
            default: 'English'
        },

        rating:{
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
      
        totalRating:{
            type: Number,
            default: 0
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        resourceType:{
            type: String,
            enum: ['book', 'article', 'journal'],
            default: 'book'
        }

    }
)

bookSchema.plugin(mongoosePaginate)

export const Book = mongoose.model('Book', bookSchema);

