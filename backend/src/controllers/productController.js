import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { getDateBounds, getDaysUntil, getExpiryStatus, getStatusDateFilter, parseDateOnly } from '../utils/expiry.js';

const categories = ['Food & Groceries', 'Medicines', 'Personal Care', 'Household', 'Others'];
const units = ['pieces', 'kg', 'grams', 'litres', 'ml', 'packs'];
const writableFields = ['name', 'productName', 'category', 'quantity', 'unit', 'purchaseDate', 'expiryDate', 'notes', 'image', 'isConsumed', 'isDiscarded'];
const statusAliases = { 'expiring-today': 'today', 'expiring-soon': 'soon' };

function mapProductInput(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }
  const unknownFields = Object.keys(body).filter((field) => !writableFields.includes(field));
  if (unknownFields.length) {
    return { error: `Unsupported product field(s): ${unknownFields.join(', ')}.` };
  }

  const data = {};
  const productName = body.name ?? body.productName;
  if (productName !== undefined) data.productName = productName;
  else if (!partial) return { error: 'Product name is required.' };

  for (const field of ['category', 'quantity', 'unit', 'purchaseDate', 'expiryDate', 'notes', 'image', 'isConsumed', 'isDiscarded']) {
    if (body[field] !== undefined) data[field] = body[field];
  }

  if (data.productName !== undefined && (typeof data.productName !== 'string' || !data.productName.trim() || data.productName.trim().length > 150)) {
    return { error: 'Product name must be between 1 and 150 characters.' };
  }
  if (!partial || data.category !== undefined) {
    if (data.category === undefined || !categories.includes(data.category)) return { error: 'Choose a valid product category.' };
  }
  if (!partial || data.quantity !== undefined) {
    if (data.quantity === undefined || typeof data.quantity !== 'number' || !Number.isFinite(data.quantity) || data.quantity <= 0) {
      return { error: 'Quantity must be a number greater than zero.' };
    }
  }
  if (!partial || data.unit !== undefined) {
    if (data.unit === undefined || !units.includes(data.unit)) return { error: 'Choose a valid quantity unit.' };
  }

  for (const field of ['purchaseDate', 'expiryDate']) {
    if (data[field] !== undefined) {
      const date = parseDateOnly(data[field]);
      if (!date) return { error: `${field === 'purchaseDate' ? 'Purchase' : 'Expiry'} date must be a valid YYYY-MM-DD date.` };
      data[field] = date;
    } else if (!partial) {
      return { error: `${field === 'purchaseDate' ? 'Purchase' : 'Expiry'} date is required.` };
    }
  }
  if (data.notes !== undefined && (typeof data.notes !== 'string' || data.notes.length > 300)) {
    return { error: 'Notes must be text no longer than 300 characters.' };
  }
  if (data.image !== undefined && (typeof data.image !== 'string' || data.image.length > 1500000)) {
    return { error: 'Image must be a string no larger than 1.5 MB.' };
  }
  for (const field of ['isConsumed', 'isDiscarded']) {
    if (data[field] !== undefined && typeof data[field] !== 'boolean') {
      return { error: `${field} must be a boolean.` };
    }
  }
  if (data.isConsumed === true && data.isDiscarded === true) {
    return { error: 'A product cannot be both consumed and discarded.' };
  }

  return { data };
}

function formatProduct(product) {
  const data = typeof product.toObject === 'function' ? product.toObject() : product;
  const isActive = !data.isConsumed && !data.isDiscarded;
  const daysRemaining = isActive ? getDaysUntil(data.expiryDate) : null;
  const { userId: _ownerId, ...productData } = data;
  return {
    ...productData,
    _id: data._id?.toString(),
    name: data.productName,
    expiryStatus: isActive ? getExpiryStatus(data.expiryDate) : null,
    daysRemaining,
  };
}

function activeProductFilter(userId) {
  return { userId, isConsumed: false, isDiscarded: false };
}

function sendProduct(res, status, message, product) {
  return res.status(status).json({
    success: true,
    message,
    data: { product: formatProduct(product) },
  });
}

function validateProductId(id, res) {
  if (mongoose.isValidObjectId(id)) return true;
  res.status(400).json({ success: false, message: 'Product ID is invalid.' });
  return false;
}

