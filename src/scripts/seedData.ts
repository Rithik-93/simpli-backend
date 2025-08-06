import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Item from '../models/Item';
import Category from '../models/Category';
import User from '../models/User';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const seedCategories = async () => {
  const categories = [
    {
      name: 'Master Bedroom',
      type: 'furniture' as const,
      description: 'Furniture items for master bedroom',
      isActive: true
    },
    {
      name: 'Children Bedroom',
      type: 'furniture' as const,
      description: 'Furniture items for children bedroom',
      isActive: true
    },
    {
      name: 'Guest Bedroom',
      type: 'furniture' as const,
      description: 'Furniture items for guest bedroom',
      isActive: true
    },
    {
      name: 'Living Room',
      type: 'furniture' as const,
      description: 'Furniture items for living room',
      isActive: true
    },
    {
      name: 'Kitchen',
      type: 'furniture' as const,
      description: 'Modular kitchen items',
      isActive: true
    },
    {
      name: 'Pooja Room',
      type: 'furniture' as const,
      description: 'Furniture items for pooja room',
      isActive: true
    },
    {
      name: 'Services',
      type: 'singleLine' as const,
      description: 'Per square foot services',
      isActive: true
    },
    {
      name: 'Optional Services',
      type: 'service' as const,
      description: 'Optional services for home decoration',
      isActive: true
    }
  ];

  try {
    // Clear existing categories
    await Category.deleteMany({});
    
    // Insert new categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Created ${createdCategories.length} categories`);
    
    return createdCategories;
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
    throw error;
  }
};

