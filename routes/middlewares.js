const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {

  try {
    const cookieHeader = req.headers.cookie; 
    const cookies = Object.fromEntries(cookieHeader.split(';').map(cookie => cookie.trim().split('=')));
    const token = cookies.token;
    req.decoded = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    // 인증 실패
    if (error.name === "TokenExpireError") {
      return res.status(419).json({
        redirectTo: "/login",
        code: 419,
        message: "토큰이 만료되었습니다.",
      });
    }
    return res.status(401).json({
      redirectTo: "/login",
      code: 401,
      message: "유효하지 않은 토큰입니다.",
    });
  }
};
