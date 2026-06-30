# 📚 Book Log — Full-Stack Reading Tracker

A personal book tracking web app with a fully connected backend API. Users can log books, track reading status, rate completed books, and browse their library with cover art fetched automatically from the Google Books API.

**Live Site:** https://lunaris47.github.io/Lunaris.github.io/
**Backend API:** https://github.com/Lunaris47/booklog-api

---

## Features

- **User authentication** — register and log in with JWT-based auth; each user's library is private and persistent
- **Book autocomplete** — real-time title and author suggestions powered by the Google Books API, with cover image auto-fill
- **Genre dropdown** — standardized genre selection with an "Other" fallback for custom entries
- **Reading status tracking** — organize books as To Read, Reading, or Completed
- **Star ratings** — rate books once you've started reading them (1–5 stars)
- **Search, sort, and filter** — find books by title, author, or series; sort by title, author, genre, or rating
- **Series grouping** — books in the same series are grouped with average ratings shown
- **Reading stats** — live count of books by status in the header
- **Bookshelf view** — visual grid of cover art organized by reading status
- **Logout** — session clears on logout; token stored in sessionStorage for security

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Authentication | JWT tokens (issued by backend) |
| Book Data | Google Books API (autocomplete + covers) |
| Backend API | Java + Spring Boot (separate repo) |
| Database | PostgreSQL on Neon (via backend) |
| Hosting | GitHub Pages |

---

## Backend

The frontend connects to a live REST API built with Java and Spring Boot, deployed on Railway. All book data is stored in a cloud PostgreSQL database — nothing is saved in the browser.

→ **Backend repo:** https://github.com/Lunaris47/booklog-api

---

## Author

Jesse Sciamanna — [GitHub](https://github.com/Lunaris47) | [LinkedIn](https://www.linkedin.com/in/JesseSciam)
