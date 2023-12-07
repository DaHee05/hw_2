const socket = io();

function roomClick() {
  window.location.href = '/room';
};

const welcome = document.getElementById('welcome');
const welcomeForm = welcome.querySelector('form');

// 방 이름 받아와서 입장하기
const handleWelcomeSubmit = (event) => {
  event.preventDefault();
  const input = welcomeForm.querySelector('input');
  const roomName = input.value;

  // 방으로 조인
  socket.emit('join_room', roomName, roomClick);

  // 방 이름을 로컬 스토리지에 저장
  localStorage.setItem("roomName", roomName);
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);