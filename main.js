/** 캔버스 설정 */
const canvas = document.getElementById("canvas"); // 캔버스 요소 가져오기
canvas.width = 800; // 캔버스 너비 설정
canvas.height = 500; // 캔버스 높이 설정
const ctx = canvas.getContext("2d"); // 2D 렌더링

/** 게임 상태 변수 */
let gameStarted = false; // 게임 시작 여부
const BG_MOVING_SPEED = 3; // 배경 이동 속도
let bgX = 0; // 배경 X 좌표
let scoreText = document.getElementById("score"); // 점수 표시 요소
let score = 0; // 현재 점수

/** 게임 변수 */
let timer = 0; // 장애물 생성 시간
let obstacleArray = []; // 장애물 배열
let gameOver = false; // 게임 종료 여부
let jump = false; // 점프 여부
let jumpSpeed = 3; // 점프 속도

/** 오디오 객체 생성 및 설정 */
const jumpSound = new Audio(); // 점프 소리
jumpSound.src = "./sounds/jump.mp3";
const bgmSound = new Audio(); // 배경 음악
bgmSound.src = "./sounds/bgm.mp3";
const scoreSound = new Audio(); // 점수 획득 소리
scoreSound.src = "./sounds/score.mp3";
const defeatSound = new Audio(); // 게임 오버 소리
defeatSound.src = "./sounds/defeat1.mp3";

/** 이미지 객체 생성 및 설정 */
// (1) 배경
const bgImage = new Image();
bgImage.src = "./images/background중세1.png";
// (2) 게임 시작
const startImage = new Image();
startImage.src = "./images/gamestart.png";
// (3) 게임 오버
const gameoverImage = new Image();
gameoverImage.src = "./images/gameover.png";
// (4) 게임 재시작
const restartImage = new Image();
restartImage.src = "./images/restart.png";
// (5) 달리는 르탄이 A
const rtanAImage = new Image();
rtanAImage.src = "./images/rtan_running_a.png";
// (6) 달리는 르탄이 B
const rtanBImage = new Image();
rtanBImage.src = "./images/rtan_running_b.png";
// (7) 게임 오버 르탄이
const rtanCrashImage = new Image();
rtanCrashImage.src = "./images/rtan_crash.png";
// (8) 장애물
const obstacleImage = new Image();
obstacleImage.src = "./images/obstacle1.png";

/** 1-1 르탄이 그리기 */
const RTAN_WIDTH = 100; // 르탄이 가로 너비
const RTAN_HEIGHT = 100; // 르탄이 세로 높이
const RTAN_X = 10; // 르탄이의 초기 X 좌표
const RTAN_Y = 400; // 르탄이의 초기 Y 좌표

/** 르탄이 객체 정의 */
const rtan = {
  x: RTAN_X,
  y: RTAN_Y,
  width: RTAN_WIDTH,
  height: RTAN_HEIGHT,
  draw() {      // 달리는 애니메이션 구현
    if (gameOver) {
      // 게임 오버 시 충돌 이미지 그리기
      ctx.drawImage(rtanCrashImage, this.x, this.y, this.width, this.height);
    } else {
      // 달리는 애니메이션 구현
      if (timer % 60 > 30) {
        ctx.drawImage(rtanAImage, this.x, this.y, this.width, this.height);
      } else {
        ctx.drawImage(rtanBImage, this.x, this.y, this.width, this.height);
      }
    }
  },
};
/** end of 1-1 르탄이 그리기 */

/** 2-1 장애물 설정 */
const OBSTACLE_WIDTH = 50; // 장애물 너비
const OBSTACLE_HEIGHT = 50; // 장애물 높이
const OBSTACLE_FREQUENCY = 90; // 장애물 생성 빈도
const OBSTACLE_SPEED = 4; // 장애물 이동 속도

/** 장애물 클래스 정의 */
class Obstacle {
  constructor() {
    this.x = canvas.width;
    this.y =
      Math.floor(Math.random() * (canvas.height - OBSTACLE_HEIGHT - 30)) + 30; // 장애물이 canvas의 상단과 하단에서 30px 이내에 생성되지 않도록 조정
    this.width = OBSTACLE_WIDTH;
    this.height = OBSTACLE_HEIGHT;
  }
  draw() {
    ctx.drawImage(obstacleImage, this.x, this.y, this.width, this.height); // 장애물 이미지 그리기
  }
}
/** end of 2-1 장애물 설정 */

/** 3-1 배경 화면 그리기 */
function backgroundImg(bgX) {
  ctx.drawImage(bgImage, bgX, 0, canvas.width, canvas.height);
}
// 시작 화면 그리기
function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  backgroundImg(0);
  const imageWidth = 473;
  const imageHeight = 316;
  const imageX = canvas.width / 2 - imageWidth / 2;
  const imageY = canvas.height / 2 - imageHeight / 2;
  ctx.drawImage(startImage, imageX, imageY, imageWidth, imageHeight);
}

// 게임 오버 화면 그리기
function drawGameOverScreen() {
  ctx.drawImage(
    gameoverImage,
    canvas.width / 2 - 100,
    canvas.height / 2 - 50,
    200,
    100
  );
  ctx.drawImage(
    restartImage,
    canvas.width / 2 - 50,
    canvas.height / 2 + 50,
    100,
    50
  );
}

//이미지 로딩 완료 시 게임 시작 화면 그리기
let bgImageLoaded = new Promise((resolve) => {
  bgImage.onload = resolve;
});

let startImageLoaded = new Promise((resolve) => {
  startImage.onload = resolve;
});

Promise.all([bgImageLoaded, startImageLoaded]).then(drawStartScreen);
/** end of 3-1 게임 시작 화면을 그리는 함수 */

