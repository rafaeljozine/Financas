import { getProductById, getProducts } from "./api.js";
import { escapeHtml, pageUrl, showToast } from "./main.js";

const VISION_VERSION = "1.0.1";
const VISION_MODULE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/vision_bundle.mjs`;
const VISION_WASM_ROOT = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`;
const FACE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const MIN_INFERENCE_INTERVAL = 50;

const compatibleProducts = getProducts({ publicOnly: true }).filter((product) => product.testeVirtual && product.imagemVirtual);
const requestedId = new URLSearchParams(window.location.search).get("id");
let selected = compatibleProducts.find((product) => String(product.id) === String(requestedId)) || compatibleProducts[0] || null;
let stream = null;
let faceLandmarker = null;
let faceLandmarkerPromise = null;
let trackingFrame = null;
let lastVideoTime = -1;
let lastInferenceAt = 0;
let missingFaceFrames = 0;
let trackingErrorShown = false;
let smoothedFrame = null;

const select = document.querySelector("[data-virtual-product-select]");
const productImage = document.querySelector("[data-virtual-product-image]");
const productName = document.querySelector("[data-virtual-product-name]");
const overlay = document.querySelector("[data-frame-overlay]");
const frameOverlay = document.querySelector("[data-frame-overlay-wrap]");
const video = document.querySelector("[data-camera-video]");
const stage = document.querySelector("[data-camera-stage]");
const empty = document.querySelector("[data-camera-empty]");
const startButton = document.querySelector("[data-start-camera]");
const stopButton = document.querySelector("[data-stop-camera]");
const backLink = document.querySelector("[data-back-product]");
const faceStatus = document.querySelector("[data-face-status]");
const faceStatusText = document.querySelector("[data-face-status-text]");

select.innerHTML = compatibleProducts.map((product) => `<option value="${product.id}">${escapeHtml(product.nome)}</option>`).join("");

function setFaceStatus(message, state = "searching") {
  if (!faceStatus || !faceStatusText) return;
  faceStatus.hidden = false;
  faceStatus.dataset.state = state;
  if (faceStatusText.textContent !== message) faceStatusText.textContent = message;
}

function renderProduct() {
  if (!selected) {
    productName.textContent = "Nenhuma armação compatível";
    startButton.disabled = true;
    return;
  }
  select.value = selected.id;
  productImage.src = selected.imagem;
  productImage.alt = selected.nome;
  productName.textContent = selected.nome;
  overlay.src = selected.imagemVirtual;
  overlay.alt = "";
  backLink.href = `${pageUrl("pages/principal/produto-detalhe.html")}?id=${encodeURIComponent(selected.id)}`;
}

async function createLandmarker(FaceLandmarker, vision, delegate) {
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.55,
    minFacePresenceConfidence: 0.55,
    minTrackingConfidence: 0.55,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}

async function initializeFaceLandmarker() {
  if (faceLandmarker) return faceLandmarker;
  if (faceLandmarkerPromise) return faceLandmarkerPromise;

  faceLandmarkerPromise = (async () => {
    const { FaceLandmarker, FilesetResolver } = await import(VISION_MODULE_URL);
    const vision = await FilesetResolver.forVisionTasks(VISION_WASM_ROOT);
    try {
      faceLandmarker = await createLandmarker(FaceLandmarker, vision, "GPU");
    } catch (gpuError) {
      console.warn("[virtual.js] A aceleração gráfica não ficou disponível; a usar CPU.", gpuError);
      faceLandmarker = await createLandmarker(FaceLandmarker, vision, "CPU");
    }
    return faceLandmarker;
  })().catch((error) => {
    faceLandmarkerPromise = null;
    throw error;
  });

  return faceLandmarkerPromise;
}

