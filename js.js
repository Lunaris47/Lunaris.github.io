// ===============================
// DATA (Persistent)
// ===============================

let books = JSON.parse(localStorage.getItem("books")) || [];
let editingIndex = null;
let selectedBookIndex = null;


// ===============================
// DOM ELEMENTS
// ===============================

const addBookBtn = document.getElementById("addBookBtn");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect"); // FIXED
const filterSelect = document.getElementById("filterSelect");
const clearResultsBtn = document.getElementById("clearResults");
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");

let bookToDeleteIndex = null;


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

    // ===============================
    // EDIT EXISTING BOOK
    // ===============================
    if (editingIndex !== null) {

        const updatedIndex = editingIndex;

        books[editingIndex] = book;

        editingIndex = null;
        addBookBtn.textContent = "Add Book";

        saveToStorage();
        renderBooks();

        // Highlight updated card
        setTimeout(() => {
            const cards = document.querySelectorAll(".book-card");
            if (cards[updatedIndex]) {
                cards[updatedIndex].classList.add("book-updated");
            }
        }, 50);

        clearForm();
        return;
    }

    // ===============================
    // ADD NEW BOOK
    // ===============================
    books.push(book);

    saveToStorage();
    renderBooks();
    clearForm();
});

searchInput.addEventListener("input", function(){
	
	if(searchInput.value.length > 0){
		selectedBookIndex = null;
	}
	
	renderBooks();
	
});

sortSelect.addEventListener("change", function(){
	
	selectedBookIndex = null;
	renderBooks();
	
});

filterSelect.addEventListener("change", function(){
	
	selectedBookIndex = null;
	renderBooks();
	
});

