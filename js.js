// ===============================
// DATA (Persistent)
// ===============================

let books = JSON.parse(localStorage.getItem("books")) || [];
let editingIndex = null;


// ===============================
// DOM ELEMENTS
// ===============================

const addBookBtn = document.getElementById("addBookBtn");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect"); // FIXED
const filterSelect = document.getElementById("filterSelect");


// ===============================
// EVENT LISTENERS
// ===============================

addBookBtn.addEventListener("click", function () {

    const title = document.getElementById("titleInput").value;
    const author = document.getElementById("authorInput").value;
    const genre = document.getElementById("genreInput").value;
    const series = document.getElementById("seriesInput").value;
    const status = document.getElementById("statusInput").value;
    const rating = Number(document.getElementById("ratingInput").value);

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

    if (editingIndex !== null) {
		books[editingIndex] = book;
		editingIndex = null;
		addBookBtn.textContent = "Add Book";
	} else {
		books.push(book);
}

    saveToStorage();
    renderBooks();
    clearForm();
});

searchInput.addEventListener("input", renderBooks);
sortSelect.addEventListener("change", renderBooks);
filterSelect.addEventListener("change", renderBooks);


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
	
	editingIndex = null;
	addBooksBtn.textContent = "Add Book";
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
    const selectedFilter = filterSelect.value;
    const selectedSort = sortSelect.value;

    let filteredBooks = books.filter(book => {

        const matchesSearch =
            book.title.toLowerCase().includes(searchTerm) ||
            (book.author && book.author.toLowerCase().includes(searchTerm));

        const matchesFilter =
            !selectedFilter || book.status === selectedFilter;

        return matchesSearch && matchesFilter;
    });

    if (selectedSort === "title") {
        filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (selectedSort === "rating") {
        filteredBooks.sort((a, b) => b.rating - a.rating);
    }

    if (selectedSort === "status") {
        filteredBooks.sort((a, b) => a.status.localeCompare(b.status));
    }

    filteredBooks.forEach(function (book) {

        const originalIndex = books.indexOf(book);

        const card = document.createElement("div");
        card.classList.add("book-card");

        card.innerHTML = `
            <h3>${book.title}</h3>
            <p><strong>Author:</strong> ${book.author || "Unknown"}</p>
            <p><strong>Genre:</strong> ${book.genre || "N/A"}</p>
            <p><strong>Series:</strong> ${book.series || "Standalone"}</p>

            <label>Status:</label>
            <select onchange="changeStatus(${originalIndex}, this.value)">
                <option value="to-read" ${book.status === "to-read" ? "selected" : ""}>To Read</option>
                <option value="reading" ${book.status === "reading" ? "selected" : ""}>Reading</option>
                <option value="completed" ${book.status === "completed" ? "selected" : ""}>Completed</option>
            </select>

            <div>
                <strong>Rating:</strong>
                ${renderStars(book.rating, originalIndex)}
            </div>
			
			<button onClick="editBook(${originalIndex})">Edit</button>
            <button onclick="deleteBook(${originalIndex})">Delete</button>
        `;

        bookList.appendChild(card);
    });

    renderSeriesGroups(filteredBooks);
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

function setRating(index, rating) {
    books[index].rating = rating;
    saveToStorage();
    renderBooks();
}

function editBook(index) {

    const book = books[index];

    document.getElementById("titleInput").value = book.title;
    document.getElementById("authorInput").value = book.author;
    document.getElementById("genreInput").value = book.genre;
    document.getElementById("seriesInput").value = book.series;
    document.getElementById("statusInput").value = book.status;
    document.getElementById("ratingInput").value = book.rating;

    editingIndex = index;

    addBookBtn.textContent = "Save Changes";
}


// ===============================
// STAR RENDERING
// ===============================

function renderStars(rating, index) {

    let starsHTML = "";

    for (let i = 1; i <= 5; i++) {
        starsHTML += `
            <span 
                style="cursor:pointer; font-size:20px;"
                onclick="setRating(${index}, ${i})"
            >
                ${i <= rating ? "★" : "☆"}
            </span>
        `;
    }

    return starsHTML;
}


// ===============================
// SERIES GROUPING
// ===============================

function renderSeriesGroups(bookArray) {

    const librarySection = document.querySelector(".library");

    let oldGroup = document.getElementById("seriesGroups");
    if (oldGroup) oldGroup.remove();

    const groups = {};

    bookArray.forEach(book => {
        if (book.series && book.series !== "") {
            if (!groups[book.series]) {
                groups[book.series] = [];
            }
            groups[book.series].push(book);
        }
    });

    const container = document.createElement("div");
    container.id = "seriesGroups";

    Object.keys(groups).forEach(seriesName => {

        const booksInSeries = groups[seriesName];

        const avgRating =
            booksInSeries.reduce((sum, b) => sum + b.rating, 0) /
            booksInSeries.length;

        const groupDiv = document.createElement("div");
        groupDiv.classList.add("book-card");

        groupDiv.innerHTML = `
            <h3>Series: ${seriesName}</h3>
            <p><strong>Books:</strong> ${booksInSeries.length}</p>
            <p><strong>Average Rating:</strong> ${"★".repeat(Math.round(avgRating))}</p>
        `;

        container.appendChild(groupDiv);
    });

    if (Object.keys(groups).length > 0) {
        librarySection.appendChild(container);
    }
}


// ===============================
// COMPLETION TOAST
// ===============================

function celebrateCompletion() {
    const toast = document.getElementById("toast");
    if (!toast) return;

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