const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { db, User, Post } = require('./database/setup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Session middleware (TODO: Replace with JWT)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Session-based authentication middleware (TODO: Replace with JWT)
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        req.user = {
            id: req.session.userId,
            username: req.session.username,
            email: req.session.email
        };
        next();
    } else {
        res.status(401).json({ error: 'Please log in' });
    }
}

// Test database connection
async function testConnection() {
    try {
        await db.authenticate();
        console.log('Connection to database established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

// AUTHENTICATION ROUTES

// POST /api/register - Register new user
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });
        
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
        
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// POST /api/login - User login (TODO: Replace with JWT)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Create session (TODO: Replace with JWT)
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.email = user.email;
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// POST /api/logout - User logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// PROTECTED ROUTES

// GET /api/dashboard - Get user's dashboard
app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const posts = await Post.findAll({ 
            where: { authorId: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        
        res.json({ 
            user: req.user, 
            posts: posts,
            totalPosts: posts.length
        });
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

// GET /api/posts - Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.findAll({
            where: { published: true },
            include: [
                {
                    model: User,
                    as: 'author',
                    attributes: ['id', 'username']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// POST /api/posts - Create new post
app.post('/api/posts', requireAuth, async (req, res) => {
    try {
        const { title, content, published = false } = req.body;
        
        const newPost = await Post.create({
            title,
            content,
            published,
            authorId: req.user.id
        });
        
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// PUT /api/posts/:id - Update post
app.put('/api/posts/:id', requireAuth, async (req, res) => {
    try {
        const { title, content, published } = req.body;
        
        const post = await Post.findByPk(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Check if user owns the post
        if (post.authorId !== req.user.id) {
            return res.status(403).json({ error: 'You can only edit your own posts' });
        }
        
        await post.update({ title, content, published });
        res.json(post);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// DELETE /api/posts/:id - Delete post
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        // Check if user owns the post
        if (post.authorId !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own posts' });
        }
        
        await post.destroy();
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// GET /api/users - Get all users (Editor only)
app.get('/api/users', requireAuth, requireEditor, async (req, res) => {
   try {
       const users = await User.findAll({
           attributes: ['id', 'username', 'email', 'role', 'createdAt']
       });
       
       res.json(users);
   } catch (error) {
       console.error('Error fetching users:', error);
       res.status(500).json({ error: 'Failed to fetch users' });
   }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
    console.log('Sample users:');
    console.log('- reader@example.com / password123');
    console.log('- author@example.com / password123');
    console.log('- editor@example.com / password123');
});