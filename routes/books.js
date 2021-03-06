const e = require('express');
var express = require('express');
const createHttpError = require('http-errors');
var router = express.Router();
const Book = require('../models').Book;
const { Op } = require('sequelize');

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
router.post('/new', asyncHandler( async (req, res, next) => {
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

// Get books/page
// Gets full list of books using pagination
router.get('/page/:page', asyncHandler( async (req, res, next) => {
    const attributes = ['id', 'title', 'author', 'genre', 'year'];
    const columnNames = ['Title', 'Author', 'Genre', 'Year'];
    const page = req.params.page;
    
    // test that page is valid number
    if ( !Number.isNaN(page) && page > 0 ) {
        // valid page number

        const resultsPerPage = 5;
        const books = await Book.findAndCountAll({
            limit: resultsPerPage,
            offset: (page - 1) * resultsPerPage,
            attributes: attributes,
            order: [['createdAt', 'DESC']]
        });

        if (books.rows.length > 0) {
            // books found
            const pagesFound = Math.ceil(books.count / resultsPerPage);
            res.render('books/books-page', { title: "Books", location: `Page ${page}`, columnNames, books, pagesFound });
        } else {
            // no books found
            next(createHttpError(404));
        }
    } else {
        // not valid page number
        next(createHttpError(404));
    }
}));

// Get books/results/:page
// Get paginated books based on search query
router.get('/results/:page', asyncHandler( async(req, res) => {
    const attributes = ['id', 'title', 'author', 'genre', 'year'];
    const columnNames = ['Title', 'Author', 'Genre', 'Year'];
    const page = req.params.page;
    const searchQuery = req.query.search.trim();
    const resultsPerPage = 5;
    let books;
    let pagesFound;

    if (searchQuery) {
        books = await Book.findAndCountAll({
            attributes: attributes,
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${searchQuery}%`} },
                    { author: { [Op.like]: `%${searchQuery}%`} },
                    { genre:  { [Op.like]: `%${searchQuery}%`} },
                    { year: { [Op.like]: `%${searchQuery}%`} }
                ]
            },
            offset: (page - 1) * resultsPerPage,
            limit: resultsPerPage,
        });
        
        if (books.rows.length > 0) {
            // books found
            pagesFound = Math.ceil(books.count / resultsPerPage); 
            res.render('books/search-results', { title: "Search Results", searchQuery, location: `Page ${page}`, columnNames, books, pagesFound });
        } else {
            // no books found
            res.render('books/search-results', { title: "Search Results", errorMsg: "No results found, try another search."});
        }
    } else {
        // empty search query
        res.render('books/search-results', { title: "Search Results", errorMsg: "Please enter a valid search term."});
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