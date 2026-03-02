// ===============================
// DATA (Persistent)
// ===============================

let books = JSON.parse(localStorage.getItem("books")) || [];


// ===============================
// DOM ELEMENTS
// ===============================

const addBookBtn = document.getElementById("addBookBtn");
const searchInput = document.getElementById("searchInput");


// ===============================
// EVENT LISTENERS
// ===============================

// Add Book
addBookBtn.addEventListener("click", function () {

    const title = document.getElementById("titleInput").value;
    const author = document.getElementById("authorInput").value;
    const genre = document.getElementById("genreInput").value;
    const series = document.getElementById("seriesInput").value;
    const status = document.getElementById("statusInput").value;
    const rating = Number(document.getElementById("ratingInput").value);

    // Validation
    if (title === "") {
        alert("Please enter a title.");
        return;
    }

    const book = {
        title,
        author,
        genre,
        series,
        status,
        rating
    };

    books.push(book);

    saveToStorage();
    renderBooks();
    clearForm();
});


// Live Search
searchInput.addEventListener("input", function () {
    renderBooks();
});


// ===============================
// HELPER FUNCTIONS
// ===============================

function clearForm() {
    document.getElementById("titleInput").value = "";
    document.getElementById("authorInput").value = "";
    document.getElementById("genreInput").value = "";
    document.getElementById("seriesInput").value = "";
    document.getElementById("statusInput").value = "to-read";
    document.getElementById("ratingInput").value = "0";
}

function saveToStorage() {
    localStorage.setItem("books", JSON.stringify(books));
}


// ===============================
// RENDER BOOKS
// ===============================

function renderBooks() {

    const bookList = document.getElementById("bookList");
    bookList.innerHTML = "";

    const searchTerm = searchInput.value.toLowerCase();

    books.forEach(function (book, index) {

        // Search filter
        if (
            !book.title.toLowerCase().includes(searchTerm) &&
            !book.author.toLowerCase().includes(searchTerm)
        ) {
            return;
        }

        const card = document.createElement("div");
        card.classList.add("book-card");

        card.innerHTML = `
            <h3>${book.title}</h3>
            <p><strong>Author:</strong> ${book.author || "Unknown"}</p>
            <p><strong>Genre:</strong> ${book.genre || "N/A"}</p>
            <p><strong>Series:</strong> ${book.series || "Standalone"}</p>

            <label>Status:</label>
            <select onchange="changeStatus(${index}, this.value)">
                <option value="to-read" ${book.status === "to-read" ? "selected" : ""}>To Read</option>
                <option value="reading" ${book.status === "reading" ? "selected" : ""}>Reading</option>
                <option value="completed" ${book.status === "completed" ? "selected" : ""}>Completed</option>
            </select>

            <p><strong>Rating:</strong> ${"★".repeat(book.rating)}</p>

            <button onclick="deleteBook(${index})">Delete</button>
        `;

        bookList.appendChild(card);
    });
}


// ===============================
// ACTION FUNCTIONS
// ===============================

function deleteBook(index) {
    books.splice(index, 1);
    saveToStorage();
    renderBooks();
}

function changeStatus(index, newStatus) {
    books[index].status = newStatus;

    saveToStorage();

    if (newStatus === "completed") {
        celebrateCompletion();
    }

    renderBooks();
}


// ===============================
// COMPLETION TOAST
// ===============================

function celebrateCompletion() {
    const toast = document.getElementById("toast");

    if (!toast) return; // prevents crash if toast div missing

    toast.textContent = "🎉 Congratulations on finishing your book!";
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


// ===============================
// INITIAL LOAD
// ===============================

renderBooks();