const express = require("express");
const jwt = require("jsonwebtoken");
const Customer = require("../mongoose/schemas/customer");
require("dotenv").config();

const { verifyToken } = require("./middlewares");

const router = express.Router();


// 비밀번호 암호화 확인 함수 
const crypto = require('crypto');
async function verifyPassword(password, salt, storedPW) {
  return new Promise((resolve, reject) => {
    // 똑같이 로그인 시 입력된 비밀번호로 해시 함수 돌림
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, Key) => {
      if (err){
        console.log(err);
        reject(err);
        return;
      } 
      const hashedkey= Key.toString('base64');
      // 저장된 해시 값과 비교
      if (hashedkey === storedPW) {
        resolve(true); // 비밀번호 일치
      } else {
        resolve(false); // 비밀번호 불일치
      }
    });
  });
}

// 로그인
router.post("/token", async (req, res, next) => {
  const { id, pw } = req.body;

  try {
    const customer = await Customer.findOne({ id });

    if (!customer) {
      return res.status(400).json({ success: false, error: '존재하지 않는 아이디입니다.'});
    }

    // 저장된 salt와 해시된 비밀번호를 이용하여 입력된 비밀번호 검증
    const ValidPW = await verifyPassword(pw, customer.salt, customer.pw);

    if (!ValidPW) {
      return res.status(400).json({ success: false});
    } else {

      const token = jwt.sign(
        {
          id: customer.id,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "15m",
          issuer: "토큰 발급자",
        }
      );
  
      return res.json({
        code: 200,
        message: "토큰이 발급되었습니다.",
        token,
        success:true
      });


    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }
});


module.exports = router;
