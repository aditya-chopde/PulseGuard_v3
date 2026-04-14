export const patientOnly = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({
      success: false,
      error: `User role ${req.user.role} is not authorized to access this route`,
    });
  }
  next();
};

