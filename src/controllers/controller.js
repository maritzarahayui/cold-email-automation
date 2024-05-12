const { addBookHandler, getAllBooksHandler, getBookByIdHandler, editBookByIdHandler, deleteBookByIdHandler } = require("../utils/handler");

// Controller functions
const addBookController = (req, res) => {
    return addBookHandler(req, res);
};

const getAllBooksController = (req, res) => {
    return getAllBooksHandler(req, res);
};

const getBookByIdController = (req, res) => {
    return getBookByIdHandler(req, res);
};

const editBookByIdController = (req, res) => {
    return editBookByIdHandler(req, res);
};

const deleteBookByIdController = (req, res) => {
    return deleteBookByIdHandler(req, res);
};

module.exports = {
    addBookController,
    getAllBooksController,
    getBookByIdController,
    editBookByIdController,
    deleteBookByIdController
};
