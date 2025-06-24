const express = require('express');
const path = require('path');
const connectDB = require('./config/database');
const movieRoutes = require('./routes/movies');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
connectDB();

// Routes
app.use('/', movieRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).render('error', {
        title: 'Error',
        message: err.message || 'Something went wrong!'
    });
});

// Start server
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