const seedItems = async (categories: any[]) => {
  const items = [
    // Master Bedroom Items
    {
      name: 'Wardrobe',
      category: 'Master Bedroom',
      type: 'furniture' as const,
      basePrice: 45000,
      description: 'High-quality wardrobe with premium finish',
      isActive: true
    },
    {
      name: 'Study Table',
      category: 'Master Bedroom',
      type: 'furniture' as const,
      basePrice: 15000,
      description: 'Premium study table with storage',
      isActive: true
    },
    {
      name: 'TV Unit',
      category: 'Master Bedroom',
      type: 'furniture' as const,
      basePrice: 25000,
      description: 'Modern TV unit with storage',
      isActive: true
    },
    {
      name: 'Bed Unit with Back Panel',
      category: 'Master Bedroom',
      type: 'furniture' as const,
      basePrice: 35000,
      description: 'Premium bed unit with back panel',
      isActive: true
    },

    // Children Bedroom Items
    {
      name: 'Wardrobe',
      category: 'Children Bedroom',
      type: 'furniture' as const,
      basePrice: 35000,
      description: 'Colorful wardrobe for children',
      isActive: true
    },
    {
      name: 'Study Table',
      category: 'Children Bedroom',
      type: 'furniture' as const,
      basePrice: 12000,
      description: 'Study table with storage for children',
      isActive: true
    },
    {
      name: 'Bed Unit with Back Panel',
      category: 'Children Bedroom',
      type: 'furniture' as const,
      basePrice: 28000,
      description: 'Bed unit with back panel for children',
      isActive: true
    },

    // Guest Bedroom Items
    {
      name: 'Wardrobe',
      category: 'Guest Bedroom',
      type: 'furniture' as const,
      basePrice: 40000,
      description: 'Elegant wardrobe for guest bedroom',
      isActive: true
    },
    {
      name: 'Study Table',
      category: 'Guest Bedroom',
      type: 'furniture' as const,
      basePrice: 14000,
      description: 'Study table for guest bedroom',
      isActive: true
    },
    {
      name: 'Bed Unit with Back Panel',
      category: 'Guest Bedroom',
      type: 'furniture' as const,
      basePrice: 32000,
      description: 'Bed unit with back panel for guest bedroom',
      isActive: true
    },

    // Living Room Items
    {
      name: 'TV Drawer Unit',
      category: 'Living Room',
      type: 'furniture' as const,
      basePrice: 30000,
      description: 'TV drawer unit for living room',
      isActive: true
    },
    {
      name: 'TV Unit Paneling',
      category: 'Living Room',
      type: 'furniture' as const,
      basePrice: 20000,
      description: 'TV unit paneling for living room',
      isActive: true
    },

    // Kitchen Items
    {
      name: 'Base Unit - Parallel',
      category: 'Kitchen',
      type: 'furniture' as const,
      basePrice: 75000,
      description: 'Parallel base unit for kitchen',
      isActive: true
    },
    {
      name: 'Base Unit - L-Shaped',
      category: 'Kitchen',
      type: 'furniture' as const,
      basePrice: 85000,
      description: 'L-shaped base unit for kitchen',
      isActive: true
    },
    {
      name: 'Base Unit - Island',
      category: 'Kitchen',
      type: 'furniture' as const,
      basePrice: 95000,
      description: 'Island base unit for kitchen',
      isActive: true
    },
    {
      name: 'Tandem Baskets',
      category: 'Kitchen',
      type: 'furniture' as const,
      basePrice: 8000,
      description: 'Tandem baskets for kitchen storage',
      isActive: true
    },
    {
      name: 'Bottle Pullout',
      category: 'Kitchen',
      type: 'furniture' as const,
      basePrice: 6000,
      description: 'Bottle pullout for kitchen',
      isActive: true
    },
    {
      name: 'Corner Unit',
      category: 'Kitchen',
      type: 'furniture' as const,
      basePrice: 12000,
      description: 'Corner unit for kitchen',
      isActive: true
    },
    {
      name: 'Wicker Basket',
      category: 'Kitchen',
      type: 'furniture' as const,
      basePrice: 4000,
      description: 'Wicker basket for kitchen storage',
      isActive: true
    },

    // Pooja Room Items
    {
      name: 'Pooja Unit',
      category: 'Pooja Room',
      type: 'furniture' as const,
      basePrice: 25000,
      description: 'Traditional pooja unit',
      isActive: true
    },
    {
      name: 'Doors',
      category: 'Pooja Room',
      type: 'furniture' as const,
      basePrice: 15000,
      description: 'Doors for pooja room',
      isActive: true
    },

    // Services
    {
      name: 'False Ceiling',
      category: 'Services',
      type: 'singleLine' as const,
      basePrice: 120,
      description: 'False ceiling installation per sq ft',
      isActive: true
    },
    {
      name: 'Ceiling Painting',
      category: 'Services',
      type: 'singleLine' as const,
      basePrice: 25,
      description: 'Ceiling painting per sq ft',
      isActive: true
    },
    {
      name: 'Electrical & Wiring',
      category: 'Services',
      type: 'singleLine' as const,
      basePrice: 80,
      description: 'Electrical and wiring per sq ft',
      isActive: true
    },

    // Optional Services
    {
      name: 'Sofa',
      category: 'Optional Services',
      type: 'service' as const,
      basePrice: 50000,
      description: 'Premium quality sofa for your home',
      isActive: true
    },
    {
      name: 'Dining Table',
      category: 'Optional Services',
      type: 'service' as const,
      basePrice: 35000,
      description: 'Premium dining table for your home',
      isActive: true
    },
    {
      name: 'Carpets',
      category: 'Optional Services',
      type: 'service' as const,
      basePrice: 15000,
      description: 'Premium carpets for your home',
      isActive: true
    },
    {
      name: 'Designer Lights',
      category: 'Optional Services',
      type: 'service' as const,
      basePrice: 25000,
      description: 'Premium designer lights for your home',
      isActive: true
    },
    {
      name: 'Curtains',
      category: 'Optional Services',
      type: 'service' as const,
      basePrice: 20000,
      description: 'Premium curtains for your home',
      isActive: true
    }
  ];

  try {
    // Clear existing items
    await Item.deleteMany({});
    
    // Insert new items
    const createdItems = await Item.insertMany(items);
    console.log(`✅ Created ${createdItems.length} items`);
    
    return createdItems;
  } catch (error) {
    console.error('❌ Error seeding items:', error);
    throw error;
  }
};

const seedUsers = async () => {
  const users = [
    {
      username: 'admin',
      email: 'admin@interior-calculator.com',
      password: 'admin123',
      role: 'admin' as const,
      isActive: true
    },
    {
      username: 'editor',
      email: 'editor@interior-calculator.com',
      password: 'editor123',
      role: 'editor' as const,
      isActive: true
    }
  ];

  try {
    // Clear existing users
    await User.deleteMany({});
    
    // Insert new users
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    // Seed categories first
    const categories = await seedCategories();
    
    // Seed items
    const items = await seedItems(categories);
    
    // Seed users
    const users = await seedUsers();
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Items: ${items.length}`);
    console.log(`   - Users: ${users.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeding script
seedDatabase(); 