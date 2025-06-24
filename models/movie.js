const mongoose = require('mongoose');

const showTimeSchema = new mongoose.Schema({
    time: {
        type: String,
        required: true,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in 24-hour format (HH:MM)']
    },
    seats: {
        type: Number,
        required: true,
        min: [0, 'Seats cannot be negative'],
        max: [100, 'Maximum seats cannot exceed 100'],
        default: 100
    }
});

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Movie title is required'],
        trim: true,
        minlength: [2, 'Title must be at least 2 characters long'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Movie description is required'],
        minlength: [10, 'Description must be at least 10 characters long'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    releaseDate: {
        type: Date,
        required: [true, 'Release date is required'],
        validate: {
            validator: (v) => v instanceof Date && !isNaN(v),
            message: 'Invalid release date'
        }
    },
    duration: {
        type: String,
        required: [true, 'Duration is required'],
        match: [/^\d+\s*min$/, 'Duration must be in format: "X min"']
    },
    genre: {
        type: String,
        required: [true, 'Genre is required'],
        enum: {
            values: [
                'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller',
                'Horror', 'Romance', 'Animation', 'Adventure', 'Fantasy',
                'Crime', 'Mystery', 'Biography', 'Documentary', 'Family'
            ],
            message: '{VALUE} is not a valid genre'
        }
    },
    language: {
        type: String,
        required: [true, 'Language is required'],
        trim: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [0, 'Rating cannot be less than 0'],
        max: [10, 'Rating cannot be more than 10'],
        default: 0
    },
    imageUrl: {
        type: String,
        required: [true, 'Movie poster image is required'],
        match: [/^\/images\/.+/, 'Image URL must start with /images/']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        default: 0
    },
    showTimes: [showTimeSchema]
}, {
    timestamps: true
});

// Add indexes for better query performance
movieSchema.index({ title: 1, releaseDate: -1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ rating: -1 });

// Add virtual for checking if movie is upcoming
movieSchema.virtual('isUpcoming').get(function () {
    return this.releaseDate > new Date();
});

// Add method to check seat availability
movieSchema.methods.checkSeatAvailability = function (showTime, requestedSeats) {
    const show = this.showTimes.find(s => s.time === showTime);
    if (!show) return false;
    return show.seats >= requestedSeats;
};

// Add method to book seats
movieSchema.methods.bookSeats = async function (showTime, seats) {
    const show = this.showTimes.find(s => s.time === showTime);
    if (!show || show.seats < seats) {
        throw new Error('Not enough seats available');
    }
    show.seats -= seats;
    return this.save();
};

module.exports = mongoose.model('Movie', movieSchema); 