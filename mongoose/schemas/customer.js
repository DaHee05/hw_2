const mongoose = require("mongoose");

const {Schema} = mongoose;

//데이터 구조 명시하면 됨, id 는 몽고디비가 알아서 생성하고 관리함
const customerSchema = new Schema({
    id : {
        type : String,
        required : true, 
        unique: true,
    },
    pw : {
        type : String,
        required : true,
        unique : true, // 중복 값 있으면 오류
    },
    salt: {
        type: String,
        required: true,
    },
    recordWin: {
        type : Number,
        required: true,
        default: 0,
    },
    recordLoser: {
        type : Number,
        required: true,
        default: 0,
    }
});
 
// 모델? 유저 -게시판 글에서 관리하는 형식들은 전부다 모델이 됨
const Customer = mongoose.model('Customer', customerSchema);

//외부 접근 허용
module.exports = Customer;