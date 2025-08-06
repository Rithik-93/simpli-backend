# CMS Setup Guide

This guide will help you set up the CMS (Content Management System) with MongoDB integration for the Interior Calculator application.

## Prerequisites

1. Node.js (v16 or higher)
2. MongoDB (local or MongoDB Atlas)
3. npm or yarn package manager

## Backend Setup

### 1. Install Dependencies

```bash
cd simpligyBackend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `simpligyBackend` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/interior-calculator
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/interior-calculator

# WhatsApp API Configuration (if using whapi.cloud)
WHATSAPP_API_KEY=your_whatsapp_api_key_here
WHATSAPP_INSTANCE_ID=your_instance_id_here

# JWT Secret (for future authentication)
JWT_SECRET=your_jwt_secret_here
```

### 3. MongoDB Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Create database: `interior-calculator`

#### Option B: MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Replace `MONGODB_URI` in your `.env` file

### 4. Start the Backend Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

The server will start on `http://localhost:3000`

## Frontend Setup

### 1. Environment Configuration

Create a `.env` file in the `interior-calculator` directory:

```env
VITE_API_URL=http://localhost:3000/api
```

### 2. Start the Frontend

```bash
cd interior-calculator
npm run dev
```

The frontend will start on `http://localhost:5173`

## CMS Features

### Available Endpoints

#### Items Management
- `GET /api/cms/items` - Get all items with pagination and filters
- `GET /api/cms/items/:id` - Get single item
- `POST /api/cms/items` - Create new item
- `PUT /api/cms/items/:id` - Update item
- `DELETE /api/cms/items/:id` - Delete item

#### Categories Management
- `GET /api/cms/categories` - Get all categories
- `POST /api/cms/categories` - Create new category
- `PUT /api/cms/categories/:id` - Update category
- `DELETE /api/cms/categories/:id` - Delete category

#### Users Management
- `GET /api/cms/users` - Get all users
- `POST /api/cms/users` - Create new user
- `PUT /api/cms/users/:id` - Update user
- `DELETE /api/cms/users/:id` - Delete user

#### Dashboard
- `GET /api/cms/dashboard/stats` - Get dashboard statistics

### Database Collections

The CMS creates the following MongoDB collections:

1. **items** - Stores product and service items
2. **categories** - Stores item categories
3. **users** - Stores CMS users (for future authentication)

### Item Types

Items can be of three types:
- `furniture` - Furniture items (wardrobes, beds, etc.)
- `singleLine` - Per square foot services (false ceiling, painting, etc.)
- `service` - Additional services (sofa, dining table, etc.)

### Categories

Default categories include:
- Master Bedroom
- Children Bedroom
- Guest Bedroom
- Living Room
- Kitchen
- Pooja Room
- Services

## Usage

1. Navigate to `http://localhost:5173/cms`
2. Use the CMS interface to:
   - Add, edit, and delete items
   - Manage categories
   - View dashboard statistics
   - Manage users

## API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": [...],
  "message": "Optional message",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Error Handling

The API includes comprehensive error handling:
- Validation errors for required fields
- Duplicate item/category prevention
- Database connection error handling
- Proper HTTP status codes

## Security Features

- CORS configuration for frontend access
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- MongoDB injection prevention through Mongoose

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your `MONGODB_URI` in `.env`
   - Ensure MongoDB is running
   - Verify network connectivity for Atlas

2. **CORS Errors**
   - Check `FRONTEND_URL` in backend `.env`
   - Ensure frontend is running on the correct port

3. **API Not Found**
   - Verify backend server is running
   - Check API endpoint URLs
   - Ensure proper HTTP methods

### Logs

Check the console output for detailed error messages and debugging information.

## Next Steps

1. Implement user authentication
2. Add image upload functionality
3. Implement bulk operations
4. Add audit logging
5. Set up automated backups 