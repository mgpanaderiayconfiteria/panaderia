const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUserPassword, deleteUser } = require('../controllers/userController');

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id/password', updateUserPassword);
router.delete('/:id', deleteUser);

module.exports = router;