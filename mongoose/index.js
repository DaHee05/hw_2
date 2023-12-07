const mongoose = require("mongoose");


const connect = async () => {
    // 개발 중에는 오류 메세지 더 자세히 보여줄 수도 있다.

    if (process.env.NODE_ENV !== 'production'){
        mongoose.set('debug', true);
    }

    //접근은 root:1234로 하고 접근하고 쓰는건 kwic
    await mongoose.connect(
        "mongodb://root:1234@127.0.0.1:27017/admin", 
        {
            dbName : "kwic",
        }         
    );
};

mongoose.connection.on('error', (error) => {
    console.error("mongodb 연결 에러", error);
});

mongoose.connection.on('disconnected', () => {
    console.error("mongodb 연결 종료됨");
    connect();
});

// 다른 외부에서 connect 사용가능 
module.exports = {
    connect,
};