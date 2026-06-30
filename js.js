// ===============================
// API CONFIG
// ===============================

const API_BASE = "https://booklog-api-production.up.railway.app/api";

let books = [];
let selectedBookIndex = null;
let recentlyDeletedBook = null;
let recentlyDeletedIndex = null;
let undoTimer = null;


// ===============================
// AUTH HELPERS
// ===============================

function getToken(){
    return sessionStorage.getItem("token");
}

function setToken(token){
    sessionStorage.setItem("token", token);
}

function clearToken(){
    sessionStorage.removeItem("token");
}

function isLoggedIn(){
    return getToken() !== null;
}

/**
 * Wrapper around fetch that automatically attaches the JWT token
 * and handles common error cases (like expired tokens).
 */
async function apiFetch(endpoint, options = {}){

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    const token = getToken();
    if(token){
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if(response.status === 401 || response.status === 403){
        clearToken();
        showAuthScreen();
        throw new Error("Session expired. Please log in again.");
    }

    return response;
}


// ===============================
// AUTH SCREEN LOGIC
// ===============================

function showAuthScreen(){
    document.getElementById("authScreen").style.display = "flex";
    document.getElementById("mainApp").style.display = "none";
}

function showMainApp(){
    document.getElementById("authScreen").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
    loadBooks();
}

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");

loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.style.display = "block";
    registerForm.style.display = "none";
});

registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.style.display = "block";
    loginForm.style.display = "none";
});

loginBtn.addEventListener("click", async () => {

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();
    const errorDiv = document.getElementById("loginError");

    errorDiv.textContent = "";

    if(!username || !password){
        errorDiv.textContent = "Please enter both username and password.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if(!response.ok){
            errorDiv.textContent = data.error || "Login failed.";
            return;
        }

        setToken(data.token);
        showMainApp();

    } catch (error) {
        errorDiv.textContent = "Could not connect to server.";
    }

});

registerBtn.addEventListener("click", async () => {

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const errorDiv = document.getElementById("registerError");

    errorDiv.textContent = "";

    if(!username || !email || !password){
        errorDiv.textContent = "Please fill out all fields.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if(!response.ok){
            errorDiv.textContent = data.error || "Registration failed.";
            return;
        }

        // Auto-login after successful registration
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const loginData = await loginResponse.json();
        setToken(loginData.token);
        showMainApp();

    } catch (error) {
        errorDiv.textContent = "Could not connect to server.";
    }

});

logoutBtn.addEventListener("click", () => {
    clearToken();
    books = [];
    showAuthScreen();
});


// ===============================
// DOM ELEMENTS
// ===============================

