const express = require('express');
const router = express.Router();
const { addBookController, getAllBooksController, getBookByIdController, editBookByIdController, deleteBookByIdController } = require('../controllers/controller');

// Define API routes
router.post('/books', addBookController);
router.get('/books', getAllBooksController);
router.get('/books/:bookId', getBookByIdController);
router.put('/books/:bookId', editBookByIdController);
router.delete('/books/:bookId', deleteBookByIdController);

module.exports = router;