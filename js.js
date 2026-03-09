// ===============================
// DATA (Persistent)
// ===============================

let books = JSON.parse(localStorage.getItem("books")) || [];
let editingIndex = null;
let selectedBookIndex = null;
let recentlyDeletedBook = null;
let recentlyDeletedIndex = null;
let undoTimer = null;


// ===============================
// DOM ELEMENTS
// ===============================

const cancelEditBtn = document.getElementById("cancelEditBtn");
const addBookBtn = document.getElementById("addBookBtn");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
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

    const title = document.getElementById("titleInput").value.trim();
    const author = document.getElementById("authorInput").value.trim();
    const genre = document.getElementById("genreInput").value;
    const series = document.getElementById("seriesInput").value;
    const status = document.getElementById("statusInput").value;
	let rating = Number(document.getElementById("ratingInput").value);

	// Prevent rating if book is not completed
	if(status !== "completed" && rating > 0){
		showToast("⭐ You can only rate books after marking them as completed.");
		return;
	}

    if(title === ""){
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
    if(editingIndex !== null){

		getBookCover(book).then((cover)=>{

			book.coverURL = cover;

			books[editingIndex] = book;

			const editedIndex = editingIndex;

			selectedBookIndex = editedIndex;   // ⭐ show the edited book in the library

			saveToStorage();
			renderBooks();

			showToast("✏️ Book updated successfully.");

			editingIndex = null;
			addBookBtn.textContent = "Add Book";
			clearForm();

			setTimeout(() => {

				const card = document.querySelector(".book-card");

				if(card){
					card.scrollIntoView({
						behavior: "smooth",
						block: "center"
					});
				}

			}, 150);

		});

		return;
	}

    // ===============================
    // PREVENT DUPLICATE TITLES
    // ===============================
    const duplicateTitle = books.some((existing, index) =>
		index !== editingIndex &&
		existing.title.trim().toLowerCase() === title.toLowerCase()
	);

    if(duplicateTitle){
        showToast("⚠️ This book already exists in your library.");
        return;
    }

    // ===============================
    // FETCH COVER + ADD BOOK
    // ===============================
    getBookCover(book).then((cover)=>{

        const duplicateCover = books.some((existing, index) =>
			index !== editingIndex &&
			existing.coverURL &&
			existing.coverURL === cover
		);

        if(duplicateCover){
            showToast("⚠️ This book already exists in your library.");
            return;
        }

        book.coverURL = cover;

        books.push(book);

        saveToStorage();
        renderBooks();

        showToast("📚 Book added to your library!");

        clearForm();

    });

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

searchBtn.addEventListener("click", runSearch);

searchInput.addEventListener("keydown", function(event){

    if(event.key === "Enter"){
        runSearch();
    }

});

cancelEditBtn.addEventListener("click", function(){

    clearForm();

    editingIndex = null;

    showToast("Edit canceled.");

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
	
	cancelEditBtn.stlye.display = "none";
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

function runSearch(){

    selectedBookIndex = null;

    renderBooks();

    const librarySection = document.querySelector(".library");

    if(librarySection){
        librarySection.scrollIntoView({
            behavior:"smooth"
        });
    }

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
	
	if (selectedSort === "author") {
        filteredBooks.sort((a, b) => (a.author || "").localeCompare(b.author || ""));
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
        renderCurrentlyReading();
		renderFinishedReading();
		renderReadingStats();
        return;
    }

    filteredBooks = [books[selectedBookIndex]];
}


    // ===============================
    // RENDER BOOK CARDS
    // ===============================

    for(const book of filteredBooks) {

        const originalIndex = books.indexOf(book);

        const card = document.createElement("div");
        card.classList.add("book-card", "book-added");

        const coverURL = book.coverURL || null;

        card.innerHTML = `
            <div class="book-card-content">

            <div class="book-info">

            <h3>${book.title}</h3>

            <p><strong>Author:</strong> ${book.author || "Unknown"}</p>
            <p><strong>Genre:</strong> ${book.genre || "N/A"}</p>
            <p><strong>Series:</strong> ${book.series || "Standalone"}</p>
			
			<div class="series-info" id="series-${originalIndex}"></div>

            <div class="quick-update-label">Quick Update</div>

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
				${book.status !== "completed" ? `<div class="rating-note">Finish the book to rate it.</div>` : ""}
            </div>

            <div class="book-buttons">
            <button onclick="editBook(${originalIndex})">Edit</button>
            <button onclick="deleteBook(${originalIndex})">Delete</button>
            </div>

            </div>

            </div>

            ${coverURL ? `
				<img 
					src="${coverURL}"
					class="book-cover"
					alt="Book Cover"
				>
			` : `
				<div class="no-cover">
					📖 No cover found in the OpenLibrary database
				</div>
			`}

            </div>
        `;

        bookList.appendChild(card);
		renderSeriesInfo(book, originalIndex);

    }
	
    renderBookshelf();
	renderCurrentlyReading();

}

function renderSeriesInfo(book, index){

    if(!book.series || book.series === "Standalone") return;

    const container = document.getElementById(`series-${index}`);
	if(!container) return;

    const booksInSeries = books.filter(b => b.series === book.series);

    const completedBooks = booksInSeries.filter(b => b.status === "completed");

	let avgRating = 0;

	if(completedBooks.length > 0){
		avgRating =
			completedBooks.reduce((sum,b)=>sum+b.rating,0) /
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

        img.src = b.coverURL || "https://via.placeholder.com/50x75";
        img.classList.add("series-mini-book");

        img.onclick = () => {

			// Clear search/filter/sort so the clicked book takes priority
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

            if(book.coverURL){

                bookElement = document.createElement("img");
                bookElement.src = book.coverURL;

            }else{

                bookElement = document.createElement("div");
                bookElement.classList.add("bookshelf-book-text");

                bookElement.innerHTML = `
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">${book.author || ""}</div>
                `;

                getBookCover(book).then((cover)=>{
                    if(cover){
                        book.coverURL = cover;
                        saveToStorage();
                    }
                });
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

function renderCurrentlyReading(){

    const container = document.getElementById("readingBooks");
    container.innerHTML = "";

    const readingBooks = books.filter(book => book.status === "reading");

    readingBooks.forEach(book => {

        const index = books.indexOf(book);

        const item = document.createElement("div");
        item.classList.add("reading-book");

        if(book.coverURL){

			item.innerHTML = `
				<img 
					src="${book.coverURL}"
					class="reading-cover"
				>

				<div class="reading-text">
					<div class="reading-title">${book.title}</div>
					<div class="reading-author">${book.author || ""}</div>
				</div>
			`;

		}else{

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
                        behavior: "smooth",
                        block: "center"
                    });
                }

            },150);

        };

        container.appendChild(item);

    });

}

function renderFinishedReading(){

    const container = document.getElementById("finishedBooks");
    container.innerHTML = "";

    const finishedBooks = books.filter(book => book.status === "completed");

    finishedBooks.forEach(book => {

        const index = books.indexOf(book);

        const item = document.createElement("div");
        item.classList.add("reading-book");

        if(book.coverURL){

            item.innerHTML = `
                <img 
                    src="${book.coverURL}"
                    class="reading-cover"
                >

                <div class="reading-text">
                    <div class="reading-title">${book.title}</div>
                    <div class="reading-author">${book.author || ""}</div>
                </div>
            `;

        }else{

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

function changeStatus(index, newStatus) {
    books[index].status = newStatus;
    saveToStorage();

    if (newStatus === "completed") {
        celebrateCompletion();
    }

    renderBooks();
}

function setRating(index, rating){

    // If user clicks the same rating again, remove the rating
    if(books[index].rating === rating){
        books[index].rating = 0;
    }else{
        books[index].rating = rating;
    }

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
	cancelEditBtn.style.display = "inline-block";
	
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

function undoDelete(){

    if(recentlyDeletedBook !== null){

        // Restore the book
        books.splice(recentlyDeletedIndex, 0, recentlyDeletedBook);

        saveToStorage();

        // Select the restored book so the UI updates correctly
        selectedBookIndex = recentlyDeletedIndex;

        renderBooks();
    }

    const toast = document.getElementById("toast");
    toast.classList.remove("show");

    clearTimeout(undoTimer);

    recentlyDeletedBook = null;
    recentlyDeletedIndex = null;

}


// ===============================
// STAR RENDERING
// ===============================

function renderStars(rating, index){

    const book = books[index];
    const isCompleted = book.status === "completed";

    let starsHTML = "";

    for(let i = 1; i <= 5; i++){

        starsHTML += `
        <span 
            class="star ${!isCompleted ? "star-disabled" : ""}"
            data-value="${i}"
            ${isCompleted ? `onclick="setRating(${index}, ${i})"` : ""}
        >
            ${i <= rating ? "★" : "☆"}
        </span>
        `;
    }

    return starsHTML;
}


// ===============================
// MODAL FUNCTION
// ===============================

confirmDeleteBtn.onclick = function(){

    if(bookToDeleteIndex !== null){

        // Store deleted book BEFORE removal
        recentlyDeletedBook = books[bookToDeleteIndex];
        recentlyDeletedIndex = bookToDeleteIndex;

        // Remove book
        books.splice(bookToDeleteIndex, 1);

        if(selectedBookIndex === bookToDeleteIndex){
            selectedBookIndex = null;
        }

        if(selectedBookIndex > bookToDeleteIndex){
            selectedBookIndex--;
        }

        saveToStorage();
        renderBooks();
		
		showUndoToast();
		
		bookToDeleteIndex = null;
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

    renderBooks();
    renderCurrentlyReading();
	renderFinishedReading();
	renderReadingStats();

});