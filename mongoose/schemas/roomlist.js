const mongoose = require("mongoose");

const {Schema} = mongoose;

//데이터 구조 명시하면 됨, id 는 몽고디비가 알아서 생성하고 관리함
const roomsSchema = new Schema({
    roomName : {
        type : String,
        required : true, //무조건 있어야 한다
    },
    list_id : {
        type: Number,
        required: true,
        unique: true,
    }
});
 
// 모델? 유저 -게시판 글에서 관리하는 형식들은 전부다 모델이 됨
const RoomLists = mongoose.model('roomlists', roomsSchema);

//외부 접근 허용
module.exports = RoomLists;