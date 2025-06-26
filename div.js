function topDiv() {
  const div = document.createElement("div");
  const texts = [
    "온 세상의 코드를 <span>김일성</span>-<span>김정일</span>주의화 하자!",
    "자력갱생",
    "당중앙의 커밋결정 관철에로!",
    "동무는 코드정책관철에서 혁명성, 속도성의 원칙을 지키고 있는가?",
    "요령주의, 패배주의, 무책임성을 짓뿌시자!",
    "코드 속도전",
    "코드의 질을 높이자!",
    "Github는 코드의 최전선 입니다. - <span>김일성</span>",
  ];
  const randomIndex = Math.floor(Math.random() * texts.length);

  div.innerHTML = `
    <h1 style="
    font-family: 'KP PusKul', Arial, sans-serif !important;
">${texts[randomIndex]}</h1>`;
  const style = document.createElement("style");
  style.textContent = `
  .red{
      background: #cc0000;
      display: flex;
      align-items: center;
      padding: 0.5rem;
      justify-content: center;
      font-family: 'KP PusKul', Arial, sans-serif !important;
      }

    .red span {
    font-weight: bold;
    font-family: 'KP PusKul', Arial, sans-serif !important;
    font-size: 2.2rem;
    }
  `;
  div.classList.add("red");
  document.body.prepend(div);
  document.body.appendChild(style);
}

function run() {
  if (document.body) {
    topDiv();
  } else {
    setTimeout(run, 10);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", topDiv);
} else {
  run;
}
