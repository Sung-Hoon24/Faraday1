/** 캔버스 설정 */
const canvas = document.getElementById("canvas");
canvas.width = 800;
canvas.height = 500;
const ctx = canvas.getContext("2d");

/** 게임 상태 변수 */
let gameStarted = false;
const BG_MOVING_SPEED = 3;
let bgX = 0;
let scoreText = document.getElementById("score");
let score = 0;
let bgmPlayed = false; // 배경음악 중복 재생 방지

/** 게임 변수 */
let timer = 0;
let obstacleArray = [];
let gameOver = false;
let jump = false;
let jumpSpeed = 3;

/** 오디오 객체 */
const jumpSound = new Audio("./sounds/jump.mp3");
const bgmSound = new Audio("./sounds/bgm.mp3");
const scoreSound = new Audio("./sounds/score.mp3");
const defeatSound = new Audio("./sounds/defeat1.mp3");

/** 이미지 객체 */
const bgImage = new Image();
bgImage.src = "./images/배경.png";
const startImage = new Image();
startImage.src = "./images/gamestart.png";
const gameoverImage = new Image();
gameoverImage.src = "./images/gameover.png";
const restartImage = new Image();
restartImage.src = "./images/하경얼굴2.png";
const rtanAImage = new Image();
rtanAImage.src = "./images/하경달리기.png";
const rtanBImage = new Image();
rtanBImage.src = "./images/하경달리기.png";
const rtanCrashImage = new Image();
rtanCrashImage.src = "./images/하경2.png";
const obstacleImage = new Image();
obstacleImage.src = "./images/익룡2.png";

/** 르탄이 설정 */
const RTAN_WIDTH = 100;
const RTAN_HEIGHT = 100;
const RTAN_X = 10;
const RTAN_Y = 400;

const rtan = {
  x: RTAN_X,
  y: RTAN_Y,
  width: RTAN_WIDTH,
  height: RTAN_HEIGHT,
  draw() {
    if (gameOver) {
      ctx.drawImage(rtanCrashImage, this.x, this.y, this.width, this.height);
    } else {
      if (timer % 60 > 30) {
        ctx.drawImage(rtanAImage, this.x, this.y, this.width, this.height);
      } else {
        ctx.drawImage(rtanBImage, this.x, this.y, this.width, this.height);
      }
    }
  },
};

/** 장애물 설정 */
const OBSTACLE_WIDTH = 70;
const OBSTACLE_HEIGHT = 70;
const OBSTACLE_FREQUENCY = 110;
const OBSTACLE_SPEED = 7;

/** 장애물 클래스 정의 */
class Obstacle {
  constructor() {
    this.x = canvas.width;
    this.y = Math.floor(Math.random() * (canvas.height - OBSTACLE_HEIGHT - 30)) + 30;
    this.width = OBSTACLE_WIDTH;
    this.height = OBSTACLE_HEIGHT;
  }
  draw() {
    ctx.drawImage(obstacleImage, this.x, this.y, this.width, this.height);
  }
}

/** 배경 이미지 그리기 */
function backgroundImg(bgX) {
  ctx.drawImage(bgImage, bgX, 0, canvas.width, canvas.height);
}

/** 시작 화면 그리기 */
function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  backgroundImg(0);
  const imageWidth = 473;
  const imageHeight = 316;
  const imageX = canvas.width / 2 - imageWidth / 2;
  const imageY = canvas.height / 2 - imageHeight / 2;
  ctx.drawImage(startImage, imageX, imageY, imageWidth, imageHeight);
}

/** 게임 오버 화면 그리기 */
function drawGameOverScreen() {
  ctx.drawImage(gameoverImage, canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
  ctx.drawImage(restartImage, canvas.width / 2 - 50, canvas.height / 2 + 50, 100, 50);
}

/** 이미지 로드 후 시작 화면 출력 */
Promise.all([
  new Promise((resolve) => (bgImage.onload = resolve)),
  new Promise((resolve) => (startImage.onload = resolve)),
]).then(drawStartScreen);

/** 게임 루프 함수 */
function animate() {
  if (gameOver) {
    drawGameOverScreen();
    return;
  }

  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  timer++;

  backgroundImg(bgX);
  backgroundImg(bgX + canvas.width);
  bgX -= BG_MOVING_SPEED;
  if (bgX < -canvas.width) bgX = 0;

  // 배경음악 1회만 재생
  if (!bgmPlayed) {
    bgmSound.play().catch(() => {});
    bgmPlayed = true;
  }

  // 장애물 생성
  if (timer % OBSTACLE_FREQUENCY === 0) {
    obstacleArray.push(new Obstacle());
  }

  // 장애물 이동 및 충돌 체크
  obstacleArray.forEach((obstacle) => {
    obstacle.draw();
    obstacle.x -= OBSTACLE_SPEED;
  });

  obstacleArray = obstacleArray.filter((obstacle) => {
    if (obstacle.x < -OBSTACLE_WIDTH) {
      score += 10;
      scoreText.innerHTML = "현재점수: " + score;
      scoreSound.pause();
      scoreSound.currentTime = 0;
      scoreSound.play();
      return false;
    }
    if (collision(rtan, obstacle)) {
      timer = 0;
      gameOver = true;
      jump = false;
      bgmSound.pause();
      defeatSound.play();
      return false;
    }
    return true;
  });

  rtan.draw();

  // 점프 동작
  if (jump) {
    rtan.y -= 3;
    if (rtan.y < 20) rtan.y = 20;
  } else {
    if (rtan.y < RTAN_Y) {
      rtan.y += 3;
      if (rtan.y > RTAN_Y) rtan.y = RTAN_Y;
    }
  }
}

/** 키보드 입력 처리 */
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !jump) {
    jump = true;
    jumpSound.play();
  }
});

document.addEventListener("keyup", function (e) {
  if (e.code === "Space") {
    jump = false;
  }
});

/** 충돌 판정 함수 */
function collision(rtan, obstacle) {
  return !(
    rtan.x > obstacle.x + obstacle.width ||
    rtan.x + rtan.width < obstacle.x ||
    rtan.y > obstacle.y + obstacle.height ||
    rtan.y + rtan.height < obstacle.y
  );
}

/** 캔버스 클릭 처리 */
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (!gameStarted && x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
    gameStarted = true;
    animate();
  }

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
  rtan.x = 10;
  rtan.y = 400;
  animate();
}

/** 커서 상태 변경 처리 */
canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (
    gameOver &&
    x >= canvas.width / 2 - 50 &&
    x <= canvas.width / 2 + 50 &&
    y >= canvas.height / 2 + 50 &&
    y <= canvas.height / 2 + 100
  ) {
    canvas.style.cursor = "pointer";
  } else if (!gameStarted && x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
    canvas.style.cursor = "pointer";
  } else {
    canvas.style.cursor = "default";
  }
});

  }
});
/** end of 4.꾸미기 */
