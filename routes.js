
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const Expense = require('./models/expense');

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { userId: user._id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      errors: { error: error.message }
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        errors: { email: 'No account with this email exists' }
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: { password: 'Incorrect password' }
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({
      success: true,
      message: 'Login successful',
      data: { token }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      errors: { error: error.message }
    });
  }
});

// Add or update monthly income
router.put('/income', async (req, res) => {
  try {
    const { userId, monthlyIncome } = req.body;
    const user = await User.findByIdAndUpdate(userId, { monthlyIncome }, { new: true });
    if (!user) return res.status(404).json({
      success: false,
      message: 'User not found',
      errors: { userId: 'Invalid user ID' }
    });
    res.json({
      success: true,
      message: 'Monthly income updated',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update monthly income',
      errors: { error: error.message }
    });
  }
});

// Add an expense
router.post('/expenses', async (req, res) => {
  try {
    const { userId, amount, type } = req.body;
    const expense = new Expense({ userId, amount, type });
    await expense.save();
    res.status(201).json({
      success: true,
      message: 'Expense added',
      data: { expense }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      errors: { error: error.message }
    });
  }
});

// Get expenses for the current month
router.get('/expenses/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const expenses = await Expense.find({ userId, date: { $gte: startOfMonth } });
    res.json({
      success: true,
      message: 'Expenses retrieved',
      data: { expenses }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses',
      errors: { error: error.message }
    });
  }
});

// Get statistics
router.get('/statistics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({
      success: false,
      message: 'User not found',
      errors: { userId: 'Invalid user ID' }
    });

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const expenses = await Expense.find({ userId, date: { $gte: startOfMonth } });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remainingIncome = user.monthlyIncome - totalExpenses;
    const averageExpense = expenses.length ? totalExpenses / expenses.length : 0;

    res.json({
      success: true,
      message: 'Statistics retrieved',
      data: {
        totalExpenses,
        remainingIncome,
        averageExpense
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      errors: { error: error.message }
    });
  }
});

module.exports = router;
