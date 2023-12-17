const socket = io();


function roomClick(ListID) {
  //window.location.href = '/room/'+ListID ;
};

let ListID = 0;

const welcome = document.getElementById('welcome');
const welcomeForm = welcome.querySelector('form');

// 방 이름 받아와서 입장하기
const handleWelcomeSubmit = async (event) => {
  event.preventDefault();
  const input = welcomeForm.querySelector('input');
  const roomName = input.value;

  try{
    const response = await fetch('/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    body: JSON.stringify({ roomName }),
  });

  const result = await response.json();
  const { success, newListId } = result;
  if (success) {
    console.log(newListId);
    ListID = newListId;
    window.location.href = '/room/'+ListID;
  }


} catch(error){
  console.log(error);
}

  // 방으로 조인
  socket.emit('join_room', roomName);
  
  // 방 이름을 로컬 스토리지에 저장
  localStorage.setItem("roomName", roomName);
  
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);