function parseBooleanQuery(value, field, res) {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  res.status(400).json({ success: false, message: `${field} must be true or false.` });
  return null;
}

function getPagination(query, res) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    res.status(400).json({ success: false, message: 'page must be a positive integer and limit must be between 1 and 100.' });
    return null;
  }
  return { page, limit, skip: (page - 1) * limit };
}

export async function createProduct(req, res, next) {
  const { data, error } = mapProductInput(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  if (data.expiryDate < data.purchaseDate) {
    return res.status(400).json({ success: false, message: 'Expiry date cannot be earlier than purchase date.' });
  }

  try {
    const product = await Product.create({ ...data, productName: data.productName.trim(), userId: req.user._id });
    return sendProduct(res, 201, 'Product created successfully.', product);
  } catch (requestError) {
    return next(requestError);
  }
}

export async function getProducts(req, res, next) {
  const pagination = getPagination(req.query, res);
  if (!pagination) return;

  const consumed = parseBooleanQuery(req.query.consumed, 'consumed', res);
  if (consumed === null) return;
  const discarded = parseBooleanQuery(req.query.discarded, 'discarded', res);
  if (discarded === null) return;
  const filter = { userId: req.user._id };
  if (consumed === undefined && discarded === undefined) {
    filter.isConsumed = false;
    filter.isDiscarded = false;
  } else {
    if (consumed !== undefined) filter.isConsumed = consumed;
    if (discarded !== undefined) filter.isDiscarded = discarded;
  }

  const category = req.query.category;
  if (category !== undefined) {
    if (!categories.includes(category)) return res.status(400).json({ success: false, message: 'Choose a valid category filter.' });
    filter.category = category;
  }

  const search = req.query.search;
  if (search !== undefined) {
    if (typeof search !== 'string' || search.length > 100) return res.status(400).json({ success: false, message: 'Search must be 100 characters or fewer.' });
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escapedSearch) {
      filter.$or = [
        { productName: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } },
        { notes: { $regex: escapedSearch, $options: 'i' } },
      ];
    }
  }

  const requestedStatus = req.query.status === undefined ? undefined : statusAliases[req.query.status] || req.query.status;
  if (requestedStatus !== undefined) {
    const statusFilter = getStatusDateFilter(requestedStatus);
    if (!statusFilter) return res.status(400).json({ success: false, message: 'status must be expired, today, soon, or safe.' });
    Object.assign(filter, statusFilter);
  }

  const sortOptions = {
    nearest: { expiryDate: 1, _id: 1 },
    farthest: { expiryDate: -1, _id: 1 },
    name: { productName: 1, _id: 1 },
    recent: { createdAt: -1, _id: -1 },
  };
  const sortName = req.query.sort || 'nearest';
  if (!sortOptions[sortName]) return res.status(400).json({ success: false, message: 'sort must be nearest, farthest, name, or recent.' });

  try {
    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOptions[sortName]).skip(pagination.skip).limit(pagination.limit).lean(),
      Product.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        products: products.map(formatProduct),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getProduct(req, res, next) {
  if (!validateProductId(req.params.id, res)) return;
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    return sendProduct(res, 200, 'Product retrieved successfully.', product);
  } catch (error) {
    return next(error);
  }
}

export async function updateProduct(req, res, next) {
  if (!validateProductId(req.params.id, res)) return;
  const { data, error } = mapProductInput(req.body, { partial: true });
  if (error) return res.status(400).json({ success: false, message: error });
  if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'Provide at least one product field to update.' });

  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const purchaseDate = data.purchaseDate ?? product.purchaseDate;
    const expiryDate = data.expiryDate ?? product.expiryDate;
    if (expiryDate < purchaseDate) {
      return res.status(400).json({ success: false, message: 'Expiry date cannot be earlier than purchase date.' });
    }
    if (data.isConsumed === true) data.isDiscarded = false;
    if (data.isDiscarded === true) data.isConsumed = false;
    Object.assign(product, data);
    await product.save();
    return sendProduct(res, 200, 'Product updated successfully.', product);
  } catch (error) {
    return next(error);
  }
}

