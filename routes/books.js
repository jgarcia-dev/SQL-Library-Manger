var express = require('express');
const createHttpError = require('http-errors');
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

// Post books/new
// Posts a new book to the database
router.post('/', asyncHandler( async (req, res, next) => {
    let book;
    try {
        book = await Book.create(req.body);
        res.redirect('/');
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            book = await Book.build(req.body);
            res.render('books/new-book', { book, errors: error.errors, title: "New Book" });
        } else {
            next(error);
        }
    }
}));

// Get books/:id
// Shows book details form
router.get('/:id', asyncHandler( async (req, res, next) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
        res.render('books/update-book', { book, title: "Update Book" });
    } else {
        next(createHttpError(404));
    }
}));

// Post books/:id
// Updates book info in database
router.post('/:id', asyncHandler( async (req, res, next) => {
    let book;
    try {
        book = await Book.findByPk(req.params.id);
        if (book) {
            await book.update(req.body);
            res.redirect('/');
        } else {
            next(createHttpError(404));
        }
    } catch (error) {
        if (error.name === "SequelizeValidationError") {
            book = await Book.build(req.body);
            book.id = req.params.id;
            res.render('books/update-book', { book, errors: error.errors, title: "New Book" });
        } else {
            throw error;
        }
    }
}));

// Post books/:id/delete
// Deletes a book
router.post('/:id/delete', async (req, res, next) => {
    const book = await Book.findByPk(req.params.id);
    if (book) {
        await book.destroy();
        res.redirect('/');
    } else {
        next(createHttpError(500));
    }
});

module.exports = router;