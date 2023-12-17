const socket = io();

let playOrder = []; // 진행 순서 -> 버튼 누른 순
let lastButtonClickTime; // 버튼 클릭 시간 

// 게임 바 부분 처음에 뜨지 않게 함
const play = document.getElementById('play');
play.hidden = true;

// 게임 버튼 비활성화
const playBtn = document.getElementById('playBtn');
playBtn.disabled = true;

// 준비 버튼
const readyto = document.getElementById('readyto');
const readyButton = document.getElementById('readyBtn');
const statusMessage = document.getElementById('statusMessage');
const gameReslut = document.getElementById('gameReslut');

// 준비 버튼 누른 신호 서버에 전송
readyButton.addEventListener('click', (event) => {
  event.preventDefault();
  readyButton.disabled = true;
  gameReslut.hidden = true;
  console.log("누를거임");
  socket.emit('ready');
});
// 서버에서 전송 받은 순서 -> 레디 누른 순
socket.on('updateStatus', (newStatus) => {
  statusMessage.textContent = newStatus;
});

// 모두 준비되면 게임 플레이 공간 표시하고 순서 받아오기
socket.on('startGame', (order) => {
  play.hidden = false;
  playOrder = order;
  updatePlayButtonVisibility();
  
});

// 변경되는 순서 받아오기
socket.on('readyUsers', (order) => {
  playOrder = order;
  updatePlayButtonVisibility();
});

// 버튼 클릭 시 다음 플레이어로 순서 이동 요청
playBtn.addEventListener('click', () => {
  socket.emit('nextTurn');
});


//게임 
const sliderContainer = document.getElementById("slider-container");
const slider = document.getElementById("slider");
const output = document.getElementById("output");
const score = document.getElementById("score");
const maxscore = document.getElementById("maxscore");


let direction = 1;
let speed = getRandomSpeed();
let totalValue = 200; // 시작 점수 
let maxValue = 0; // 최대 점수
let Myscore = 0;

function moveSlider() {
  const sliderPosition = slider.offsetLeft;
  const containerWidth = sliderContainer.offsetWidth;
  const sliderWidth = slider.offsetWidth;

  if (
    sliderPosition >= containerWidth - sliderWidth ||
    sliderPosition <= 0
    ) {
        direction *= -1;
    }

  const newPosition = Math.max(
    0,
    Math.min(
      containerWidth - sliderWidth,
      sliderPosition + direction * speed
      )
    );
      slider.style.left = newPosition + "px";
  }

function showValue() {
  const sliderPosition = slider.offsetLeft;
  const containerWidth = sliderContainer.offsetWidth;
  const sliderWidth = slider.offsetWidth;
  const Value = Math.floor(
    (sliderPosition / (containerWidth - sliderWidth)) * 100
  );
  output.innerText = `이번 판 병뚜껑 소모 체력: ${Value}`;

  // 10초 이상이 지난 경우 value를 0으로 설정
  if (Date.now() - lastButtonClickTime > 10000) {
  output.innerText = "이번 판 병뚜껑 소모 체력: 0";
  Value = 0;
  }
  score.innerText = `현재 병뚜겅 체력: ${totalValue-Value}`;
  totalValue = totalValue - Value;

  if (maxValue < Value) {
    maxValue = Value;
    maxscore.innerText= `현재 최대 값: ${maxValue}`;
  } else {
    maxscore.innerText= `현재 최대 값: ${maxValue}`;
  }

  if (totalValue <= 0) {
    console.log('종료');
    play.hidden = true;
    newPTag = '';
    socket.emit('gameover');
  }
}
function getRandomSpeed() {
  return (Math.random() + 0.1) * 13;
}
function changeSpeed() {
  speed = getRandomSpeed();
}
setInterval(moveSlider, 10);
setInterval(changeSpeed, 1000); // 1초마다 속도를 변경합니다.

// 이겼을 경우 
socket.on('winner', (results) => {
  Myscore = 1;

  gameReslut.hidden = false;
  gameReslut.textContent = results;
  readyButton.disabled = false;
  resetGame();
});
// 졌을 경우 
socket.on('loser', (lresults) => {
  Myscore = 2;

  gameReslut.hidden = false;
  gameReslut.textContent = lresults;
  readyButton.disabled = false;
  resetGame();
});

// 순서 이동 
function updatePlayButtonVisibility() {
  if (playOrder.length > 0 && playOrder[0] === socket.id) {
    playBtn.disabled = false;
    lastButtonClickTime = Date.now();
  } else {
    playBtn.disabled = true;
  }
}

// 값 초기화, 다시 시작을 위한 
function resetGame() {
  play.hidden = true;
  statusMessage.textContent='';
  output.textContent='';
  score.textContent='';
  maxscore.textContent='';
  totalValue = 200; 
  maxValue = 0;
}
