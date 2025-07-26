import mongoose, { Schema } from 'mongoose';
import type { CMSItemDocument } from '../types/cms';

const itemSchema = new Schema<CMSItemDocument>({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Item type is required'],
    enum: {
      values: ['furniture', 'singleLine', 'service'],
      message: 'Item type must be furniture, singleLine, or service'
    }
  },
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
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
      delete ret._id;
      // @ts-ignore
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
itemSchema.index({ name: 'text', description: 'text' });
itemSchema.index({ category: 1 });
itemSchema.index({ type: 1 });
itemSchema.index({ isActive: 1 });
itemSchema.index({ createdAt: -1 });

// Pre-save middleware to ensure unique name within category
itemSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isModified('category')) {
    const existingItem = await mongoose.model('Item').findOne({
      name: this.name,
      category: this.category,
      _id: { $ne: this._id }
    });
    
    if (existingItem) {
      throw new Error(`Item with name "${this.name}" already exists in category "${this.category}"`);
    }
  }
  next();
});

export default mongoose.model<CMSItemDocument>('Item', itemSchema); 