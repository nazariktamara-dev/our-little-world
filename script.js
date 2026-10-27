const $ = id => document.getElementById(id);

let photos = JSON.parse(localStorage.getItem("familyPhotos") || "[]");
let messages = JSON.parse(localStorage.getItem("familyMessages") || "[]");
let members = JSON.parse(localStorage.getItem("familyMembers") || '["Ти","Мама","Тато","Сестра"]');

function saveData() {
    localStorage.setItem("familyPhotos", JSON.stringify(photos));
    localStorage.setItem("familyMessages", JSON.stringify(messages));
    localStorage.setItem("familyMembers", JSON.stringify(members));
}

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    $(page).classList.remove("hidden");

    document.querySelectorAll("nav button").forEach(button => {
        button.classList.remove("active");
    });

    const pages = ["home", "chat", "photos", "family"];
    const index = pages.indexOf(page);
    document.querySelectorAll("nav button")[index].classList.add("active");

    document.getElementById("page-name").textContent = {
        home: "Головна",
        chat: "Повідомлення",
        photos: "Фотоальбом",
        family: "Моя сім'я"
    }[page];

    renderPhotos();
    renderMessages();
    renderMembers();
}

function renderPhotos() {
    const grids = ["home-photos", "all-photos"];

    grids.forEach(gridId => {
        const grid = $(gridId);

        grid.innerHTML = photos.map(photo => `
            <article class="photo-card">
                <img src="${photo.src}" alt="Сімейне фото">
                <div class="photo-caption">
                    ${escapeHTML(photo.caption || "Сімейний момент")}
                    <button onclick="deletePhoto('${photo.id}')" title="Видалити">×</button>
                </div>
            </article>
        `).join("");
    });

    $("photo-count").textContent = photos.length;

    $("empty-home").style.display = photos.length ? "none" : "block";
    $("empty-album").style.display = photos.length ? "none" : "block";
}

function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));
}

$("photo-input").addEventListener("change", async function () {
    const files = [...this.files].filter(file =>
        file.type.startsWith("image/")
    );

    for (const file of files) {
        try {
            const src = await readPhoto(file);
            const caption = prompt("Підпис до фотографії:", "") || "";

            photos.unshift({
                id: Date.now() + Math.random().toString(16).slice(2),
                src,
                caption
            });
        } catch {
            alert("Не вдалося відкрити це фото.");
        }
    }

    try {
        saveData();
        renderPhotos();
    } catch {
        alert("У браузері недостатньо місця для фото. Спробуйте менші зображення.");
    }

    this.value = "";
});

function readPhoto(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => {
                const scale = Math.min(
                    1,
                    1200 / Math.max(image.width, image.height)
                );

                const canvas = document.createElement("canvas");
                canvas.width = image.width * scale;
                canvas.height = image.height * scale;

                canvas.getContext("2d").drawImage(
                    image, 0, 0, canvas.width, canvas.height
                );

                resolve(canvas.toDataURL("image/jpeg", 0.75));
            };

            image.onerror = reject;
            image.src = reader.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function deletePhoto(id) {
    if (!confirm("Видалити цю фотографію?")) return;

    photos = photos.filter(photo => String(photo.id) !== String(id));
    saveData();
    renderPhotos();
}

$("chat-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const input = $("message-input");
    const text = input.value.trim();

    if (!text) return;

    messages.push({
        text,
        time: new Date().toLocaleTimeString("uk-UA", {
            hour: "2-digit",
            minute: "2-digit"
        })
    });

    input.value = "";

    try {
        saveData();
        renderMessages();
    } catch {
        messages.pop();
        alert("Не вдалося зберегти повідомлення.");
    }
});

function renderMessages() {
    $("message-count").textContent = messages.length;

    const box = $("messages");

    if (!messages.length) {
        box.innerHTML = '<p class="empty">Напишіть перше повідомлення 💬</p>';
        return;
    }

    box.innerHTML = messages.map(message => `
        <div class="message">
            ${escapeHTML(message.text)}
            <small>Ти · ${escapeHTML(message.time)}</small>
        </div>
    `).join("");

    box.scrollTop = box.scrollHeight;
}

function renderMembers() {
    $("members").innerHTML = members.map((name, index) => `
        <div class="member">
            <span>${escapeHTML(name.charAt(0).toUpperCase())}</span>
            <b>${escapeHTML(name)}</b>
            ${index === 0 ? "" : `
                <button onclick="removeMember(${index})" title="Видалити">×</button>
            `}
        </div>
    `).join("");
}

function addMember() {
    const name = prompt("Як звати члена сім'ї?");

    if (!name || !name.trim()) return;

    members.push(name.trim().slice(0, 40));
    saveData();
    renderMembers();
}

function removeMember(index) {
    if (!confirm("Видалити цього учасника?")) return;

    members.splice(index, 1);
    saveData();
    renderMembers();
}

renderPhotos();
renderMessages();
renderMembers();