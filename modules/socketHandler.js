// 서버 코드
const { Server } = require("socket.io");

let user ={};  // 사용자 정보      
let readyUsers = []; // 준비 버튼 누른 사람 장보
let playOrder = []; // 플레이 순서

const socketHandler = (server) =>{
    const io = new Server(server);
    io.on("connection", (socket) => { 
        const req = socket.request;
        const socket_id = socket.id;
        const client_ip = 
            req.headers["x-forwarded-for"] || req.connection.remoteAddress; 
        console.log("socket ID : ", socket_id); 
        user[socket.id] = {nickname: "user nickname", point: 0 };
        
        socket.on("disconnect", () => { 
            console.log(socket.id, "client disconnected");
            delete user[socket.id];
            
        });

        socket.on('join_room', (roomName, done) => {
            // 해당 방에 조인
            socket.join(roomName);
            socket.roomName = roomName;
            console.log(`사용자가 ${roomName} 방에 조인했습니다.`);
            done(); // 이동 실행
        });

        socket.on('ready', () => {
            readyUsers.push(socket.id); 
            // 모든 사용자가 레디 상태인지 확인
            if (Object.keys(user).length === readyUsers.length) {
                io.emit('updateStatus', '게임 시작');
                playOrder = readyUsers.slice(); // 순서 사용자에게 전달
                io.emit('startGame', playOrder);
                readyUsers = [];
            }
            else{
                socket.emit('updateStatus', '다른 사용자 준비 대기 중...');
            }
        });
        // 순서 이동
        socket.on('nextTurn', () => {
            playOrder.push(playOrder.shift()); 
            io.emit('readyUsers', playOrder); 
        });
        // 게임 종료
        socket.on('gameover', () => {
            readyUsers.push(socket.id);
            user[socket.id].point += 1;
            console.log(user[socket.id]);
            socket.emit('winner', '승리하셨습니다.');
            socket.broadcast.emit('loser', '패배하셨습니다.');
            readyUsers = [];
        });
    });
};

module.exports = socketHandler;