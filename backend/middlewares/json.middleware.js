const json = (req, res, next) => {
  res.setHeader('content-type', 'application/json');
  next();
};

export default json;
