const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  holes: {
    type: Number,
    required: true,
  },
  pricePerSession: {
    type: Number,
    required: true,
  },
  availableStock: {
    type: Number,
    required: true,
    default: 0,
  },
  totalStock: Number,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  image: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', productSchema);
