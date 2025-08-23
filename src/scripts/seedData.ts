import dotenv from 'dotenv';
import prisma from '../config/database';
import type { RoomType } from '../types/cms';

// Load environment variables
dotenv.config();

/**
 * Updated Seed Data Structure (2024)
 * 
 * The new structure organizes items by:
 * 1. Type: "Woodwork" or "Single Line Items"
 * 2. Category under each type:
 *    - Woodwork: Master Bedroom, Children Bedroom, Guest Bedroom, Living Room, Kitchen, Pooja Room
 *    - Single Line Items: False Ceiling, Ceiling, Painting
 * 
 * This provides a cleaner hierarchical structure where all existing furniture
 * and modular items fall under Woodwork categories, while service-based items
 * fall under Single Line Items categories.
 */

const seedTypes = async () => {
  const types = [
    { name: 'Woodwork' },
    { name: 'Single Line Items' }
  ];

  try {
    // Clear existing data
    await prisma.item.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.type.deleteMany({});
    
    const createdTypes = await prisma.type.createMany({
      data: types
    });
    
    console.log(`✅ Created ${createdTypes.count} types`);
    
    // Fetch created types for returning
    const fetchedTypes = await prisma.type.findMany();
    return fetchedTypes;
  } catch (error) {
    console.error('❌ Error seeding types:', error);
    throw error;
  }
};

