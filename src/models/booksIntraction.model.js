import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const userBookInteractionSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true
    },
    isFavorite: {
      type: Boolean,
      default: false
    },
   
    lastReadAt: Date,

    lastReadPage: {
      type: Number,
      default: 0
    },

    readStatus: {
      type: String,
      enum: ['reading', 'completed'],
      default: 'reading'
    },

    readPerentage: {
        type: Number,
        default: 0
        },
    
      bookNotes:{
        type: String,
        default: ""
      }

  }, {
    timestamps: true
  });

  
  // Compound index for fast lookups
userBookInteractionSchema.index({ user: 1, book: 1 }, { unique: true });

userBookInteractionSchema.plugin(mongoosePaginate)

export const UserBookInteraction = mongoose.model('UserBookInteraction', userBookInteractionSchema);