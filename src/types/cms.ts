import { Document } from 'mongoose';

// Base CMS Item interface
export interface CMSItem {
  id: string;
  name: string;
  category: string;
  type: 'furniture' | 'singleLine' | 'service';
  basePrice: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Document interface
export type CMSItemDocument = Omit<CMSItem, 'id'> & Document;

// API Request/Response interfaces
export interface CreateItemRequest {
  name: string;
  category: string;
  type: 'furniture' | 'singleLine' | 'service';
  basePrice: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  id: string;
}

export interface DeleteItemRequest {
  id: string;
}

export interface GetItemsRequest {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: string;
  isActive?: boolean;
}

export interface GetItemsResponse {
  success: boolean;
  data: CMSItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface SingleItemResponse {
  success: boolean;
  data: CMSItem;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

// Category interfaces
export interface CMSCategory {
  id: string;
  name: string;
  type: 'furniture' | 'singleLine' | 'service';
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CMSCategoryDocument = Omit<CMSCategory, 'id'> & Document;

export interface CreateCategoryRequest {
  name: string;
  type: 'furniture' | 'singleLine' | 'service';
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

// User interfaces
export interface CMSUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CMSUserDocument = Omit<CMSUser, 'id'> & Document;

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'editor';
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalItems: number;
  activeItems: number;
  totalCategories: number;
  activeCategories: number;
  totalUsers: number;
  activeUsers: number;
  itemsByType: {
    furniture: number;
    singleLine: number;
    service: number;
  };
  itemsByCategory: Array<{
    category: string;
    count: number;
  }>;
  recentItems: CMSItem[];
} 