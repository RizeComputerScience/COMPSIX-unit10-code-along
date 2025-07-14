# Unit 10 Code Along: Blog JWT Authentication and Role Based Authorization

A simple blog API demonstrating the conversion from session-based to JWT authentication, followed by implementing role-based access control.

## Setup Instructions

1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. The database will be created automatically with sample users

## Sample Users
- **Reader**: reader@example.com / password123
- **Author**: author@example.com / password123  
- **Editor**: editor@example.com / password123

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### Posts
- `GET /api/posts` - Get all published posts
- `GET /api/dashboard` - Get user's dashboard (protected)
- `POST /api/posts` - Create new post (protected)
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)

## Tutorial Progression

### Part 1: Session to JWT Conversion
This system currently uses **session-based authentication**. The first tutorial shows how to convert it to **JWT authentication**.

### Part 2: Role-Based Access Control
After JWT conversion, the second tutorial adds **role-based authorization** with three user roles:

**Reader Role:**
- View published posts
- View own dashboard

**Author Role:**
- All Reader permissions
- Create new posts
- Edit and delete own posts

**Editor Role:**
- All Author permissions
- Edit and delete any user's posts
- Publish/unpublish posts

## Current Status
- ✅ Session-based authentication working
- ❌ JWT authentication (Resource #2)
- ❌ Role-based authorization (Resource #3)