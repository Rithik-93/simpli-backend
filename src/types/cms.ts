// Room type enum to match Prisma schema
export type RoomType = 'BHK_1' | 'BHK_2' | 'BHK_3' | 'BHK_4';

// Base CMS interfaces matching Prisma schema
export interface CMSType {
  id: string;
  name: string;
  categories?: CMSCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSCategory {
  id: string;
  name: string;
  type?: CMSType;
  typeId: string;
  items?: CMSItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CMSItem {
  id: string;
  name: string;
  description?: string | null;
  availableInRooms: RoomType[];
  pricePerSqFt: number;
  imageUrl?: string | null;
  category?: CMSCategory;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Request interfaces
export interface CreateTypeRequest {
  name: string;
}

export interface UpdateTypeRequest extends Partial<CreateTypeRequest> {
  id: string;
}

export interface CreateCategoryRequest {
  name: string;
  typeId: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

export interface CreateItemRequest {
  name: string;
  description?: string | null;
  availableInRooms: RoomType[];
  pricePerSqFt: number;
  imageUrl?: string | null;
  categoryId: string;
}

export interface UpdateItemRequest extends Partial<CreateItemRequest> {
  id: string;
}

export interface GetItemsRequest {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  typeId?: string;
  availableInRooms?: RoomType[];
}

// API Response interfaces
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

export interface GetCategoriesResponse {
  success: boolean;
  data: CMSCategory[];
  message?: string;
}

export interface SingleCategoryResponse {
  success: boolean;
  data: CMSCategory;
  message?: string;
}

export interface GetTypesResponse {
  success: boolean;
  data: CMSType[];
  message?: string;
}

export interface SingleTypeResponse {
  success: boolean;
  data: CMSType;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

// User interfaces (keeping for future use)
export interface CMSUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'editor' | 'viewer';
  isActive?: boolean;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalItems: number;
  totalTypes: number;
  totalCategories: number;
  itemsByRoomType: {
    [key in RoomType]: number;
  };
  itemsByCategory: Array<{
    category: string;
    type: string;
    count: number;
  }>;
  itemsByType: Array<{
    type: string;
    count: number;
  }>;
  recentItems: CMSItem[];
}