const addBookBtn = document.getElementById("addBookBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const sortSelect = document.getElementById("sortSelect");
const filterSelect = document.getElementById("filterSelect");
const clearResultsBtn = document.getElementById("clearResults");
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");
const statusInput = document.getElementById("statusInput");
const ratingInput = document.getElementById("ratingInput");
const titleInput = document.getElementById("titleInput");
const authorInput = document.getElementById("authorInput");
const genreInput = document.getElementById("genreInput");
const genreOtherInput = document.getElementById("genreOtherInput");
const seriesInput = document.getElementById("seriesInput");
const titleWarning = document.getElementById("titleWarning");

let bookToDeleteIndex = null;


// ===============================
// LOAD BOOKS FROM API
// ===============================

async function loadBooks(){
    try {
        const response = await apiFetch("/books");
        books = await response.json();
        renderBooks();
    } catch (error) {
        showToast("Could not load your books.");
    }
}


// ===============================
// EVENT LISTENERS
// ===============================

searchInput.addEventListener("input", renderBooks);
sortSelect.addEventListener("change", renderBooks);

titleInput.addEventListener("input", function(){
    document.getElementById("titleWarning").textContent = "";
});

addBookBtn.addEventListener("click", async function () {

    const title = titleInput.value.trim();
    const author = authorInput.value.trim() || "Unknown";
    const genre = genreInput.value === "Other" ? genreOtherInput.value.trim() : genreInput.value;
    const series = seriesInput.value;
    const status = statusInput.value;
    let rating = Number(ratingInput.value);

    if(status === "to-read" && rating > 0){
        showToast("⭐ You can only rate books you've started reading.");
        return;
    }

    if(title === ""){
        titleWarning.textContent = "⚠ Please enter a title before adding a book.";
        titleInput.classList.add("input-error");
        return;
    }

    titleInput.classList.remove("input-error");

    const duplicateTitle = books.some(existing =>
        existing.title.toLowerCase() === title.toLowerCase() &&
        (existing.author || "Unknown").toLowerCase() === author.toLowerCase()
    );

    if(duplicateTitle){
        showToast("⚠️ This book already exists in your library.");
        return;
    }

    const coverURL = await getBookCover({ title, author });

    try {
        const response = await apiFetch("/books", {
            method: "POST",
            body: JSON.stringify({
                title,
                author: author || "Unknown",
                genre,
                series,
                status,
                rating: String(rating),
                coverUrl: coverURL
            })
        });

        if(!response.ok){
            const data = await response.json();
            showToast(data.error || "Could not add book.");
            return;
        }

        await loadBooks();
        showToast("📚 Book added to your library!");
        clearForm();

    } catch (error) {
        showToast("Could not connect to server.");
    }

});

filterSelect.addEventListener("change", function(){
	
	selectedBookIndex = null;
	renderBooks();
	
});

clearResultsBtn.addEventListener("click", () => {
    searchInput.value = "";
    sortSelect.value = "";
    filterSelect.value = "";
    selectedBookIndex = null;
    renderBooks();
});

searchBtn.addEventListener("click", runSearch);

searchInput.addEventListener("keydown", function(event){

    if(event.key === "Enter"){
        runSearch();
    }

});

statusInput.addEventListener("change", function(){

    if(statusInput.value === "to-read"){
        ratingInput.value = "0";
        showToast("⭐ Ratings are only allowed once you've started reading.");
    }

});

genreInput.addEventListener("change", function(){

    if(genreInput.value === "Other"){
        genreOtherInput.style.display = "block";
        genreOtherInput.focus();
    } else {
        genreOtherInput.style.display = "none";
        genreOtherInput.value = "";
    }

});


// ===============================
// HELPER FUNCTIONS
// ===============================

function clearForm() {
    titleInput.value = "";
	authorInput.value = "";
	genreInput.value = "";
	genreOtherInput.value = "";
	genreOtherInput.style.display = "none";
	seriesInput.value = "";
    document.getElementById("statusInput").value = "to-read";
    document.getElementById("ratingInput").value = "0";
	
	addBookBtn.textContent = "Add Book";
	
	document.querySelector(".add-book h2").textContent = "Add a New Book";
	
}

// ===============================
// GOOGLE BOOKS API CONFIG
// ===============================

const GOOGLE_BOOKS_API_KEY = "AIzaSyC2qbVbaTI6fHCjX1pvzG3zGdUQSB0-p5A";

async function getBookCover(book) {

    if (book.coverURL || book.coverUrl) {
        return book.coverURL || book.coverUrl;
    }

    const query = encodeURIComponent(`intitle:${book.title} inauthor:${book.author}`);

    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${GOOGLE_BOOKS_API_KEY}`
        );
        const data = await response.json();

        if (!data.items || data.items.length === 0) return null;

        const match = data.items[0];
        const volumeInfo = match.volumeInfo;

        let cover = null;
        if (volumeInfo.imageLinks && volumeInfo.imageLinks.thumbnail) {
            // Use https instead of http, and request a larger size
            cover = volumeInfo.imageLinks.thumbnail
                .replace("http://", "https://")
                .replace("zoom=1", "zoom=2");
        }

        // Google Books sometimes includes series info in the subtitle
        // or as part of a "seriesInfo" field (less common, but check both)
        if (volumeInfo.seriesInfo && volumeInfo.seriesInfo.bookDisplayNumber) {
            book.detectedSeries = volumeInfo.seriesInfo.volumeSeries?.[0]?.seriesId || null;
        }

        return cover;

    } catch (error) {
        console.log("Cover lookup failed:", error);
    }

    return null;
}

function runSearch(){
    selectedBookIndex = null;
    renderBooks();

    document.querySelector(".library")?.scrollIntoView({
        behavior: "smooth"
    });
}


// ===============================
// RENDER BOOKS && BOOKSHELF
// ===============================

function renderBooks() {

    const bookList = document.getElementById("bookList");
    bookList.innerHTML = "";

    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedFilter = filterSelect.value;
    const selectedSort = sortSelect.value;

    const isSearching = searchTerm.length > 0;
	
	const isFiltering = selectedFilter !== "";
	const isSorting = selectedSort !== "";
	const showResultsMode = isSearching || isFiltering || isSorting;

    let filteredBooks = books;

	if(isSearching){
		filteredBooks = filteredBooks.filter(book =>
			book.title.toLowerCase().includes(searchTerm) ||
			(book.author && book.author.toLowerCase().includes(searchTerm)) ||
			(book.series && book.series.toLowerCase().includes(searchTerm))
		);
	}

	if(selectedFilter){
		filteredBooks = filteredBooks.filter(book =>
			book.status === selectedFilter
		);
	}

    if (selectedSort === "title") {
        filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
    }
	
	if (selectedSort === "author") {

		const getLastName = (name) => {
			if(!name) return "";
			const parts = name.trim().split(" ");
			return parts[parts.length - 1].toLowerCase();
		};

		filteredBooks.sort((a, b) =>
			getLastName(a.author).localeCompare(getLastName(b.author))
		);

	}
	
	if (selectedSort === "genre") {
        filteredBooks.sort((a, b) => (a.genre || "").localeCompare(b.genre || ""));
    }

    if (selectedSort === "rating") {
        filteredBooks.sort((a, b) => b.rating - a.rating);
    }
	
	const status = document.getElementById("libraryStatus");

	let messages = [];

	if(isSearching){
		messages.push(`Search: "${searchTerm}"`);
	}

	if(selectedFilter){
		messages.push(`Filter: ${selectedFilter}`);
	}

	if(selectedSort){
		messages.push(`Sort: ${selectedSort}`);
	}

	if(messages.length > 0){
		status.textContent = `Showing ${filteredBooks.length} book(s) • ` + messages.join(" • ");
	}
	else{
		status.textContent = "";
	}


    if(!showResultsMode){

    if(selectedBookIndex === null){

        bookList.innerHTML = `
            <p style="opacity:0.7; text-align:center; padding:40px;">
            📚 Select a book from the bookshelf above to view its details.
            </p>
        `;

        renderBookshelf();
        renderBookSection("readingBooks", "reading");
		renderBookSection("finishedBooks", "completed");
		renderReadingStats();
        return;
    }

    filteredBooks = [books[selectedBookIndex]];
}


    for(const book of filteredBooks) {

        const originalIndex = books.indexOf(book);

        const card = document.createElement("div");
		card.classList.add("book-card");
		card.id = `book-${originalIndex}`;

        const coverURL = book.coverUrl || book.coverURL || null;

        card.innerHTML = `
            <div class="book-card-content">

            <div class="book-info">

            <h3>
				<span id="title-${originalIndex}">${book.title}</span>
				<button class="edit-icon" onclick="editField(${originalIndex}, 'title')">✏️</button>
			</h3>

            <p>
				<strong>Author:</strong>
				<span id="author-${originalIndex}">${book.author || "Unknown"}</span>
				<button class="edit-icon" onclick="editField(${originalIndex}, 'author')">✏️</button>
			</p>
			
            <p>
				<strong>Genre:</strong>
				<span id="genre-${originalIndex}">${book.genre || "N/A"}</span>
				<button class="edit-icon" onclick="editField(${originalIndex}, 'genre')">✏️</button>
			</p>
			
            <p class="series-row">
			<strong>Series:</strong>

			<span id="series-name-${originalIndex}">
			${book.series || "Standalone"}
			</span>

			<button class="edit-icon"
			onclick="editField(${originalIndex}, 'series')">
			✏️
			</button>
			</p>

			<div class="series-info" id="series-info-${originalIndex}"></div>

            <div class="quick-update-label">Quick Update</div>

			<label>Status:</label>

			<select onchange="changeStatus(${originalIndex}, this.value)">
				<option value="to-read" ${book.status==="to-read"?"selected":""}>To Read</option>
				<option value="reading" ${book.status==="reading"?"selected":""}>Reading</option>
				<option value="completed" ${book.status==="completed"?"selected":""}>Completed</option>
			</select>

            <div class="book-actions">

            <div class="book-rating">
				<strong>Rating:</strong>
				${renderStars(book.rating, originalIndex)}
				${book.status !== "to-read" && book.rating === 0 
					? `<div class="rating-note">Not rated yet</div>` 
					: ""}
				${book.status === "to-read" 
				? `<div class="rating-note">Start reading to rate it.</div>` 
				: ""}
            </div>

            <div class="book-buttons">

				<button class="edit-mode" onclick="saveInlineEdit(${originalIndex})">
				Save
				</button>

				<button class="edit-mode" onclick="cancelInlineEdit(${originalIndex})">
				Cancel
				</button>

				<button onclick="deleteBook(${originalIndex})">
				Delete
				</button>

			</div>

            </div>

            </div>

            <div class="book-cover-container">
			${coverURL ? `
				<img 
					src="${coverURL}"
					class="book-cover"
					alt="Book Cover"
				>
			` : `
				<div class="no-cover">
					📖 No cover found
				</div>
			`}
			</div>

            </div>
        `;

        bookList.appendChild(card);
		renderSeriesInfo(book, originalIndex);

    }
	
    renderBookshelf();
	renderBookSection("readingBooks", "reading");

}

function renderSeriesInfo(book, index){

    if(!book.series || book.series === "Standalone") return;

    const container = document.getElementById(`series-info-${index}`);
	if(!container) return;

    const booksInSeries = books.filter(b => b.series === book.series);

    const completedBooks = booksInSeries.filter(b => 
		b.status === "completed" && b.rating > 0
	);

	let avgRating = 0;

	if(completedBooks.length > 0){
		avgRating =
			completedBooks.reduce((sum, b) => sum + b.rating, 0) /
			completedBooks.length;
	}

    const stars = "★".repeat(Math.round(avgRating));

    container.innerHTML = `
        <div class="series-box">

            <h4>📚 ${book.series} Series</h4>

            <p><strong>Books in your library:</strong> ${booksInSeries.length}</p>
            <p><strong>Average Rating:</strong> ${stars || "No ratings yet"}</p>

            <div class="series-books"></div>

        </div>
    `;

    const shelf = container.querySelector(".series-books");

    booksInSeries.forEach(b => {

        const img = document.createElement("img");

        img.src = (b.coverUrl || b.coverURL) || "https://via.placeholder.com/50x75";
        img.classList.add("series-mini-book");

        img.onclick = () => {

			searchInput.value = "";
			filterSelect.value = "";
			sortSelect.value = "";

			selectedBookIndex = books.indexOf(b);

			renderBooks();

			setTimeout(() => {

				const card = document.querySelector(".book-card");

				if(card){
					card.scrollIntoView({
						behavior: "smooth",
						block: "center"
					});
				}

			}, 150);

		};

        shelf.appendChild(img);

    });

}

function renderBookshelf(){

    const shelf = document.getElementById("bookshelfGrid");
    shelf.innerHTML = "";

    if(books.length === 0){
        shelf.innerHTML = "<p style='opacity:0.6'>No books added yet.</p>";
        return;
    }

    const groups = {
        reading: books.filter(b => b.status === "reading"),
        toRead: books.filter(b => b.status === "to-read"),
        completed: books.filter(b => b.status === "completed")
    };

    function renderSection(title, bookArray){

        if(bookArray.length === 0) return;

        const header = document.createElement("div");
        header.classList.add("bookshelf-section-title");
        header.textContent = title;

        shelf.appendChild(header);

        bookArray.forEach(book => {

            const index = books.indexOf(book);
            let bookElement;

            const coverURL = book.coverUrl || book.coverURL;

            if(coverURL){

                bookElement = document.createElement("img");
                bookElement.src = coverURL;

            }else{

                bookElement = document.createElement("div");
                bookElement.classList.add("bookshelf-book-text");

                bookElement.innerHTML = `
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author || ""}</div>
                `;
            }

            bookElement.classList.add("bookshelf-book");
            bookElement.classList.add(`status-${book.status}`);

            if(selectedBookIndex !== null){

                const selectedSeries = books[selectedBookIndex].series;

                if(book.series === selectedSeries){
                    bookElement.classList.add("series-highlight");
                }

            }

            if(index === selectedBookIndex){
                bookElement.classList.add("selected-book");
            }

            bookElement.onclick = () => {

                searchInput.value = "";
                filterSelect.value = "";
                sortSelect.value = "";

                selectedBookIndex = index;

                renderBooks();

                setTimeout(() => {

                    const card = document.querySelector(".book-card");

                    if(card){
                        card.scrollIntoView({
                            behavior:"smooth",
                            block:"center"
                        });
                    }

                },150);

            };

            bookElement.title = `${book.title}
${book.author || "Unknown Author"}
${book.series ? `Series — ${book.series}` : "Standalone"}`;

            shelf.appendChild(bookElement);

        });

    }

    renderSection("📖 Reading", groups.reading);
    renderSection("📚 To Read", groups.toRead);
    renderSection("✅ Finished", groups.completed);

}

function renderBookSection(containerId, status){

    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const filteredBooks = books.filter(book => book.status === status);

    filteredBooks.forEach(book => {

        const index = books.indexOf(book);
        const coverURL = book.coverUrl || book.coverURL;

        const item = document.createElement("div");
        item.classList.add("reading-book");

        if(coverURL){

            item.innerHTML = `
                <img src="${coverURL}" class="reading-cover">

                <div class="reading-text">
                    <div class="reading-title">${book.title}</div>
                    <div class="reading-author">${book.author || ""}</div>
                </div>
            `;

        } else {

            item.innerHTML = `
                <div class="bookshelf-book-text">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author || ""}</div>
                </div>

                <div class="reading-text">
                    <div class="reading-title">${book.title}</div>
                    <div class="reading-author">${book.author || ""}</div>
                </div>
            `;
        }

        item.onclick = () => {

            selectedBookIndex = index;

            renderBooks();

            setTimeout(() => {

                const card = document.querySelector(".book-card");

                if(card){
                    card.scrollIntoView({
                        behavior:"smooth",
                        block:"center"
                    });
                }

            },150);

        };

        container.appendChild(item);

    });

}

function renderReadingStats(){

    const toRead = books.filter(b => b.status === "to-read").length;
    const reading = books.filter(b => b.status === "reading").length;
    const finished = books.filter(b => b.status === "completed").length;

    document.getElementById("toReadCount").textContent = toRead;
    document.getElementById("readingCount").textContent = reading;
    document.getElementById("finishedCount").textContent = finished;

}


// ===============================
// ACTION FUNCTIONS
// ===============================

function deleteBook(index){

    bookToDeleteIndex = index;

    deleteModal.style.display = "flex";

}

async function changeStatus(index, newStatus) {

    const book = books[index];

    try {
        const response = await apiFetch(`/books/${book.id}`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus })
        });

        if(!response.ok){
            showToast("Could not update status.");
            return;
        }

        const updated = await response.json();
        books[index] = updated;

        if(newStatus === "completed"){
            celebrateCompletion();
        }

        renderBooks();
        renderBookSection("readingBooks", "reading");
        renderBookSection("finishedBooks", "completed");
        renderReadingStats();

    } catch (error) {
        showToast("Could not connect to server.");
    }
}

async function setRating(index, rating){

    const book = books[index];
    const newRating = book.rating === rating ? 0 : rating;

    try {
        const response = await apiFetch(`/books/${book.id}`, {
            method: "PUT",
            body: JSON.stringify({ rating: String(newRating) })
        });

        if(!response.ok){
            showToast("Could not update rating.");
            return;
        }

        const updated = await response.json();
        books[index] = updated;
        renderBooks();

    } catch (error) {
        showToast("Could not connect to server.");
    }
}

function showToast(message){

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(()=>{
        toast.classList.remove("show");
    },2500);

}

function showUndoToast(){

    const toast = document.getElementById("toast");

    toast.innerHTML = `
		🗑️ Book deleted 
		<button onclick="undoDelete()">Undo</button>
	`;

    toast.classList.add("show");

    clearTimeout(undoTimer);

    undoTimer = setTimeout(()=>{
        toast.classList.remove("show");
        recentlyDeletedBook = null;
        recentlyDeletedIndex = null;
    },5000);

}

async function undoDelete(){

    if(recentlyDeletedBook !== null){

        try {
            const response = await apiFetch("/books", {
                method: "POST",
                body: JSON.stringify({
                    title: recentlyDeletedBook.title,
                    author: recentlyDeletedBook.author,
                    genre: recentlyDeletedBook.genre,
                    series: recentlyDeletedBook.series,
                    status: recentlyDeletedBook.status,
                    rating: String(recentlyDeletedBook.rating),
                    coverUrl: recentlyDeletedBook.coverUrl
                })
            });

            if(response.ok){
                await loadBooks();
                selectedBookIndex = books.length - 1;
                renderBooks();
            }

        } catch (error) {
            showToast("Could not restore book.");
        }
    }

    const toast = document.getElementById("toast");
    toast.classList.remove("show");

    clearTimeout(undoTimer);

    recentlyDeletedBook = null;
    recentlyDeletedIndex = null;

}

function editField(index, field){

    const span = document.getElementById(`${field === "series" ? "series-name" : field}-${index}`);
    const row = span.parentElement;
    const editBtn = row.querySelector(".edit-icon");

    if(editBtn){
        editBtn.style.display = "none";
    }

    const currentValue = span.textContent;

    span.dataset.original = currentValue;

    span.innerHTML = `
        <input id="input-${field}-${index}" value="${currentValue}">
        <button class="confirm-btn" onclick="saveField(${index}, '${field}')">✓</button>
        <button class="cancel-btn" onclick="cancelField(${index}, '${field}')">✖</button>
    `;

    if(field === "series"){
        const info = document.getElementById(`series-info-${index}`);
        if(info) info.style.display = "none";
    }
}

async function saveField(index, field){

    const input = document.getElementById(`input-${field}-${index}`);
    const value = input.value.trim();

    if(field === "title" && value === ""){
        showToast("Title cannot be empty.");
        return;
    }

    const book = books[index];

    try {
        const response = await apiFetch(`/books/${book.id}`, {
            method: "PUT",
            body: JSON.stringify({ [field]: value })
        });

        if(!response.ok){
            showToast("Could not update field.");
            return;
        }

        const updated = await response.json();
        books[index] = updated;

        renderBooks();
        showToast("Field updated.");

    } catch (error) {
        showToast("Could not connect to server.");
    }
}

function cancelField(index, field){
    renderBooks();
}


// ===============================
// STAR RENDERING
// ===============================

function renderStars(rating, index){

    const book = books[index];
    const canRate = book.status !== "to-read";

    let starsHTML = "";

    for(let i = 1; i <= 5; i++){

        starsHTML += `
		<span 
			class="star ${!canRate ? "star-disabled" : ""}"
			data-value="${i}"
			${canRate ? `
				onclick="setRating(${index}, ${i})"
				onmouseover="previewRating(${index}, ${i})"
				onmouseout="restoreRating(${index})"
			` : ""}
		>
		${i <= rating ? "★" : "☆"}
		</span>
		`;
    }

    return starsHTML;
}

function previewRating(index, rating){

    const stars = document.querySelectorAll(`#book-${index} .star`);

    stars.forEach((star,i)=>{
        star.textContent = i < rating ? "★" : "☆";
    });

}