export async function deleteProduct(req, res, next) {
  if (!validateProductId(req.params.id, res)) return;
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    return res.status(200).json({ success: true, message: 'Product deleted successfully.', data: { id: product._id.toString() } });
  } catch (error) {
    return next(error);
  }
}

async function setProductFlag(req, res, next, flag) {
  if (!validateProductId(req.params.id, res)) return;
  try {
    const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    product[flag] = true;
    product[flag === 'isConsumed' ? 'isDiscarded' : 'isConsumed'] = false;
    await product.save();
    const message = flag === 'isConsumed' ? 'Product marked as consumed.' : 'Product marked as discarded.';
    return sendProduct(res, 200, message, product);
  } catch (error) {
    return next(error);
  }
}

export function markProductConsumed(req, res, next) {
  return setProductFlag(req, res, next, 'isConsumed');
}

export function markProductDiscarded(req, res, next) {
  return setProductFlag(req, res, next, 'isDiscarded');
}

async function getActiveProductsByStatus(req, res, next, status) {
  try {
    const filter = { ...activeProductFilter(req.user._id), ...getStatusDateFilter(status) };
    const products = await Product.find(filter).sort({ expiryDate: 1, _id: 1 }).lean();
    return res.status(200).json({
      success: true,
      data: { products: products.map(formatProduct), count: products.length },
    });
  } catch (error) {
    return next(error);
  }
}

export function getExpiredProducts(req, res, next) {
  return getActiveProductsByStatus(req, res, next, 'expired');
}

export function getProductsExpiringToday(req, res, next) {
  return getActiveProductsByStatus(req, res, next, 'today');
}

export function getProductsExpiringSoon(req, res, next) {
  return getActiveProductsByStatus(req, res, next, 'soon');
}

export function getSafeProducts(req, res, next) {
  return getActiveProductsByStatus(req, res, next, 'safe');
}

export async function getPriorityProducts(req, res, next) {
  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ success: false, message: 'limit must be between 1 and 100.' });
  }
  try {
    const products = await Product.find(activeProductFilter(req.user._id))
      .sort({ expiryDate: 1, _id: 1 })
      .limit(limit)
      .lean();
    return res.status(200).json({
      success: true,
      data: { products: products.map(formatProduct), count: products.length },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getDashboard(req, res, next) {
  try {
    const { today, tomorrow, eighthDay } = getDateBounds();
    const userId = req.user._id;
    const active = { userId, isConsumed: false, isDiscarded: false };
    const [activeStats, consumedCount, discardedCount] = await Promise.all([
      Product.aggregate([
        { $match: active },
        {
          $facet: {
            total: [{ $count: 'count' }],
            expired: [{ $match: { expiryDate: { $lt: today } } }, { $count: 'count' }],
            expiringToday: [{ $match: { expiryDate: { $gte: today, $lt: tomorrow } } }, { $count: 'count' }],
            expiringSoon: [{ $match: { expiryDate: { $gte: tomorrow, $lt: eighthDay } } }, { $count: 'count' }],
            safe: [{ $match: { expiryDate: { $gte: eighthDay } } }, { $count: 'count' }],
            categories: [
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            expiryOutlook: [
              { $match: { expiryDate: { $gte: today, $lt: eighthDay } } },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$expiryDate',
                      timezone: 'UTC',
                    },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]),
      Product.countDocuments({ userId, isConsumed: true }),
      Product.countDocuments({ userId, isDiscarded: true }),
    ]);
    const stats = activeStats[0] || {};
    const count = (facet) => stats[facet]?.[0]?.count || 0;
    return res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalActiveProducts: count('total'),
          expiredProducts: count('expired'),
          expiringToday: count('expiringToday'),
          expiringSoon: count('expiringSoon'),
          safeProducts: count('safe'),
          consumedProducts: consumedCount,
          discardedProducts: discardedCount,
        },
        categoryDistribution: (stats.categories || []).map(({ _id, count: categoryCount }) => ({
          category: _id,
          count: categoryCount,
        })),
        expiryOutlook: (stats.expiryOutlook || []).map(({ _id, count: expiryCount }) => ({
          date: _id,
          count: expiryCount,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}
