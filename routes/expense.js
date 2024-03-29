const express = require('express');
const userAuthentication = require('../middleware/auth');
const router = express.Router();

const expenseController = require('../controllers/expense');

router.get('/expenses', userAuthentication.authenticate, expenseController.getExpenses);
router.get('/expenses/:id', userAuthentication.authenticate, expenseController.getExpenseById);
router.post('/expenses', userAuthentication.authenticate, expenseController.createExpense);
router.put('/expenses/:id', userAuthentication.authenticate, expenseController.updateExpense);
router.delete('/expenses/:id', userAuthentication.authenticate, expenseController.deleteExpense);


module.exports = router;