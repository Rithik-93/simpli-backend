import express from 'express';
import Item from '../models/Item';
import Category from '../models/Category';
import User from '../models/User';
import type { 
  CreateItemRequest, 
  UpdateItemRequest, 
  GetItemsRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateUserRequest,
  UpdateUserRequest,
  DashboardStats
} from '../types/cms';

const router = express.Router();

// ==================== ITEMS ROUTES ====================

// Get all items with pagination and filters
router.get('/items', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      type = '',
      isActive
    }: GetItemsRequest = req.query;

    const pageNum = typeof page === 'string' ? parseInt(page, 10) : Number(page) || 1;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (category) {
      query.category = category;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (isActive !== undefined) {
      // @ts-ignore
      query.isActive = isActive === 'true';
    }

    // Execute query
    const [items, total] = await Promise.all([
      Item.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Item.countDocuments(query)
    ]);

    // Transform _id to id for lean queries
    const transformedItems = items.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }));

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: transformedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items'
    });
  }
});

// Get single item by ID
router.get('/items/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).lean();
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    // Transform _id to id for lean queries
    const transformedItem = {
      ...item,
      id: item._id.toString(),
      _id: undefined
    };

    res.json({
      success: true,
      data: transformedItem
    });

  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item'
    });
  }
});

// Create new item
router.post('/items', async (req, res) => {
  try {
    const itemData: CreateItemRequest = req.body;
    
    const item = new Item(itemData);
    await item.save();

    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });

  } catch (error: any) {
    console.error('Error creating item:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create item'
    });
  }
});

// Update item
router.put('/items/:id', async (req, res) => {
  try {
    const updateData: UpdateItemRequest = req.body;
    
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating item:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update item'
    });
  }
});

// Delete item
router.delete('/items/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete item'
    });
  }
});

// ==================== CATEGORIES ROUTES ====================

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Create new category
router.post('/categories', async (req, res) => {
  try {
    const categoryData: CreateCategoryRequest = req.body;
    
    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });

  } catch (error: any) {
    console.error('Error creating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
});

// Update category
router.put('/categories/:id', async (req, res) => {
  try {
    const updateData: UpdateCategoryRequest = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating category:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
  try {
    // Check if category has items
    const itemCount = await Item.countDocuments({ category: req.params.id });
    
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It has ${itemCount} associated items.`
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

// ==================== USERS ROUTES ====================

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    
    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    const userData: CreateUserRequest = req.body;
    
    const user = new User(userData);
    await user.save();

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const updateData: UpdateUserRequest = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Username or email already exists'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map((err: any) => err.message).join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// ==================== DASHBOARD ROUTES ====================

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalItems,
      activeItems,
      totalCategories,
      activeCategories,
      totalUsers,
      activeUsers,
      itemsByType,
      itemsByCategory,
      recentItems
    ] = await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ isActive: true }),
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Item.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Item.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Item.find().sort({ createdAt: -1 }).limit(5).lean()
    ]);

    // Transform itemsByType to expected format
    const itemsByTypeFormatted = {
      furniture: 0,
      singleLine: 0,
      service: 0
    };
    
    itemsByType.forEach((item: any) => {
      itemsByTypeFormatted[item._id as keyof typeof itemsByTypeFormatted] = item.count;
    });

    // Transform itemsByCategory to expected format
    const itemsByCategoryFormatted = itemsByCategory.map((item: any) => ({
      category: item._id,
      count: item.count
    }));

    // Transform recent items _id to id
    const transformedRecentItems = recentItems.map(item => ({
      ...item,
      id: item._id.toString(),
      _id: undefined
    }));

    const stats: DashboardStats = {
      totalItems,
      activeItems,
      totalCategories,
      activeCategories,
      totalUsers,
      activeUsers,
      itemsByType: itemsByTypeFormatted,
      itemsByCategory: itemsByCategoryFormatted,
      recentItems: transformedRecentItems
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

export default router; 