clearResultsBtn.addEventListener("click", function(){

    searchInput.value = "";
    sortSelect.value = "";
    filterSelect.value = "";

    selectedBookIndex = null;

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
	
	editingIndex = null;
	addBookBtn.textContent = "Add Book";
	
	document.querySelector(".add-book h2").textContent = "Add a New Book";
}

function saveToStorage() {
    localStorage.setItem("books", JSON.stringify(books));
}

async function getBookCover(book) {

    // If we already have a saved cover, use it
    if (book.coverURL) {
        return book.coverURL;
    }

    const query = encodeURIComponent(`${book.title} ${book.author}`);

    try {
        const response = await fetch(`https://openlibrary.org/search.json?q=${query}`);
        const data = await response.json();

        if (!data.docs || data.docs.length === 0) return null;

        const match = data.docs.find(item =>
            item.title &&
            item.title.toLowerCase().includes(book.title.toLowerCase())
        ) || data.docs[0];

        let cover = null;

        if (match.isbn && match.isbn.length > 0) {
            cover = `https://covers.openlibrary.org/b/isbn/${match.isbn[0]}-M.jpg`;
        }
        else if (match.cover_i) {
            cover = `https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg`;
        }

        // Save cover so we don't fetch again
        book.coverURL = cover;
        saveToStorage();

        return cover;

    } catch (error) {
        console.log("Cover lookup failed:", error);
    }

    return null;
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

    let filteredBooks;

	if(isSearching){

		// SEARCH MODE
		filteredBooks = books.filter(book => {

			const matchesSearch =
				book.title.toLowerCase().includes(searchTerm) ||
				(book.author && book.author.toLowerCase().includes(searchTerm)) ||
				(book.series && book.series.toLowerCase().includes(searchTerm));

			const matchesFilter =
				!selectedFilter || book.status === selectedFilter;

			return matchesSearch && matchesFilter;

		});

	}else{

		// BROWSING MODE
		filteredBooks = books;

	}

    if (selectedSort === "title") {
        filteredBooks.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (selectedSort === "rating") {
        filteredBooks.sort((a, b) => b.rating - a.rating);
    }

    if (selectedSort === "status") {
        filteredBooks.sort((a, b) => a.status.localeCompare(b.status));
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


    // ===============================
    // BROWSING MODE (bookshelf controls)
    // ===============================

    if(!showResultsMode){

		if(selectedBookIndex === null){

			bookList.innerHTML = `
				<p style="opacity:0.7; text-align:center; padding:40px;">
				📚 Select a book from the bookshelf above to view its details.
				</p>
			`;

			renderBookshelf();
			return;
		}

		filteredBooks = [books[selectedBookIndex]];

	}


    // ===============================
    // RENDER BOOK CARDS
    // ===============================

    filteredBooks.forEach(async function (book) {

        const originalIndex = books.indexOf(book);

        const card = document.createElement("div");
        card.classList.add("book-card", "book-added");

        const coverURL = await getBookCover(book);

        card.innerHTML = `
            <div class="book-card-content">

            <div class="book-info">

            <h3>${book.title}</h3>

            <p><strong>Author:</strong> ${book.author || "Unknown"}</p>
            <p><strong>Genre:</strong> ${book.genre || "N/A"}</p>
            <p><strong>Series:</strong> ${book.series || "Standalone"}</p>
			
			<div class="series-info" id="series-${originalIndex}"></div>

            <label>Status:</label>
            <select onchange="changeStatus(${originalIndex}, this.value)">
                <option value="to-read" ${book.status === "to-read" ? "selected" : ""}>To Read</option>
                <option value="reading" ${book.status === "reading" ? "selected" : ""}>Reading</option>
                <option value="completed" ${book.status === "completed" ? "selected" : ""}>Completed</option>
            </select>

            <div class="book-actions">

            <div class="book-rating">
            <strong>Rating:</strong>
            ${renderStars(book.rating, originalIndex)}
            </div>

            <div class="book-buttons">
            <button onclick="editBook(${originalIndex})">Edit</button>
            <button onclick="deleteBook(${originalIndex})">Delete</button>
            </div>

            </div>

            </div>

            <img 
                src="${coverURL || 'https://via.placeholder.com/100x150?text=No+Cover'}"
                class="book-cover"
                alt="Book Cover"
            >

            </div>
        `;

        bookList.appendChild(card);
		renderSeriesInfo(book, originalIndex);

    });
	
    renderBookshelf();

}

function renderSeriesInfo(book, index){

    if(!book.series || book.series === "Standalone") return;

    const container = document.getElementById(`series-${index}`);

    const booksInSeries = books.filter(b => b.series === book.series);

    const avgRating =
        booksInSeries.reduce((sum,b)=>sum+b.rating,0) /
        booksInSeries.length;

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

        img.src = b.coverURL || "https://via.placeholder.com/50x75";
        img.classList.add("series-mini-book");

        img.onclick = () => {
            selectedBookIndex = books.indexOf(b);
            renderBooks();
        };

        shelf.appendChild(img);

    });

}

function renderBookshelf(){

    const shelf = document.getElementById("bookshelfGrid");
    shelf.innerHTML = "";

    books.forEach((book, index) => {

        const img = document.createElement("img");

        img.classList.add("bookshelf-book");

        img.src = book.coverURL || "https://via.placeholder.com/60x90?text=📖";


        // Highlight books in the same series
        if(selectedBookIndex !== null){

            const selectedSeries = books[selectedBookIndex].series;

            if(book.series === selectedSeries){
                img.classList.add("series-highlight");
            }

        }


        // Highlight the selected book
        if(index === selectedBookIndex){
            img.classList.add("selected-book");
        }


        img.onclick = () => {

            selectedBookIndex = index;

            renderBooks();

        };

        shelf.appendChild(img);

    });

}


// ===============================
// ACTION FUNCTIONS
// ===============================

function deleteBook(index){

    bookToDeleteIndex = index;

    deleteModal.style.display = "flex";

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
	
	// Scroll to the Form
	document.querySelector(".add-book").scrollIntoView({
		behavior: "smooth"
	});
	
	// Highlight the form
	const form = document.querySelector(".add-book");
	
	form.classList.add("edit-highlight");
	
	setTimeout(() => {
		form.classList.remove("edit-highlight");
	}, 1200);
	
	document.querySelector(".add-book h2").textContent = "Edit Book";

	showEditToast();
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
// MODAL FUNCTION
// ===============================

confirmDeleteBtn.onclick = function(){

    if(bookToDeleteIndex !== null){

        books.splice(bookToDeleteIndex,1);

        if(selectedBookIndex === bookToDeleteIndex){
            selectedBookIndex = null;
        }

        if(selectedBookIndex > bookToDeleteIndex){
            selectedBookIndex--;
        }

        saveToStorage();
        renderBooks();
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

renderBooks();