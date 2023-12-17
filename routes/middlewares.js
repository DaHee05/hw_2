const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {

  try {
    const cookieHeader = req.headers.cookie; 
    const cookies = Object.fromEntries(cookieHeader.split(';').map(cookie => cookie.trim().split('=')));
    const token = cookies.token;
    req.decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return next();
  } catch (error) {
    return res.status(401).json({ message: '토큰이 유효하지 않습니다.' });
  }
};
