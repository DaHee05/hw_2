var express = require("express");
var router = express.Router();
const mongoose = require("../mongoose/index")
const Customer = require("../mongoose/schemas/customer");
const RoomLists = require("../mongoose/schemas/roomlist");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { verifyToken } = require("./middlewares");

mongoose.connect();

// 비밀번호 암호화 해시
const crypto = require('crypto');
const { ftruncate } = require("fs");

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

router.get("/", function(req, res, next){
  res.render("index");
});


router.get("/loginout", verifyToken, function (req, res, next){
  res.json({success : true});

});

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
      const expiresIn = checkbox ? "1h" : "30m";
      const maxAge = expiresIn === '1h' ? 60 * 60 * 1000 : 30 * 60 * 1000;  // 1시간 또는 30분(ms)로 설정
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
      res.cookie("token", token, { httpOnly: true , maxAge });

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
// 방 
router.get("/room", function (req, res, next) {
  res.render("room");
});

// 승패 기록 저장 record
router.post("/room", verifyToken, async function (req, res, next) {
  const { id } = req.decoded;
  console.log("넘어온",id);

  try {
    const { Myscore } = req.body;
    console.log(Myscore);

    const my_record = await Customer.findOne({ id });

    if ( Myscore === 1){
      my_record.recordWin += 1;
    } else if (Myscore === 2) {
      my_record.recordLoser +=1;
    }

    await my_record.save();
    res.json({ success: true,typess:false , message: '승패기록 성공적 업로드' });
  }catch (error){
    res.status(500).send(`내부 서버 오류: ${error.message}`);
  }
});

// 기록 확인
router.get("/record", verifyToken, async function(req, res, next) {
  //res.render("record");

  const { id } = req.decoded;
  console.log("승패기록확인할 id",id);

  try {
    const Myrecord = await Customer.findOne({id});

    if (!Myrecord){
      return res.json({ success: false, message: "회원 정보를 찾을 수 없음"});
    }else {
      // 승률 계산
      const winRatesum = (Myrecord.recordWin / (Myrecord.recordWin + Myrecord.recordLoser)) * 100;

      // 소수점 둘째 자리까지 표시하려면
      const WinRate = winRatesum.toFixed(0)+"%";

      return res.render("record", {Myrecord, WinRate});
    }

  } catch(error){
    res.status(500).send(`기록 읽어오기 실패: ${error.message}`)
  }
});

// 방 목록 가져오기
router.get("/roomlists", async (req, res, next) => {
  try{

    const Allroomlist = await RoomLists.find();

    return res.json({success:true, Allroomlist });
  } catch(error){
    console.error(error.message);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

router.get("/room/:list_id", async (req, res, next) => {
  res.render("room");
});
  
router.post("/", async function (req, res,next) {
  const { roomName } = req.body;
  try{

    // 중복 회피를 위해 지금 있는 post_id보다 +1 큰 값으로 post_id 지정
    const latestlist = await RoomLists.findOne().sort({ list_id: -1 });
    const latestListId = latestlist ? latestlist.list_id : 0; // 이전 post_id 없으면 0
    const newListId = latestListId + 1;

    // 나머지 데이터로 새로운 글 생성
    const newROOM = new RoomLists({
      list_id: newListId,
      roomName
    });

    // 데이터베이스에 저장
    await newROOM.save();

    res.json({success:true, newListId});
  } catch (error){
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

module.exports = router;