/** 게임 애니메이션 함수 */
function animate() {
  /** 2-3 장애물 조건 설정(게임 오버) */
  if (gameOver) {
    drawGameOverScreen(); // 3-2 에서 다룰 게임오버 그리기
    return;
  }
  /** end of 2-3 장애물 조건 설정(게임 오버) */

  // 타이머 증가 및 다음 프레임 요청
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  timer++;

  /** 배경 이미지 */
  // 3-1 배경 이미지 그리기 (무한 스크롤 효과)
  backgroundImg(bgX);
  backgroundImg(bgX + canvas.width);
  bgX -= BG_MOVING_SPEED;
  if (bgX < -canvas.width) bgX = 0;
  // 배경 음악 재생
  bgmSound.play();
  /** end of 배경 이미지 */

  /**-- 장애물 --*/
  /** 2-2 장애물 움직이기 */
  if (timer % OBSTACLE_FREQUENCY === 0) {
    const obstacle = new Obstacle();
    obstacleArray.push(obstacle);
  }
  // 장애물 처리
  obstacleArray.forEach((obstacle) => {
    obstacle.draw();
    obstacle.x -= OBSTACLE_SPEED; // 장애물 왼쪽으로 이동
    /** end of 2-2 장애물 움직이기 */

    /** 2-3 장애물 조건 설정(충돌하기) */
    // 화면 밖으로 나간 장애물 제거 및 점수 증가
    if (obstacle.x < -OBSTACLE_WIDTH) {
      obstacleArray.shift(); // 장애물 제거
      score += 10; // 점수 증가
      scoreText.innerHTML = "현재점수: " + score;
      scoreSound.pause(); // 현재 재생 중인 점수 소리 중지
      scoreSound.currentTime = 0; // 소리 재생 위치를 시작으로 초기화
      scoreSound.play(); // 점수 획득 소리 재생
    }

    // 충돌 검사
    if (collision(rtan, obstacle)) {
      timer = 0;
      gameOver = true;
      jump = false;
      bgmSound.pause(); // 배경 음악 중지
      defeatSound.play(); // 게임 오버 소리 재생
    }
  });
  /** end of 2-3 장애물 조건 설정(충돌하기)*/
  /** end of 장애물 */

  /**-- 르탄이 --*/
  // 1-2 르탄이 그리기
  rtan.draw();

  // 1-3 르탄이 점프 조건 설정하기
  if (jump) {
    rtan.y -= 3; // 스페이스바를 누르고 있으면 rtan의 y값 감소
    if (rtan.y < 20) rtan.y = 20; // rtan이 canvas 상단을 넘지 않도록 조정
  } else {
    if (rtan.y < RTAN_Y) {
      rtan.y += 3; // 스페이스바를 떼면 rtan의 y값 증가
      if (rtan.y > RTAN_Y) rtan.y = RTAN_Y; // rtan이 초기 위치 아래로 내려가지 않도록 조정
    }
  }
  /** end of 르탄이 */
}
/** end of 게임 애니메이션 */

/** 1-3 르탄이 점프하기 */
// 키보드 이벤트 처리 (스페이스바 점프)
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !jump) {
    jump = true; // 스페이스바를 누르고 있을 때 점프 상태 유지
    jumpSound.play(); // 점프 소리 재생
  }
});

document.addEventListener("keyup", function (e) {
  if (e.code === "Space") {
    jump = false; // 스페이스바를 떼면 점프 상태 해제
  }
});
/** end of 1-3 르탄이 점프하기 */

/** 2-3 장애물 조건1 충돌함수 */
/** 충돌 체크 함수 */
function collision(rtan, obstacle) {
  return !(
    rtan.x > obstacle.x + obstacle.width ||
    rtan.x + rtan.width < obstacle.x ||
    rtan.y > obstacle.y + obstacle.height ||
    rtan.y + rtan.height < obstacle.y
  );
}
/** end of 2-3 장애물 조건1 충돌함수 */

/** 3-3 게임 시작 조건 설정하기 */
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 게임 시작 조건 확인
  if (
    !gameStarted &&
    x >= 0 &&
    x <= canvas.width &&
    y >= 0 &&
    y <= canvas.height
  ) {
    gameStarted = true;
    animate();
  }

  // 게임 재시작 버튼 클릭 확인
  if (
    gameOver &&
    x >= canvas.width / 2 - 50 &&
    x <= canvas.width / 2 + 50 &&
    y >= canvas.height / 2 + 50 &&
    y <= canvas.height / 2 + 100
  ) {
    restartGame();
  }
});

/** 게임 재시작 함수 */
function restartGame() {
  gameOver = false;
  obstacleArray = [];
  timer = 0;
  score = 0;
  scoreText.innerHTML = "현재점수: " + score;
  // 게임 오버 시 르탄이 위치 초기화
  rtan.x = 10;
  rtan.y = 400;
  animate();
}
/** end of 3-3 마우스 클릭 이벤트 처리 (게임 시작 및 재시작) */


/** 4. 꾸미기 */
/** 마우스 이동 이벤트 처리 (커서 스타일 변경) */
canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 게임오버 재시작 버튼 위에 있을 때
  if (
    gameOver &&
    x >= canvas.width / 2 - 50 &&
    x <= canvas.width / 2 + 50 &&
    y >= canvas.height / 2 + 50 &&
    y <= canvas.height / 2 + 100
  ) {
    canvas.style.cursor = "pointer";
  }
  // 게임 시작 전 캔버스 위에 있을 때
  else if (
    !gameStarted &&
    x >= 0 &&
    x <= canvas.width &&
    y >= 0 &&
    y <= canvas.height
  ) {
    canvas.style.cursor = "pointer";
  }
  // 그 외의 경우
  else {
    canvas.style.cursor = "default";
  }
});
/** end of 4.꾸미기 */