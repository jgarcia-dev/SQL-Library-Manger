var express = require('express');
var router = express.Router();
const Book = require('../models').Book;

// Async handler function that wraps each route
function asyncHandler(callBack) {
    return async (req, res, next) => {
        try {
            await callBack(req, res, next);
        } catch (error) {
            next(error);
        }
    }
};



/** ROUTES **/

// Get books
// Gets the full list of books
router.get('/', asyncHandler( async (req, res) => {
    // Get books data
    const attributes = ['id', 'title', 'author', 'genre', 'year'];
    const books = await Book.findAll( { attributes: attributes, order: [['createdAt', 'DESC']] });

    // Set up table column names
    const columnNames = attributes
        .filter( attribute => !(attribute === 'id') )
        .map( attribute => attribute.charAt(0).toUpperCase() + attribute.slice(1));
    
    res.render('books/books', { columnNames, books, title: 'Books' });
}));

// Get books/new
// The create new book form
router.get('/new', asyncHandler( async (req, res) => {
    res.render('books/new-book', { book: {}, title: 'New Book' });
}));

module.exports = router;