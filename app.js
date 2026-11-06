
/* =========================================
   1. GET HTML ELEMENTS
========================================= */

const searchType = document.getElementById("searchType");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchMessage = document.getElementById("searchMessage");

const category = document.getElementById("category");
const suggestBtn = document.getElementById("suggestBtn");
const suggestMessage = document.getElementById("suggestMessage");

const bookResults = document.getElementById("bookResults");

// Store the books returned by the latest search
let currentBooks = [];


/* =========================================
   2. DISPLAY FEEDBACK MESSAGES
========================================= */

function showMessage(element, text, type = "") {
    element.textContent = text;
    element.className = "message " + type;
}


/* =========================================
   3. GET BOOKS FROM OPEN LIBRARY API
========================================= */


/* =========================================
   GET DETAILED INFORMATION FOR EACH BOOK
========================================= */

async function getBookDetails(book) {

    // Create a copy of the original book information
    const detailedBook = { ...book };

    // Get the unique Open Library work ID
    const workKey = book.key;

    // Check whether the book has a valid work ID
    if (!/^\/works\/OL\d+W$/.test(workKey || "")) {
        return detailedBook;
    }

    // STEP 1: Retrieve subjects from the work record
    try {
        const response = await fetch(
            "https://openlibrary.org" + workKey + ".json"
        );

        if (response.ok) {
            const data = await response.json();

            // Update subjects if available
            if (Array.isArray(data.subjects) &&
                data.subjects.length > 0) {

                detailedBook.subject = data.subjects;
            }
        }

    } catch (error) {
        console.error("Error loading subjects:", error);
    }

    // STEP 2: Retrieve page counts from book editions
    try {
        const response = await fetch(
            "https://openlibrary.org" +
            workKey + "/editions.json?limit=50"
        );

        if (response.ok) {
            const data = await response.json();

            // Find editions with valid page counts
            const editions = Array.isArray(data.entries)
                ? data.entries
                : [];

            const validEditions = editions.filter(edition =>
                Number.isSafeInteger(edition.number_of_pages) &&
                edition.number_of_pages > 0
            );

            if (validEditions.length > 0) {

                // Prefer the edition matching the search ISBN
                const searchISBNs = [
                    ...(book.isbn || [])
                ];

                const matchingEdition = validEditions.find(edition =>
                    (edition.isbn_13 || []).some(isbn =>
                        searchISBNs.includes(isbn)
                    ) ||
                    (edition.isbn_10 || []).some(isbn =>
                        searchISBNs.includes(isbn)
                    )
                );

                // Use a matching edition or the first available
                const selectedEdition =
                    matchingEdition || validEditions[0];

                detailedBook.number_of_pages_median =
                    selectedEdition.number_of_pages;

                detailedBook.pageEdition =
                    selectedEdition.title ||
                    "Available edition";
            }
        }

    } catch (error) {
        console.error("Error loading pages:", error);
    }

    // Return the updated book information
    return detailedBook;
}



/* =========================================
   SEARCH BOOKS AND RETRIEVE DETAILS
========================================= */

async function fetchBooks(type, keyword) {

    // STEP 1: Prepare the search URL
    const url = new URL(
        "https://openlibrary.org/search.json"
    );

    url.searchParams.set(type, keyword);
    url.searchParams.set("limit", "10");

    // STEP 2: Search for books
    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error("Unable to search for books.");
    }

    // STEP 3: Convert the JSON response
    const data = await response.json();

    if (!data || !Array.isArray(data.docs)) {
        throw new Error("Invalid API response.");
    }

    // STEP 4: Retrieve details for each book
    const detailedBooks = [];

    for (const book of data.docs) {

        const details = await getBookDetails(book);

        detailedBooks.push(details);
    }

    // STEP 5: Return books with additional information
    return detailedBooks;
}


/* =========================================
   4. DISPLAY BOOK SEARCH RESULTS
========================================= */

function displayBooks(books) {

    // Remove previous results
    bookResults.innerHTML = "";

    // Show a message if no books are found
    if (books.length === 0) {
        bookResults.textContent = "No books found.";
        return;
    }

    // Display each book
    books.forEach((book, index) => {

        const card = document.createElement("div");
        card.className = "book-card";

        // Display book cover when available
        if (book.cover_i) {
            const image = document.createElement("img");

            image.src =
                "https://covers.openlibrary.org/b/id/" +
                book.cover_i + "-M.jpg";

            image.alt = "Book cover";

            card.appendChild(image);
        }

        // Extract the five main pieces of API data
        const title = book.title || "Unknown Title";

        const author = Array.isArray(book.author_name)
            ? book.author_name.join(", ")
            : "Unknown Author";

        const year = book.first_publish_year || "Unknown";

        
        // Get book subjects
        const subject = Array.isArray(book.subject) &&
            book.subject.length > 0
            ? book.subject.slice(0, 3).join(", ")
            : "No subjects recorded";

        // Get the available edition's page count
        const pages = Number.isSafeInteger(
            book.number_of_pages_median
        ) && book.number_of_pages_median > 0
            ? book.number_of_pages_median
            : "No page count recorded";


        // Create and display the book details
        const heading = document.createElement("h3");
        heading.textContent = title;

        const authorText = document.createElement("p");
        authorText.textContent = "Author: " + author;

        const yearText = document.createElement("p");
        yearText.textContent = "Published: " + year;

        const subjectText = document.createElement("p");
        subjectText.textContent = "Subjects: " + subject;   

        const pagesText = document.createElement("p");
        pagesText.textContent = "Pages: " + pages;

        if (book.pageEdition) {
            pagesText.title =
                "Page count from edition: " + book.pageEdition;
        }

        // Button to save the selected book
        const addButton = document.createElement("button");
        addButton.textContent = "Add to Reading List";

        addButton.addEventListener("click", () => {
            addBookToList(index);
        });

        card.appendChild(heading);
        card.appendChild(authorText);
        card.appendChild(yearText);
        card.appendChild(subjectText);
        card.appendChild(pagesText);
        card.appendChild(addButton);

        bookResults.appendChild(card);
    });
}


