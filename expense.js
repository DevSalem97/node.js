
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Rent', 'Food', 'Transportation', 'Medical', 'Other'], required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Expense', expenseSchema);
