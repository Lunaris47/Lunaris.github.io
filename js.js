let books = [];

// Get button
const addBookBtn = document.getElementById("addBookBtn");

// When button is clicked
addBookBtn.addEventListener("click", function () {

    const title = document.getElementById("titleInput").value;
    const author = document.getElementById("authorInput").value;
    const genre = document.getElementById("genreInput").value;
    const series = document.getElementById("seriesInput").value;
    const status = document.getElementById("statusInput").value;
    const rating = document.getElementById("ratingInput").value;

    // Simple validation
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

    renderBooks();
    clearForm();
});

function clearForm() {
    document.getElementById("titleInput").value = "";
    document.getElementById("authorInput").value = "";
    document.getElementById("genreInput").value = "";
    document.getElementById("seriesInput").value = "";
    document.getElementById("statusInput").value = "to-read";
    document.getElementById("ratingInput").value = "0";
}

function renderBooks() {

    const bookList = document.getElementById("bookList");
    bookList.innerHTML = "";

    books.forEach(function (book, index) {

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

function deleteBook(index) {
    books.splice(index, 1);
    renderBooks();
}

function changeStatus(index, newStatus) {
    books[index].status = newStatus;

    if (newStatus === "completed") {
        celebrateCompletion();
    }

    renderBooks();
}

function celebrateCompletion() {
    const toast = document.getElementById("toast");
    toast.textContent = "🎉 Congratulations on finishing your book!";
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}