function restoreRating(index){

    const book = books[index];
    const stars = document.querySelectorAll(`#book-${index} .star`);

    stars.forEach((star,i)=>{
        star.textContent = i < book.rating ? "★" : "☆";
    });

}


// ===============================
// MODAL FUNCTION
// ===============================

confirmDeleteBtn.onclick = async function(){

    if(bookToDeleteIndex !== null){

        const book = books[bookToDeleteIndex];

        recentlyDeletedBook = book;
        recentlyDeletedIndex = bookToDeleteIndex;

        try {
            const response = await apiFetch(`/books/${book.id}`, {
                method: "DELETE"
            });

            if(!response.ok){
                showToast("Could not delete book.");
                deleteModal.style.display = "none";
                return;
            }

            if(selectedBookIndex === bookToDeleteIndex){
                selectedBookIndex = null;
            }

            if(selectedBookIndex > bookToDeleteIndex){
                selectedBookIndex--;
            }

            await loadBooks();

            showUndoToast();

            bookToDeleteIndex = null;

        } catch (error) {
            showToast("Could not connect to server.");
        }
    }

    deleteModal.style.display = "none";
}

cancelDeleteBtn.onclick = function(){
    deleteModal.style.display = "none";
}


// ===============================
// BACK TO TOP BUTTON
// ===============================

const backToTopBtn = document.getElementById("backToTop");

window.addEventListener("scroll", function(){

    if(window.scrollY > 300){
        backToTopBtn.style.display = "block";
    }
    else{
        backToTopBtn.style.display = "none";
    }

});

backToTopBtn.onclick = function(){

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

};


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

document.addEventListener("DOMContentLoaded", function(){

    if(isLoggedIn()){
        showMainApp();
    } else {
        showAuthScreen();
    }

});