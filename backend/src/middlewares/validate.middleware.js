export const validateClassifyInput = (req, res, next) => {
  const { text } = req.body;

  if (!text || text.length < 5) {
    return res.status(400).json({
      success: false,
      message: "Text is required and should be meaningful",
    });
  }

  next();
};