function waitForVideoMetadata() {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth && video.videoHeight) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("A câmara não disponibilizou as dimensões do vídeo a tempo."));
    }, 8000);

    video.addEventListener("loadedmetadata", () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

function videoPointToStage(landmark) {
  const stageRect = stage.getBoundingClientRect();
  const videoWidth = video.videoWidth || stageRect.width;
  const videoHeight = video.videoHeight || stageRect.height;
  const coverScale = Math.max(stageRect.width / videoWidth, stageRect.height / videoHeight);
  const renderedWidth = videoWidth * coverScale;
  const renderedHeight = videoHeight * coverScale;
  const offsetX = (stageRect.width - renderedWidth) / 2;
  const offsetY = (stageRect.height - renderedHeight) / 2;
  const unmirroredX = offsetX + (landmark.x * renderedWidth);

  return {
    x: stageRect.width - unmirroredX,
    y: offsetY + (landmark.y * renderedHeight),
  };
}

function distance(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function normalizedAngle(first, second) {
  let angle = Math.atan2(second.y - first.y, second.x - first.x) * (180 / Math.PI);
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  return Math.max(-32, Math.min(32, angle));
}

function smoothValue(previous, next, amount) {
  return previous + ((next - previous) * amount);
}

function positionFrame(landmarks) {
  // Olhos, laterais do rosto e ponte nasal no mapa MediaPipe.
  const eyeA = videoPointToStage(landmarks[33]);
  const eyeB = videoPointToStage(landmarks[263]);
  const faceA = videoPointToStage(landmarks[234]);
  const faceB = videoPointToStage(landmarks[454]);
  const noseBridge = videoPointToStage(landmarks[168]);
  const stageWidth = stage.getBoundingClientRect().width;
  const eyeDistance = distance(eyeA, eyeB);
  const eyeCenterX = (eyeA.x + eyeB.x) / 2;
  const eyeCenterY = (eyeA.y + eyeB.y) / 2;
  const faceLeft = faceA.x < faceB.x ? faceA : faceB;
  const faceRight = faceA.x < faceB.x ? faceB : faceA;
  const frameWidth = Math.max(stageWidth * .17, Math.min(stageWidth * .7, eyeDistance * 1.66));
  const frameLeft = eyeCenterX - (frameWidth * .465);
  const frameRight = eyeCenterX + (frameWidth * .465);
  const leftArmLength = Math.max(frameWidth * .1, Math.min(frameWidth * .34, frameLeft - faceLeft.x));
  const rightArmLength = Math.max(frameWidth * .1, Math.min(frameWidth * .34, faceRight.x - frameRight));
  const leftArmAngle = Math.max(-14, Math.min(14, -Math.atan2(faceLeft.y - eyeCenterY, leftArmLength) * (180 / Math.PI)));
  const rightArmAngle = Math.max(-14, Math.min(14, Math.atan2(faceRight.y - eyeCenterY, rightArmLength) * (180 / Math.PI)));
  const target = {
    x: eyeCenterX,
    y: eyeCenterY + (eyeDistance * .025),
    width: frameWidth,
    angle: normalizedAngle(eyeA, eyeB),
    yaw: Math.max(-18, Math.min(18, ((noseBridge.x - eyeCenterX) / Math.max(eyeDistance, 1)) * 42)),
    leftArmLength,
    rightArmLength,
    leftArmAngle,
    rightArmAngle,
  };

  if (!smoothedFrame) smoothedFrame = target;
  else {
    smoothedFrame = {
      x: smoothValue(smoothedFrame.x, target.x, 0.28),
      y: smoothValue(smoothedFrame.y, target.y, 0.28),
      width: smoothValue(smoothedFrame.width, target.width, 0.22),
      angle: smoothValue(smoothedFrame.angle, target.angle, 0.2),
      yaw: smoothValue(smoothedFrame.yaw, target.yaw, .18),
      leftArmLength: smoothValue(smoothedFrame.leftArmLength, target.leftArmLength, .2),
      rightArmLength: smoothValue(smoothedFrame.rightArmLength, target.rightArmLength, .2),
      leftArmAngle: smoothValue(smoothedFrame.leftArmAngle, target.leftArmAngle, .2),
      rightArmAngle: smoothValue(smoothedFrame.rightArmAngle, target.rightArmAngle, .2),
    };
  }

  frameOverlay.style.left = `${smoothedFrame.x}px`;
  frameOverlay.style.top = `${smoothedFrame.y}px`;
  frameOverlay.style.width = `${smoothedFrame.width}px`;
  frameOverlay.style.setProperty("--left-arm-length", `${smoothedFrame.leftArmLength}px`);
  frameOverlay.style.setProperty("--right-arm-length", `${smoothedFrame.rightArmLength}px`);
  frameOverlay.style.setProperty("--left-arm-angle", `${smoothedFrame.leftArmAngle}deg`);
  frameOverlay.style.setProperty("--right-arm-angle", `${smoothedFrame.rightArmAngle}deg`);
  frameOverlay.style.transform = `translate(-50%, -50%) perspective(700px) rotateZ(${smoothedFrame.angle}deg) rotateY(${smoothedFrame.yaw}deg)`;
  stage.classList.add("has-face");
  missingFaceFrames = 0;
  setFaceStatus("Rosto detectado · armação ajustada", "tracked");
}

function markFaceMissing() {
  missingFaceFrames += 1;
  if (missingFaceFrames < 5) return;
  stage.classList.remove("has-face");
  setFaceStatus("A procurar o seu rosto…", "searching");
}

function trackFace(now) {
  if (!stream || !faceLandmarker) return;

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      && video.currentTime !== lastVideoTime
      && now - lastInferenceAt >= MIN_INFERENCE_INTERVAL) {
    lastVideoTime = video.currentTime;
    lastInferenceAt = now;
    try {
      const result = faceLandmarker.detectForVideo(video, now);
      const landmarks = result.faceLandmarks?.[0];
      if (landmarks?.length > 454) positionFrame(landmarks);
      else markFaceMissing();
    } catch (error) {
      stage.classList.remove("has-face");
      setFaceStatus("Detecção facial temporariamente indisponível", "error");
      if (!trackingErrorShown) {
        trackingErrorShown = true;
        console.error("[virtual.js] Falha durante o rastreamento facial.", error);
      }
    }
  }

  trackingFrame = window.requestAnimationFrame(trackFace);
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("A câmara não está disponível neste navegador.", "error");
    return;
  }

  startButton.disabled = true;
  setFaceStatus("A preparar o ajuste…", "loading");

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    await waitForVideoMetadata();
    video.hidden = false;
    empty.hidden = true;
    stage.classList.add("is-active");
    stopButton.disabled = false;
    setFaceStatus("A preparar o ajuste…", "loading");

    await initializeFaceLandmarker();
    setFaceStatus("A procurar o seu rosto…", "searching");
    trackingErrorShown = false;
    lastVideoTime = -1;
    lastInferenceAt = 0;
    trackingFrame = window.requestAnimationFrame(trackFace);
  } catch (error) {
    console.error("[virtual.js] Não foi possível iniciar a experiência virtual.", error);
    if (!stream) {
      setFaceStatus("Não foi possível aceder à câmara", "error");
      showToast("Não foi possível iniciar a câmara. Confirme a permissão no navegador.", "error");
      startButton.disabled = false;
    } else {
      setFaceStatus("Não foi possível carregar a detecção facial", "error");
      showToast("A câmara iniciou, mas o ajuste automático ao rosto não ficou disponível.", "error");
    }
  }
}

function stopCamera() {
  if (trackingFrame) window.cancelAnimationFrame(trackingFrame);
  trackingFrame = null;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  video.srcObject = null;
  video.hidden = true;
  empty.hidden = false;
  faceStatus.hidden = true;
  stage.classList.remove("is-active", "has-face");
  frameOverlay.removeAttribute("style");
  smoothedFrame = null;
  missingFaceFrames = 0;
  startButton.disabled = !selected;
  stopButton.disabled = true;
}

select.addEventListener("change", () => {
  selected = getProductById(select.value);
  renderProduct();
  smoothedFrame = null;
  if (selected) window.history.replaceState({}, "", `${window.location.pathname}?id=${encodeURIComponent(selected.id)}`);
});
startButton.addEventListener("click", startCamera);
stopButton.addEventListener("click", stopCamera);
window.addEventListener("pagehide", () => {
  stopCamera();
  faceLandmarker?.close();
  faceLandmarker = null;
  faceLandmarkerPromise = null;
});

renderProduct();
