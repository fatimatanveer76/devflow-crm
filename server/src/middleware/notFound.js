/**
 * 404 Not Found handler for undefined API routes
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    errors: [
      {
        path: req.originalUrl,
        message: `The requested endpoint ${req.originalUrl} does not exist on this server.`,
      },
    ],
  });
};
