const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");
const statusText = document.getElementById("status");
const audioPlayer = document.getElementById("audioPlayer");
const qrContainer = document.getElementById("qrContainer");
const linkContainer = document.getElementById("linkContainer");

let mediaRecorder;
let audioChunks = [];
let audioBlob;

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
      const audioUrl = URL.createObjectURL(audioBlob);
      audioPlayer.src = audioUrl;
      statusText.textContent = "Audio grabado. Escúchalo y confirma para subir.";
      recordBtn.disabled = true;
      stopBtn.disabled = true;

      if (!document.getElementById("uploadBtn")) {
        const uploadBtn = document.createElement("button");
        uploadBtn.id = "uploadBtn";
        uploadBtn.textContent = "Confirmar y subir";
        document.body.appendChild(uploadBtn);

        uploadBtn.onclick = uploadAudio;
      }
    };

    mediaRecorder.start();
    statusText.textContent = "🎙️ Grabando...";
    recordBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (error) {
    statusText.textContent = "No se pudo acceder al micrófono 😢";
  }
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  statusText.textContent = "Grabación detenida.";
  recordBtn.disabled = false;
  stopBtn.disabled = true;
};

async function uploadAudio() {
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
      document.getElementById("uploadBtn").disabled = true;
    } else {
      statusText.textContent = "Error al subir el audio 😢";
    }
  } catch (error) {
    statusText.textContent = "Error al subir el audio 😢";
  }
}
