import mongoose from 'mongoose';

const categories = [
  'Food & Groceries',
  'Medicines',
  'Personal Care',
  'Household',
  'Others',
];
const units = ['pieces', 'kg', 'grams', 'litres', 'ml', 'packs'];

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Product owner is required.'],
    index: true,
  },
  productName: {
    type: String,
    required: [true, 'Product name is required.'],
    trim: true,
    minlength: [1, 'Product name cannot be empty.'],
    maxlength: [150, 'Product name cannot exceed 150 characters.'],
  },
  category: {
    type: String,
    required: [true, 'Category is required.'],
    enum: { values: categories, message: 'Choose a valid product category.' },
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required.'],
    min: [Number.MIN_VALUE, 'Quantity must be greater than zero.'],
    validate: {
      validator: Number.isFinite,
      message: 'Quantity must be a finite number.',
    },
  },
  unit: {
    type: String,
    required: [true, 'Unit is required.'],
    enum: { values: units, message: 'Choose a valid quantity unit.' },
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required.'],
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required.'],
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters.'],
    default: '',
  },
  image: {
    type: String,
    maxlength: [1500000, 'Image data is too large.'],
    default: '',
  },
  isConsumed: {
    type: Boolean,
    default: false,
  },
  isDiscarded: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

productSchema.index({ userId: 1, expiryDate: 1 });
productSchema.index({ expiryDate: 1 });

productSchema.pre('validate', function validateDateOrder() {
  if (this.purchaseDate && this.expiryDate && this.expiryDate < this.purchaseDate) {
    this.invalidate('expiryDate', 'Expiry date cannot be earlier than purchase date.');
  }
});

const Product = mongoose.model('Product', productSchema);

export default Product;
