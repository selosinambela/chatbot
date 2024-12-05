const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const micButton = document.querySelector("#mic-button");
const volumeButton = document.querySelector("#volume-button");

const API_KEY = "AIzaSyDl-wp5sN-DM4rshoawtBJtDfaIkF3yKS8";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null
    }
};

const chatHistory = [{
    role : "model",
    parts : [{ text: "Pengantar Teknologi Informasi"}],
}];
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "id-ID,en-US"; 

    micButton.addEventListener("click", () => {
        recognition.start();
    });

    recognition.onstart = () => {
        micButton.classList.add("listening");  
    };

    recognition.onend = () => {
        micButton.classList.remove("listening");  
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        messageInput.value = transcript;

        handleOutgoingMessage(new Event("submit"));
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        alert("Error in speech recognition: " + event.error);
    };
} else {
    micButton.style.display = "none"; 
}

let isSpeaking = false; 
const getFemaleVoice = () => {
    const voices = speechSynthesis.getVoices();
    return voices.find(voice => voice.lang === "id-ID" && voice.name.includes("female")) || 
        voices.find(voice => voice.lang === "id-ID");
};
const speakText = (text) => {
    if (!window.speechSynthesis) {
        alert("Text-to-Speech tidak didukung di browser ini.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = getFemaleVoice();
    utterance.lang = "id-ID";
    utterance.rate = 1;
    utterance.pitch = 1.2; 

    utterance.onend = () => {
        isSpeaking = false;
        volumeButton.classList.remove("speaking");
    };

    window.speechSynthesis.speak(utterance);
    isSpeaking = true;
    volumeButton.classList.add("speaking");
};
volumeButton.addEventListener("click", () => {
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        volumeButton.classList.remove("speaking");
    } else {
        const botMessages = document.querySelectorAll(".bot-message .message-text");
        if (botMessages.length === 0) {
            alert("Tidak ada respons yang bisa dibacakan.");
            return;
        }

        const latestBotMessage = botMessages[botMessages.length - 1].innerText;
        speakText(latestBotMessage);
    }
});

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");
    chatHistory.push({
        role : "user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
    });

    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: chatHistory
        })
    };

    try {
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        messageElement.innerText = apiResponseText;

        chatHistory.push({
            role : "model",
            parts: [{ text : apiResponseText }]
        });

    } catch (error) {
        console.error(error);
        messageElement.innerText = error.message || "An error occurred";
        messageElement.style.color = "#ff0000";
    } finally {
        userData.file = {};
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
};

const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    if (!userData.message && !userData.file.data) return;
    messageInput.value = '';
    fileUploadWrapper.classList.remove("file-uploaded");

    const messageContent = 
        `<div class="message-text">${userData.message}</div>` +
        `${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="attachment"/>` : ""}`;

    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    setTimeout(() => {
        const botMessageContent = 
        ` <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="30" fill="#0084ff" stroke="#ffffff" stroke-width="2"/>
                    <path d="M32 14a18 18 0 0 1 0 36M32 22a10 10 0 0 1 0 20" fill="none" stroke="#ffffff" stroke-width="2"/>
                    <path d="M22 32c0-5.5 4.5-10 10-10h3c5.5 0 10 4.5 10 10s-4.5 10-10 10h-2l-6 6v-6h-1c-5.5 0-10-4.5-10-10z" fill="#ffffff"/>
                    <circle cx="27" cy="31" r="2" fill="#0084ff"/>
                    <circle cx="37" cy="31" r="2" fill="#0084ff"/>
                    <circle cx="18" cy="18" r="3" fill="#34dbff"/>
                    <circle cx="46" cy="20" r="2.5" fill="#ffde5b"/>
                    <circle cx="30" cy="48" r="2.5" fill="#ff5c8d"/>
                </svg>
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;

        const incomingMessageDiv = createMessageElement(botMessageContent, "bot-message", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
        generateBotResponse(incomingMessageDiv);
    }, 600);
};

messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === "Enter" && userMessage) {
        handleOutgoingMessage(e);
    }
});

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        const base64String = e.target.result.split(",")[1];
        userData.file = {
            data: base64String,
            mime_type: file.type
        };

        fileInput.value = "";
    };
    reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
    userData = {};
    fileUploadWrapper.classList.remove("file-uploaded");
});

window.addEventListener("load", () => {
    const preloader = document.getElementById("preloader");
    setTimeout(() => {
        preloader.classList.add("fade-out");
        preloader.addEventListener("transitionend", () => {
            preloader.style.display = "none";
        });
    }, 3000);
});

sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
