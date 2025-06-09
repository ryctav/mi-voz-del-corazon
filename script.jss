const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const confirmBtn = document.getElementById("confirmBtn");
const statusText = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");
const qrContainer = document.getElementById("qrContainer");
const linkContainer = document.getElementById("linkContainer");

let mediaRecorder;
let audioChunks = [];
let audioBlob;
let audioUrl;

recordBtn.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      audioUrl = URL.createObjectURL(audioBlob);
      audioPlayer.src = audioUrl;
      statusText.textContent = "Grabación lista. Puedes Confirmar o Grabar otra vez.";
      confirmBtn.disabled = false;
    };

    mediaRecorder.start();
    statusText.textContent = "🎙️ Grabando...";
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    confirmBtn.disabled = true;

    // Limpiar QR y link al comenzar nueva grabación
    qrContainer.innerHTML = "";
    linkContainer.innerHTML = "";
  } catch (err) {
    console.error("Error al acceder al micrófono:", err);
    statusText.textContent = "No se pudo acceder al micrófono. Por favor, permite el acceso.";
  }
};

stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    statusText.textContent = "Procesando...";
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  }
};

confirmBtn.onclick = async () => {
  if (!audioBlob) return;

  statusText.textContent = "Subiendo el audio...";

  const formData = new FormData();
  formData.append("file", audioBlob, "mensaje.webm");

  try {
    const res = await fetch("https://store1.gofile.io/uploadFile", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.status === "ok") {
      const audioLink = data.data.downloadPage;
      statusText.textContent = "¡Listo! Aquí está tu mensaje:";
      linkContainer.innerHTML = `<a href="${audioLink}" target="_blank">${audioLink}</a>`;
      qrContainer.innerHTML = "";
      new QRCode(qrContainer, {
        text: audioLink,
        width: 200,
        height: 200,
      });
      confirmBtn.disabled = true; // evitar subir varias veces sin grabar de nuevo
    } else {
      statusText.textContent = "Error al subir el audio 😢";
    }
  } catch (error) {
    console.error("Error al subir archivo:", error);
    statusText.textContent = "Error al subir el audio 😢";
  }
};
