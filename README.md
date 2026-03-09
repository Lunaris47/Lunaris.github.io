# Human-Computer Interaction Project -- Jesse Sciamanna

# 📚 Cozy Book Log

A cozy and interactive web application for tracking your personal reading journey.
Users can add books, organize their reading progress, view books on a virtual bookshelf, and manage their library with powerful search and filtering tools.

---

# ✨ Features

### 📖 Add and Manage Books

* Add books with **title, author, genre, and series**
* Edit book information at any time
* Delete books with confirmation and undo functionality
* Automatic book cover retrieval using the **OpenLibrary API**

### 🔍 Search, Sort, and Filter

* Search by:

  * Title
  * Author
  * Series
* Sort books by:

  * Title
  * Author
  * Genre
  * Rating
* Filter books by reading status:

  * To Read
  * Reading
  * Completed

### 📚 Interactive Bookshelf

* Books appear visually on a **virtual bookshelf**
* Clicking a book scrolls directly to its detailed library card
* Hover tooltips display:

  * Title
  * Author
  * Series
* Books are visually categorized by status using colored indicators

### 📊 Reading Progress Tracking

* Dedicated panels for:

  * **Currently Reading**
  * **Finished Reading**
* Reading statistics show totals for:

  * Books to read
  * Books currently reading
  * Books completed

### ⭐ Rating System

* Books can be rated using a **5-star system**
* Ratings are only enabled for **completed books**

### 📱 Mobile Responsive Design

* Layout adapts for smaller screens
* Panels stack vertically on mobile devices
* Bookshelf scales properly for phone displays

### 🔔 User Feedback

* Toast notifications for actions
* Visual highlights when editing books
* Smooth scrolling interactions

---

# 🛠️ Technologies Used

* **HTML5**
* **CSS3**
* **JavaScript (Vanilla JS)**
* **OpenLibrary API** for automatic book cover retrieval
* **LocalStorage** for persistent data storage

---

# 🧠 How It Works

Books are stored locally using the browser's **LocalStorage**, allowing users to keep their reading library saved even after refreshing the page.

When a book is added:

1. The app queries the **OpenLibrary API** for a matching cover image.
2. The book is stored locally with its metadata.
3. The bookshelf and library views update automatically.

---

# 🚀 How to Run the Project

1. Clone the repository

```
git clone https://github.com/Lunaris47/Lunaris.github.io
```

2. Open the project folder

3. Launch `index.html` in your browser

No installation or backend required.

---

# 🧪 Example User Flow

1. Add a new book to your library
2. The book appears on your **bookshelf**
3. Click the book to view its **library card**
4. Update reading status as you progress
5. Once finished, rate the book ⭐

---

# 📸 Screenshots

*(You can add screenshots here for extra credit or portfolio polish)*

Example:

```
/screenshots/bookshelf.png
/screenshots/library.png
```

---

# 📌 Future Improvements

Potential enhancements for future versions:

* Dark mode
* Book notes or reviews
* Goodreads-style reading goals
* Drag-and-drop bookshelf organization
* Cloud database storage
* Import/export book lists

---

# 👨‍💻 Author

Created by **Jesse Sciamanna**

---

# 📄 License

This project is open-source and available under the MIT License.
