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

recordBtn.onclick = async () => {
  try {
    statusText.textContent = "Solicitando acceso al micrófono...";
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

      statusText.textContent = "Audio listo para escuchar. Si te gusta, confirma para generar QR.";
      confirmBtn.disabled = false;
    };

    mediaRecorder.start();
    statusText.textContent = "🎙️ Grabando...";
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    confirmBtn.disabled = true;

  } catch (err) {
    console.error("Error al acceder al micrófono:", err);
    statusText.textContent = "No se pudo acceder al micrófono. Revisa permisos y navegador.";
  }
};

stopBtn.onclick = () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    statusText.textContent = "Procesando audio...";
    recordBtn.disabled = false;
    stopBtn.disabled = true;
  }
};

// Cuando confirmen, subimos y generamos QR
confirmBtn.onclick = async () => {
  if (!audioBlob) {
    statusText.textContent = "No hay audio para subir.";
    return;
  }

  statusText.textContent = "Subiendo el audio...";
  confirmBtn.disabled = true;

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

      qrContainer.innerHTML = ""; // limpiar QR anterior
      new QRCode(qrContainer, {
        text: audioLink,
        width: 200,
        height: 200,
      });
    } else {
      statusText.textContent = "Error al subir el audio 😢";
      confirmBtn.disabled = false;
    }
  } catch (err) {
    console.error("Error al subir el audio:", err);
    statusText.textContent = "Error al subir el audio 😢";
    confirmBtn.disabled = false;
  }
};