const seedCategories = async (types: any[]) => {
  const woodworkTypeId = types.find(t => t.name === 'Woodwork')?.id;
  const singleLineTypeId = types.find(t => t.name === 'Single Line Items')?.id;

  const categories = [
    // Woodwork Categories
    { name: 'Master Bedroom', typeId: woodworkTypeId },
    { name: 'Children Bedroom', typeId: woodworkTypeId },
    { name: 'Guest Bedroom', typeId: woodworkTypeId },
    { name: 'Living Room', typeId: woodworkTypeId },
    { name: 'Kitchen', typeId: woodworkTypeId },
    { name: 'Pooja Room', typeId: woodworkTypeId },
    
    // Single Line Items Categories
    { name: 'False Ceiling', typeId: singleLineTypeId },
    { name: 'Ceiling', typeId: singleLineTypeId },
    { name: 'Painting', typeId: singleLineTypeId }
  ].filter(category => category.typeId); // Remove any with undefined typeId

  try {
    const createdCategories = await prisma.category.createMany({
      data: categories
    });
    
    console.log(`✅ Created ${createdCategories.count} categories`);
    
    // Fetch created categories for returning
    const fetchedCategories = await prisma.category.findMany({
      include: { type: true }
    });
    return fetchedCategories;
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

const seedItems = async (categories: any[]) => {
  const items = [
    // Master Bedroom Items (Woodwork)
    {
      name: 'Wardrobe',
      description: 'High-quality wardrobe with premium finish and ample storage',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 450,
      categoryId: categories.find(c => c.name === 'Master Bedroom' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Study Table',
      description: 'Premium study table with storage compartments',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 300,
      categoryId: categories.find(c => c.name === 'Master Bedroom' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'TV Unit',
      description: 'Modern TV unit with storage and cable management',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 400,
      categoryId: categories.find(c => c.name === 'Master Bedroom' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Bed Unit with Back Panel',
      description: 'Premium bed unit with upholstered back panel',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 500,
      categoryId: categories.find(c => c.name === 'Master Bedroom' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Side Tables',
      description: 'Elegant side tables for bedside storage',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 250,
      categoryId: categories.find(c => c.name === 'Master Bedroom' && c.type.name === 'Woodwork')?.id
    },

    // Children Bedroom Items (Woodwork)
    {
      name: 'Wardrobe',
      description: 'Colorful and durable wardrobe designed for children',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 400,
      categoryId: categories.find(c => c.name === 'Children Bedroom' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Study Table',
      description: 'Ergonomic study table with storage for children',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 250,
      categoryId: categories.find(c => c.name === 'Children Bedroom' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Bed Unit with Back Panel',
      description: 'Comfortable bed unit with colorful back panel for children',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 450,
      categoryId: categories.find(c => c.name === 'Children Bedroom' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Toy Storage Unit',
      description: 'Organized toy storage with multiple compartments',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 180,
      categoryId: categories.find(c => c.name === 'Children Bedroom' && c.type.name === 'Woodwork')?.id
    },

    // Guest Bedroom Items (Woodwork)
    {
      name: 'Wardrobe',
      description: 'Elegant wardrobe with premium finish for guest bedroom',
      availableInRooms: ['BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 420,
      categoryId: categories.find(c => c.name === 'Guest Bedroom' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Study Table',
      description: 'Versatile study table for guest bedroom',
      availableInRooms: ['BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 280,
      categoryId: categories.find(c => c.name === 'Guest Bedroom' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Bed Unit with Back Panel',
      description: 'Comfortable bed unit with elegant back panel for guests',
      availableInRooms: ['BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 480,
      categoryId: categories.find(c => c.name === 'Guest Bedroom' && c.type.name === 'Woodwork')?.id
    },

    // Living Room Items (Woodwork)
    {
      name: 'Sofa Set',
      description: 'Premium 3-seater sofa with matching chairs',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 800,
      categoryId: categories.find(c => c.name === 'Living Room' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Coffee Table',
      description: 'Modern coffee table with storage',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 350,
      categoryId: categories.find(c => c.name === 'Living Room' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'TV Drawer Unit',
      description: 'TV drawer unit with ample storage for living room',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 600,
      categoryId: categories.find(c => c.name === 'Living Room' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'TV Unit Paneling',
      description: 'TV unit paneling for living room walls',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 350,
      categoryId: categories.find(c => c.name === 'Living Room' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Display Unit',
      description: 'Elegant display unit for showcasing items',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 450,
      categoryId: categories.find(c => c.name === 'Living Room' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Bookshelf',
      description: 'Modern bookshelf with adjustable shelves',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 320,
      categoryId: categories.find(c => c.name === 'Living Room' && c.type.name === 'Woodwork')?.id
    },

    // Kitchen Items (Woodwork)
    {
      name: 'Base Unit - Parallel',
      description: 'Parallel base unit for efficient kitchen layout',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 1200,
      categoryId: categories.find(c => c.name === 'Kitchen' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Base Unit - L-Shaped',
      description: 'L-shaped base unit for corner kitchen spaces',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 1400,
      categoryId: categories.find(c => c.name === 'Kitchen' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Base Unit - Island',
      description: 'Island base unit for spacious kitchens',
      availableInRooms: ['BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 1600,
      categoryId: categories.find(c => c.name === 'Kitchen' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Wall Unit',
      description: 'Wall-mounted storage units for kitchen',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 900,
      categoryId: categories.find(c => c.name === 'Kitchen' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Tandem Baskets',
      description: 'Tandem baskets for efficient kitchen storage',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 150,
      categoryId: categories.find(c => c.name === 'Kitchen' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Bottle Pullout',
      description: 'Bottle pullout for organized kitchen storage',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 120,
      categoryId: categories.find(c => c.name === 'Kitchen' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Corner Unit',
      description: 'Corner unit for maximizing kitchen space',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 200,
      categoryId: categories.find(c => c.name === 'Kitchen' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Wicker Basket',
      description: 'Wicker basket for stylish kitchen storage',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 80,
      categoryId: categories.find(c => c.name === 'Kitchen' && c.type.name === 'Woodwork')?.id
    },

    // Pooja Room Items (Woodwork)
    {
      name: 'Pooja Unit',
      description: 'Traditional pooja unit with storage',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 800,
      categoryId: categories.find(c => c.name === 'Pooja Room' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Doors',
      description: 'Elegant doors for pooja room',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 300,
      categoryId: categories.find(c => c.name === 'Pooja Room' && c.type.name === 'Woodwork')?.id
    },
    {
      name: 'Storage Cabinet',
      description: 'Storage cabinet for pooja room essentials',
      availableInRooms: ['BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 450,
      categoryId: categories.find(c => c.name === 'Pooja Room' && c.type.name === 'Woodwork')?.id
    },

    // Single Line Items - False Ceiling
    {
      name: 'Gypsum False Ceiling',
      description: 'Premium gypsum false ceiling with smooth finish',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 85,
      categoryId: categories.find(c => c.name === 'False Ceiling' && c.type.name === 'Single Line Items')?.id
    },
    {
      name: 'Pop False Ceiling',
      description: 'Plaster of Paris false ceiling with decorative designs',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 95,
      categoryId: categories.find(c => c.name === 'False Ceiling' && c.type.name === 'Single Line Items')?.id
    },

    // Single Line Items - Ceiling
    {
      name: 'Cement Ceiling',
      description: 'Standard cement ceiling finish',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 45,
      categoryId: categories.find(c => c.name === 'Ceiling' && c.type.name === 'Single Line Items')?.id
    },
    {
      name: 'Textured Ceiling',
      description: 'Textured ceiling finish with decorative patterns',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 65,
      categoryId: categories.find(c => c.name === 'Ceiling' && c.type.name === 'Single Line Items')?.id
    },

    // Single Line Items - Painting
    {
      name: 'Interior Wall Painting',
      description: 'Premium interior wall painting with quality paint',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 25,
      categoryId: categories.find(c => c.name === 'Painting' && c.type.name === 'Single Line Items')?.id
    },
    {
      name: 'Exterior Wall Painting',
      description: 'Weather-resistant exterior wall painting',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 35,
      categoryId: categories.find(c => c.name === 'Painting' && c.type.name === 'Single Line Items')?.id
    },
    {
      name: 'Texture Painting',
      description: 'Decorative texture painting for walls',
      availableInRooms: ['BHK_1', 'BHK_2', 'BHK_3', 'BHK_4'] as RoomType[],
      pricePerSqFt: 45,
      categoryId: categories.find(c => c.name === 'Painting' && c.type.name === 'Single Line Items')?.id
    }
  ].filter(item => item.categoryId); // Remove any with undefined categoryId

  try {
    // Insert new items
    const createdItems = await prisma.item.createMany({
      data: items
    });
    
    console.log(`✅ Created ${createdItems.count} items`);
    
    return createdItems;
  } catch (error) {
    console.error('❌ Error seeding items:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ PostgreSQL Connected for seeding');
    
    // Seed types first
    const types = await seedTypes();
    
    // Seed categories
    const categories = await seedCategories(types);
    
    // Seed items
    const items = await seedItems(categories);
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Types: ${types.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Items: ${items.count}`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Run the seeding script
seedDatabase();