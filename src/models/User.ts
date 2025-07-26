import mongoose, { Schema } from 'mongoose';
import type { CMSUserDocument } from '../types/cms';

const userSchema = new Schema<CMSUserDocument>({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['admin', 'editor'],
      message: 'Role must be admin or editor'
    },
    default: 'editor'
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
      // @ts-ignore
      delete ret.password; // Don't include password in JSON responses
      return ret;
    }
  }
});

// Indexes for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

export default mongoose.model<CMSUserDocument>('User', userSchema); 