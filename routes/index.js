var express = require("express");
var router = express.Router();
const mongoose = require("../mongoose/index")
const Customer = require("../mongoose/schemas/customer");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { verifyToken } = require("./middlewares");

mongoose.connect();

// 비밀번호 암호화 해시
const crypto = require('crypto');

function hasspassword(password, salt) {
  return new Promise((resolve, reject) =>{
    crypto.pbkdf2(password, salt,1000, 64, 'sha512', (err, key) => {
      if (err) {
        console.log(err); 
        reject(err);
        return;
      }
      const hashkey = key.toString('base64');
      resolve(hashkey);
    });
  });
};

router.get("/", verifyToken, (req, res, next) => {
  if (!req.decoded) {
    return res.redirect("/login");
  }
  res.render("index");
})


router.get("/join", function (req, res, next) {
  res.render("join");
});

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.get("/room", function (req, res, next) {
  res.render("room");
});

// 회원가입 아이디 중복 체크
router.post("/join/id", async (req, res, next) => {
  const { id } = req.body;

  try{

    let customer = await Customer.findOne({ id });
    
    if (customer !== null ) {
      return res.status(400).json({success: false, error : [{msg: "이미 아이디 존재"}]});
    } else{
      console.log("아이디 사용가능")
      return res.json({success:true});
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }

});

// 회원가입 아이디와 비밀번호(암호화) 데이터베이스 저장
router.post("/join", async (req, res, next) => {
  const { id, pw1, pw2 } = req.body;

  try{

    // 비밀번호 일치 여부 확인
    if (pw1 !== pw2) {
      console.log("비밀번호가 일치하지 않습니다.");
      return res.status(400).json({ success: false, error: [{ msg: '비밀번호가 일치하지 않습니다.' }] });
    } else {
      console.log("비밀번호가 일치합니다.");

      //비밀 번호 암호화
      const salt = crypto.randomBytes(16).toString('hex');
      const pw = await hasspassword(pw2, salt);
      

      const customer = new Customer ({
        id: id,
        pw : pw,
        salt: salt,
      });      
  
      await customer.save();
            
      return res.json({success:true});
    }

  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }
});

// 로그인
// 비밀번호 암호화 확인 함수 
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
router.post("/login", async (req, res, next) => {
  const { id, pw, checkbox } = req.body;

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
      const expiresIn = checkbox ? "1h" : "5m";
      const token = jwt.sign(
        {
          id: customer.id,
        },
        process.env.JWT_SECRET,
        {
          //expiresIn: "1h",
          expiresIn,
          issuer: "토큰 발급자",
        }
      );
      res.cookie("token", token, { httpOnly: true , maxAge: expiresIn === '1h' ? 60 * 60 * 1000 : 30 * 1000 });

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

// 로그아웃
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

module.exports = router;

