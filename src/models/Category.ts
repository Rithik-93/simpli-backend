import mongoose, { Schema } from 'mongoose';
import type { CMSCategoryDocument } from '../types/cms';

const categorySchema = new Schema<CMSCategoryDocument>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: {
      values: ['furniture', 'singleLine', 'service'],
      message: 'Category type must be furniture, singleLine, or service'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
  toJSON: {
    transform: function(doc, ret) {
      // @ts-ignore
      ret.id = ret._id;
      // @ts-ignore
      delete ret._id;
      // @ts-ignore
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
categorySchema.index({ name: 1 });
categorySchema.index({ type: 1 });
categorySchema.index({ isActive: 1 });

export default mongoose.model<CMSCategoryDocument>('Category', categorySchema); 