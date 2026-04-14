export const patientOnly = (req, res, next) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({
      success: false,
      error: 'Patient access only',
    });
  }
  next();
};

