import express from 'express';
import prisma from '../config/database';
import type { 
  CreateItemRequest, 
  UpdateItemRequest, 
  GetItemsRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateTypeRequest,
  UpdateTypeRequest,
  DashboardStats,
  RoomType
} from '../types/cms';

const router = express.Router();

// ==================== TYPES ROUTES ====================

// Get all types with their categories
router.get('/types', async (req, res) => {
  try {
    const types = await prisma.type.findMany({
      include: {
        categories: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: types
    });

  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch types'
    });
  }
});

// Get single type by ID
router.get('/types/:id', async (req, res) => {
  try {
    const type = await prisma.type.findUnique({
      where: { id: req.params.id },
      include: {
        categories: {
          include: {
            _count: {
              select: { items: true }
            }
          }
        }
      }
    });

    if (!type) {
      return res.status(404).json({
        success: false,
        error: 'Type not found'
      });
    }

    res.json({
      success: true,
      data: type
    });

  } catch (error) {
    console.error('Error fetching type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch type'
    });
  }
});

// Create new type
router.post('/types', async (req, res) => {
  try {
    const typeData: CreateTypeRequest = req.body;
    
    const type = await prisma.type.create({
      data: typeData,
      include: {
        categories: true
      }
    });

    res.status(201).json({
      success: true,
      data: type,
      message: 'Type created successfully'
    });

  } catch (error: any) {
    console.error('Error creating type:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Type name already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create type'
    });
  }
});

// Update type
router.put('/types/:id', async (req, res) => {
  try {
    const updateData: UpdateTypeRequest = req.body;
    const { id, ...data } = updateData;
    
    const type = await prisma.type.update({
      where: { id: req.params.id },
      data,
      include: {
        categories: true
      }
    });

    res.json({
      success: true,
      data: type,
      message: 'Type updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating type:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Type name already exists'
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Type not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update type'
    });
  }
});

// Delete type
router.delete('/types/:id', async (req, res) => {
  try {
    // Check if type has categories
    const categoryCount = await prisma.category.count({
      where: { typeId: req.params.id }
    });
    
    if (categoryCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete type. It has ${categoryCount} associated categories.`
      });
    }

    await prisma.type.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Type deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting type:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Type not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete type'
    });
  }
});

// ==================== CATEGORIES ROUTES ====================

// Get all categories with their types
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        type: true,
        _count: {
          select: { items: true }
        }
      },
      orderBy: { name: 'asc' }
    });

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

// Get single category by ID
router.get('/categories/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        type: true,
        _count: {
          select: { items: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
});

// Create new category
router.post('/categories', async (req, res) => {
  try {
    const categoryData: CreateCategoryRequest = req.body;
    
    const category = await prisma.category.create({
      data: categoryData,
      include: {
        type: true
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });

  } catch (error: any) {
    console.error('Error creating category:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Type not found'
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
    const { id, ...data } = updateData;
    
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
      include: {
        type: true
      }
    });

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating category:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Category name already exists'
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
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
    const itemCount = await prisma.item.count({
      where: { categoryId: req.params.id }
    });
    
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. It has ${itemCount} associated items.`
      });
    }

    await prisma.category.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting category:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
});

// ==================== ITEMS ROUTES ====================

// Get all items with pagination and filters
router.get('/items', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      categoryId = '',
      typeId = '',
      availableInRooms
    }: GetItemsRequest = req.query;

    const pageNum = typeof page === 'string' ? parseInt(page, 10) : Number(page) || 1;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (categoryId) {
      where.categoryId = categoryId as string;
    }
    
    if (typeId) {
      where.category = {
        typeId: typeId as string
      };
    }
    
    if (availableInRooms) {
      const roomTypes = Array.isArray(availableInRooms) ? availableInRooms : [availableInRooms];
      where.availableInRooms = {
        hasSome: roomTypes as RoomType[]
      };
    }

    // Execute query
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: {
            include: {
              type: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.item.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: items,
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
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        category: {
          include: {
            type: true
          }
        }
      }
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
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
    
    const item = await prisma.item.create({
      data: itemData,
      include: {
        category: {
          include: {
            type: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });

  } catch (error: any) {
    console.error('Error creating item:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Category not found'
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
    const { id, ...data } = updateData;
    
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data,
      include: {
        category: {
          include: {
            type: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating item:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Category not found'
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
    await prisma.item.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting item:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete item'
    });
  }
});

// ==================== DASHBOARD ROUTES ====================

// Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalItems,
      totalTypes,
      totalCategories,
      itemsByRoomType,
      itemsByCategory,
      itemsByType,
      recentItems
    ] = await Promise.all([
      prisma.item.count(),
      prisma.type.count(),
      prisma.category.count(),
      // Count items by room type
      prisma.item.groupBy({
        by: ['availableInRooms'],
        _count: true
      }),
      // Count items by category
      prisma.item.groupBy({
        by: ['categoryId'],
        _count: true,
        orderBy: { _count: { categoryId: 'desc' } },
        take: 10
      }).then(async (results) => {
        // Get category names for the results
        const categoryIds = results.map(r => r.categoryId);
        const categories = await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          include: { type: true }
        });
        
        return results.map(result => {
          const category = categories.find(c => c.id === result.categoryId);
          return {
            category: category?.name || 'Unknown',
            type: category?.type?.name || 'Unknown',
            count: result._count
          };
        });
      }),
      // Count items by type
      prisma.item.groupBy({
        by: ['categoryId'],
        _count: true,
        orderBy: { _count: { categoryId: 'desc' } },
        take: 10
      }).then(async (results) => {
        // Get type names for the results
        const categoryIds = results.map(r => r.categoryId);
        const categories = await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          include: { type: true }
        });
        
        return results.map(result => {
          const category = categories.find(c => c.id === result.categoryId);
          return {
            type: category?.type?.name || 'Unknown',
            count: result._count
          };
        });
      }),
      prisma.item.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            include: {
              type: true
            }
          }
        }
      })
    ]);

    // Process room type counts
    const roomTypeCounts: { [key in RoomType]: number } = {
      BHK_1: 0,
      BHK_2: 0,
      BHK_3: 0,
      BHK_4: 0
    };

    itemsByRoomType.forEach((item: any) => {
      item.availableInRooms.forEach((roomType: RoomType) => {
        roomTypeCounts[roomType] += item._count;
      });
    });

    const stats: DashboardStats = {
      totalItems,
      totalTypes,
      totalCategories,
      itemsByRoomType: roomTypeCounts,
      itemsByCategory,
      itemsByType,
      recentItems
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