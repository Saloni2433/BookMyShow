const express = require('express');
const multer = require('multer');
const path = require('path');
const Movie = require('../models/movie');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only JPEG, JPG & PNG images are allowed'));
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).render('error', {
                title: 'Error',
                message: 'File size too large. Maximum size is 1MB'
            });
        }
        return res.status(400).render('error', {
            title: 'Error',
            message: err.message
        });
    }
    next(err);
};

// Get all movies with categories
router.get('/', async (req, res, next) => {
    try {
        const [recommended, latest, upcoming, action, comedy, drama] = await Promise.all([
            Movie.find().sort({ rating: -1 }).limit(5),
            Movie.find().sort({ releaseDate: -1 }).limit(5),
            Movie.find({ releaseDate: { $gt: new Date() } }).sort({ releaseDate: 1 }).limit(5),
            Movie.find({ genre: 'Action' }).limit(5),
            Movie.find({ genre: 'Comedy' }).limit(5),
            Movie.find({ genre: 'Drama' }).limit(5)
        ]);

        const categories = {
            ...(recommended.length > 0 && { recommended }),
            ...(latest.length > 0 && { latest }),
            ...(upcoming.length > 0 && { upcoming }),
            ...(action.length > 0 && { action }),
            ...(comedy.length > 0 && { comedy }),
            ...(drama.length > 0 && { drama })
        };

        const movie = recommended.length > 0 ? recommended[0] : null;

        res.render('bookMYshow', {
            title: 'BookMyShow',
            description: 'Book movie tickets online',
            categories,
            movie
        });
    } catch (error) {
        next(error);
    }
});

// Get movie details
router.get('/:id', async (req, res, next) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).render('error', {
                title: 'Invalid ID',
                message: 'Invalid movie ID format'
            });
        }

        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).render('error', {
                title: 'Not Found',
                message: 'Movie not found'
            });
        }

        res.render('movieDetails', {
            title: movie.title,
            movie
        });
    } catch (error) {
        next(error);
    }
});

// Show add movie form
router.get('/admin/add', (req, res) => {
    res.render('addMovie', {
        title: 'Add New Movie',
        categories: [
            'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller',
            'Horror', 'Romance', 'Animation', 'Adventure', 'Fantasy',
            'Crime', 'Mystery', 'Biography', 'Documentary', 'Family'
        ]
    });
});

// Add new movie
router.post('/admin/movies/add', upload.single('image'), handleMulterError, async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).render('error', {
                title: 'Error',
                message: 'Please upload a movie poster'
            });
        }

        const requiredFields = ['title', 'description', 'releaseDate', 'duration', 'genre', 'language', 'rating', 'price'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).render('error', {
                title: 'Error',
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        if (!req.body.showTimes || !Array.isArray(req.body.showTimes) || req.body.showTimes.length === 0) {
            return res.status(400).render('error', {
                title: 'Error',
                message: 'Please add at least one show time'
            });
        }

        const showTimes = req.body.showTimes.map((time, index) => ({
            time,
            seats: parseInt(req.body.seats[index]) || 100
        }));

        const movie = new Movie({
            title: req.body.title,
            description: req.body.description,
            releaseDate: new Date(req.body.releaseDate),
            duration: req.body.duration + ' min',
            genre: req.body.genre,
            language: req.body.language,
            rating: parseFloat(req.body.rating),
            price: parseFloat(req.body.price),
            imageUrl: '/images/' + req.file.filename,
            showTimes
        });

        await movie.save();
        res.redirect('/');
    } catch (error) {
        next(error);
    }
});

// Book tickets
router.post('/:id/book', async (req, res, next) => {
    try {
        const { showTime, seats } = req.body;

        if (!showTime || !seats) {
            return res.status(400).json({ error: 'Show time and number of seats are required' });
        }

        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ error: 'Invalid movie ID format' });
        }

        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const seatsToBook = parseInt(seats);
        if (isNaN(seatsToBook) || seatsToBook <= 0) {
            return res.status(400).json({ error: 'Invalid number of seats' });
        }

        await movie.bookSeats(showTime, seatsToBook);

        res.json({
            success: true,
            message: 'Tickets booked successfully',
            remainingSeats: movie.showTimes.find(s => s.time === showTime).seats
        });
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error',
        message: err.message || 'Something went wrong!'
    });
});

module.exports = router; 