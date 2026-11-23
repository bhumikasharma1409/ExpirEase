export function notFoundHandler(_req, res) {
  return res.status(404).json({
    success: false,
    message: 'The requested API route was not found.',
  });
}

export function errorHandler(error, _req, res, _next) {
  if (res.headersSent) return;

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large.' });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ success: false, message: 'Request body must contain valid JSON.' });
  }
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'A provided identifier or value is invalid.' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }
  if (error.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ success: false, message: 'This origin is not allowed.' });
  }

  console.error('Unhandled request error:', error.message);
  return res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
  });
}
