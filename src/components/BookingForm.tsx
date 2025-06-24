import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBooking } from '../contexts/BookingContext';
import { Movie } from '../types/movie';
import { Show } from '../types/show';
import { Seat } from '../types/seat';
import { formatCurrency } from '../utils/format';

interface BookingFormProps {
    movie: Movie;
    show: Show;
    selectedSeats: Seat[];
    onSeatSelect: (seat: Seat) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({
    movie,
    show,
    selectedSeats,
    onSeatSelect,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createBooking } = useBooking();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalAmount = useMemo(() => {
        return selectedSeats.reduce((total, seat) => total + seat.price, 0);
    }, [selectedSeats]);

    const handleBooking = useCallback(async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (selectedSeats.length === 0) {
            setError('Please select at least one seat');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const booking = await createBooking({
                movieId: movie.id,
                showId: show.id,
                seatIds: selectedSeats.map(seat => seat.id),
                totalAmount,
                userId: user.id,
            });

            navigate(`/booking-confirmation/${booking.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create booking');
        } finally {
            setIsLoading(false);
        }
    }, [user, selectedSeats, movie.id, show.id, totalAmount, createBooking, navigate]);

    const handleSeatClick = useCallback((seat: Seat) => {
        if (seat.isBooked) return;
        onSeatSelect(seat);
    }, [onSeatSelect]);

    const renderSeatGrid = useCallback(() => {
        const rows = Math.ceil(show.seats.length / 10);
        const seatGrid = [];

        for (let i = 0; i < rows; i++) {
            const rowSeats = show.seats.slice(i * 10, (i + 1) * 10);
            const row = (
                <div key={i} className="flex justify-center gap-2 mb-2">
                    {rowSeats.map((seat) => (
                        <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            disabled={seat.isBooked}
                            className={`w-8 h-8 rounded ${seat.isBooked
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : selectedSeats.some((s) => s.id === seat.id)
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                        >
                            {seat.seatNumber}
                        </button>
                    ))}
                </div>
            );
            seatGrid.push(row);
        }

        return seatGrid;
    }, [show.seats, selectedSeats, handleSeatClick]);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Book Tickets</h2>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Select Seats</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                    {renderSeatGrid()}
                </div>
                <div className="mt-4 flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-300 rounded"></div>
                        <span>Booked</span>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Selected Seats</h3>
                {selectedSeats.length > 0 ? (
                    <div className="space-y-2">
                        {selectedSeats.map((seat) => (
                            <div key={seat.id} className="flex justify-between items-center">
                                <span>Seat {seat.seatNumber}</span>
                                <span>{formatCurrency(seat.price)}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No seats selected</p>
                )}
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Total Amount</h3>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <button
                onClick={handleBooking}
                disabled={isLoading || selectedSeats.length === 0}
                className={`w-full py-3 rounded-lg text-white font-semibold ${isLoading || selectedSeats.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
            >
                {isLoading ? 'Processing...' : 'Proceed to Payment'}
            </button>
        </div>
    );
};

export default BookingForm; 