/* =========================================
   5. SEARCH BOOKS
========================================= */

async function searchBooks() {

    const type = searchType.value;
    const keyword = searchInput.value.trim();

    // Validate search input
    if (keyword === "") {
        showMessage(
            searchMessage,
            "Please enter a search keyword.",
            "error"
        );
        return;
    }

    searchBtn.disabled = true;
    currentBooks = [];
    bookResults.textContent = "Loading books...";

    showMessage(searchMessage, "Searching for books...");

    try {

        // Retrieve book information
        const books = await fetchBooks(type, keyword);

        currentBooks = books;

        // Update the HTML results
        displayBooks(books);

        if (books.length === 0) {
            showMessage(
                searchMessage,
                "No books found. Try another keyword.",
                "error"
            );
        } else {
            showMessage(
                searchMessage,
                books.length + " books displayed.",
                "success"
            );
        }

    } catch (error) {

        bookResults.textContent = "Unable to display books.";

        showMessage(
            searchMessage,
            "API request failed. Check your internet connection.",
            "error"
        );

        console.error(error);

    } finally {
        searchBtn.disabled = false;
    }
}


/* =========================================
   6. STUDENT-WRITTEN SUGGESTION LOGIC
========================================= */

async function suggestBooks() {

    const selected = category.value;

    let keyword = "";
    let message = "";

    // Use control statements to determine suggestions
    if (selected === "fantasy") {
        keyword = "fantasy";
        message = "Fantasy books are suitable for readers who enjoy magic and imaginary worlds.";

    } else if (selected === "science") {
        keyword = "science";
        message = "Science books are suitable for readers who enjoy learning about discoveries.";

    } else if (selected === "history") {
        keyword = "history";
        message = "History books are suitable for readers who enjoy learning about the past.";

    } else if (selected === "mystery") {
        keyword = "mystery";
        message = "Mystery books are suitable for readers who enjoy solving puzzles and secrets.";

    } else if (selected === "romance") {
        keyword = "romance";
        message = "Romance books are suitable for readers who enjoy relationship stories.";

    } else {
        showMessage(
            suggestMessage,
            "Please select a category first.",
            "error"
        );
        return;
    }

    suggestBtn.disabled = true;
    currentBooks = [];
    bookResults.textContent = "Loading suggested books...";

    try {

        // Get books related to the selected category
        const books = await fetchBooks("subject", keyword);

        currentBooks = books;
        displayBooks(books);

        if (books.length === 0) {
            showMessage(
                suggestMessage,
                "No suitable suggestions found for this category.",
                "error"
            );
        } else {
            showMessage(suggestMessage, message, "success");

            // Save recommendation information locally
            localStorage.setItem(
                "lastSuggestion",
                JSON.stringify({
                    category: selected,
                    message: message,
                    books: books.map(book => ({
                        title: book.title || "Unknown Title",
                        author: book.author_name?.[0] || "Unknown Author"
                    }))
                })
            );
        }

    } catch (error) {

        bookResults.textContent = "Unable to load suggestions.";

        showMessage(
            suggestMessage,
            "Could not retrieve suggestions. Please try again.",
            "error"
        );

        console.error(error);

    } finally {
        suggestBtn.disabled = false;
    }
}


/* =========================================
   7. SAVE BOOK TO LOCAL STORAGE
========================================= */

function addBookToList(index) {

    const book = currentBooks[index];

    if (!book) {
        showMessage(
            searchMessage,
            "Please search for books again.",
            "error"
        );
        return;
    }

    // Retrieve existing saved books
    let savedBooks = JSON.parse(
        localStorage.getItem("readingList") || "[]"
    );

    // Get information about the selected book
    const title = book.title || "Unknown Title";
    const author = book.author_name?.[0] || "Unknown Author";

    const pages = Number.isInteger(book.number_of_pages_median)
        && book.number_of_pages_median > 0
        ? book.number_of_pages_median
        : 0;

    // Create a new reading record
    const newBook = {
        id: crypto.randomUUID(),
        title: title,
        author: author,
        totalPages: pages,
        pagesRead: 0,
        status: "Want to Read",
        coverId: book.cover_i || null
    };

    // Check for duplicate API book records
    const duplicate = savedBooks.some(
        item => item.title === title &&
                item.author === author
    );

    if (duplicate) {
        showMessage(
            searchMessage,
            "This book is already in your reading list.",
            "error"
        );
        return;
    }

    // Save the new record
    savedBooks.push(newBook);

    localStorage.setItem(
        "readingList",
        JSON.stringify(savedBooks)
    );

    showMessage(
        searchMessage,
        "Book added successfully! Open My Reading List to view it.",
        "success"
    );
}


/* =========================================
   8. EVENT HANDLERS
========================================= */

// Search button
searchBtn.addEventListener("click", searchBooks);

// Suggestion button
suggestBtn.addEventListener("click", suggestBooks);

// Allow Enter key to search
searchInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchBooks();
    }
});
