
/* =========================================
   1. GET HTML ELEMENTS
========================================= */

const bookForm = document.getElementById("bookForm");
const editId = document.getElementById("editId");

const bookTitle = document.getElementById("bookTitle");
const bookAuthor = document.getElementById("bookAuthor");
const totalPages = document.getElementById("totalPages");
const pagesRead = document.getElementById("pagesRead");
const bookStatus = document.getElementById("bookStatus");

const formMessage = document.getElementById("formMessage");
const savedBooks = document.getElementById("savedBooks");
const bookCount = document.getElementById("bookCount");

const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");

const readingSpeed = document.getElementById("readingSpeed");
const calculateBtn = document.getElementById("calculateBtn");
const calculationResult = document.getElementById("calculationResult");


/* =========================================
   2. LOCAL STORAGE FUNCTIONS
========================================= */

// Retrieve all saved reading records
function getBooks() {
    try {
        const data = JSON.parse(
            localStorage.getItem("readingList") || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error("Storage error:", error);
        return [];
    }
}

// Save reading records to Local Storage
function saveBooks(books) {
    localStorage.setItem(
        "readingList",
        JSON.stringify(books)
    );
}


/* =========================================
   3. DISPLAY FEEDBACK
========================================= */

function showFormMessage(message, type = "") {
    formMessage.textContent = message;
    formMessage.className = "message " + type;
}


/* =========================================
   4. CLEAR INPUT FORM
========================================= */

function clearForm() {
    bookForm.reset();
    editId.value = "";
    pagesRead.value = 0;
    saveBtn.textContent = "Save Book";
}


/* =========================================
   5. VALIDATE BOOK INFORMATION
========================================= */

function validateBook(title, author, total, read, status) {

    // Check required text fields
    if (title === "" || author === "") {
        return "Please enter the book title and author.";
    }

    // Check total pages
    if (!Number.isSafeInteger(total) || total <= 0) {
        return "Total pages must be a positive whole number.";
    }

    // Check pages read
    if (!Number.isSafeInteger(read) || read < 0) {
        return "Pages read must be zero or more.";
    }

    // Pages read cannot exceed total pages
    if (read > total) {
        return "Pages read cannot exceed total pages.";
    }

    // Validate reading status
    if (!["Want to Read", "Reading", "Completed"].includes(status)) {
        return "Please select a valid reading status.";
    }

    // Check status and progress consistency
    if (status === "Completed" && read !== total) {
        return "A completed book must have all pages read.";
    }

    if (status === "Want to Read" && read > 0) {
        return "Choose Reading if you have started the book.";
    }

    if (status === "Reading" && read === total) {
        return "Choose Completed when all pages are read.";
    }

    return "";
}


/* =========================================
   6. CREATE AND UPDATE BOOKS
========================================= */

function handleSaveBook(event) {

    // Prevent page refresh after submitting form
    event.preventDefault();

    const title = bookTitle.value.trim();
    const author = bookAuthor.value.trim();

    const total = Number(totalPages.value);
    const read = Number(pagesRead.value);
    const status = bookStatus.value;

    // Check empty number inputs
    if (totalPages.value === "" || pagesRead.value === "") {
        showFormMessage(
            "Please enter total pages and pages read.",
            "error"
        );
        return;
    }

    // Validate user input
    const errorMessage = validateBook(
        title, author, total, read, status
    );

    if (errorMessage !== "") {
        showFormMessage(errorMessage, "error");
        return;
    }

    let books = getBooks();

    // UPDATE an existing book
    if (editId.value !== "") {

        const index = books.findIndex(
            book => book.id === editId.value
        );

        if (index === -1) {
            showFormMessage(
                "Book record was not found.",
                "error"
            );
            return;
        }

        books[index].title = title;
        books[index].author = author;
        books[index].totalPages = total;
        books[index].pagesRead = read;
        books[index].status = status;

        try {
            saveBooks(books);
        } catch (error) {
            showFormMessage(
                "Unable to save changes.",
                "error"
            );
            return;
        }

        clearForm();
        displaySavedBooks();

        showFormMessage(
            "Book updated successfully.",
            "success"
        );

    } else {

        // CREATE a new book record
        const newBook = {
            id: crypto.randomUUID(),
            title: title,
            author: author,
            totalPages: total,
            pagesRead: read,
            status: status
        };

        books.push(newBook);

        try {
            saveBooks(books);
        } catch (error) {
            showFormMessage(
                "Unable to save the new book.",
                "error"
            );
            return;
        }

        clearForm();
        displaySavedBooks();

        showFormMessage(
            "New book added successfully.",
            "success"
        );
    }
}


/* =========================================
   7. READ AND DISPLAY SAVED BOOKS
========================================= */

function displaySavedBooks() {

    const books = getBooks();

    // Clear the existing book list
    savedBooks.innerHTML = "";

    // Display total number of books
    bookCount.textContent =
        "Total saved books: " + books.length;

    // Handle empty reading list
    if (books.length === 0) {
        savedBooks.textContent =
            "Your reading list is empty. Add your first book.";
        return;
    }

    // Display each saved book
    books.forEach(book => {

        const card = document.createElement("div");
        card.className = "saved-book";

        const title = document.createElement("h3");
        title.textContent = book.title;

        const author = document.createElement("p");
        author.textContent = "Author: " + book.author;

        const status = document.createElement("p");
        status.textContent = "Status: " + book.status;

        const pages = document.createElement("p");
        pages.textContent =
            "Pages Read: " + book.pagesRead +
            " / " + book.totalPages;

        // Calculate progress for valid book records
        const validTotal = Number.isSafeInteger(book.totalPages)
            && book.totalPages > 0;

        const validRead = Number.isSafeInteger(book.pagesRead)
            && book.pagesRead >= 0
            && book.pagesRead <= book.totalPages;

        const progress = validTotal && validRead
            ? (book.pagesRead / book.totalPages) * 100
            : 0;

        const progressText = document.createElement("p");

        progressText.textContent = validTotal && validRead
            ? "Progress: " + progress.toFixed(1) + "%"
            : "Progress: Enter a valid total page count";

        const progressBar = document.createElement("progress");
        progressBar.max = 100;
        progressBar.value = progress;

        // Edit button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editBook(book.id);
        });

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "danger";

        deleteButton.addEventListener("click", () => {
            deleteBook(book.id);
        });

                // Put all the details inside one wrapper (left side)
        const info = document.createElement("div");
        info.className = "saved-book-info";

        info.appendChild(title);
        info.appendChild(author);
        info.appendChild(status);
        info.appendChild(pages);
        info.appendChild(progressText);
        info.appendChild(progressBar);
        info.appendChild(document.createElement("br"));
        info.appendChild(editButton);
        info.appendChild(document.createTextNode(" "));
        info.appendChild(deleteButton);

        // Cover image (right side), or a "No cover" box
        let cover;

        if (Number.isInteger(book.coverId)) {
            cover = document.createElement("img");
            cover.className = "saved-cover";
            cover.src = "https://covers.openlibrary.org/b/id/" +
                book.coverId + "-M.jpg";
            cover.alt = "Cover of " + book.title;
        } else {
            cover = document.createElement("div");
            cover.className = "saved-cover no-cover";
            cover.textContent = "No cover";
        }

        card.appendChild(info);
        card.appendChild(cover);

        savedBooks.appendChild(card);
    });
}


/* =========================================
   8. EDIT AN EXISTING BOOK
========================================= */

function editBook(id) {

    const books = getBooks();

    const book = books.find(item => item.id === id);

    if (!book) {
        showFormMessage("Book not found.", "error");
        return;
    }

    // Fill the form with saved book information
    editId.value = book.id;
    bookTitle.value = book.title;
    bookAuthor.value = book.author;
    totalPages.value = book.totalPages || "";
    pagesRead.value = book.pagesRead;
    bookStatus.value = book.status;

    saveBtn.textContent = "Update Book";

    showFormMessage(
        "Editing book: " + book.title,
        "success"
    );

    // Move to the form at the top of the page
    window.scrollTo(0, 0);
}


/* =========================================
   9. DELETE AN EXISTING BOOK
========================================= */

function deleteBook(id) {

    const books = getBooks();

    const book = books.find(item => item.id === id);

    if (!book) {
        showFormMessage("Book not found.", "error");
        return;
    }

    // Ask user to confirm deletion
    const confirmed = confirm(
        "Are you sure you want to delete " +
        book.title + "?"
    );

    if (!confirmed) {
        return;
    }

    // Remove the selected book
    const updatedBooks = books.filter(
        item => item.id !== id
    );

    try {
        saveBooks(updatedBooks);
    } catch (error) {
        showFormMessage(
            "Unable to delete the book.",
            "error"
        );
        return;
    }

    if (editId.value === id) {
        clearForm();
    }

    displaySavedBooks();

    showFormMessage(
        "Book deleted successfully.",
        "success"
    );
}


/* =========================================
   10. READING PROGRESS CALCULATOR
========================================= */

function calculateProgress() {

    const books = getBooks();

    const speed = Number(readingSpeed.value);

    // Validate reading speed
    if (
        readingSpeed.value === "" ||
        !Number.isSafeInteger(speed) ||
        speed <= 0
    ) {
        calculationResult.textContent =
            "Please enter a valid reading speed.";
        return;
    }

    // Check whether the reading list is empty
    if (books.length === 0) {
        calculationResult.textContent =
            "Add books before calculating progress.";
        return;
    }

    let totalPagesAll = 0;
    let pagesReadAll = 0;
    let invalidBooks = 0;

    // Calculate total pages and pages read
    books.forEach(book => {

        const validTotal = Number.isSafeInteger(book.totalPages)
            && book.totalPages > 0;

        const validRead = Number.isSafeInteger(book.pagesRead)
            && book.pagesRead >= 0
            && book.pagesRead <= book.totalPages;

        if (validTotal && validRead) {
            totalPagesAll += book.totalPages;
            pagesReadAll += book.pagesRead;
        } else {
            invalidBooks++;
        }
    });

    // Prevent calculation when no valid book exists
    if (totalPagesAll === 0) {
        calculationResult.textContent =
            "Please update your books with valid page counts.";
        return;
    }

    // Calculate progress percentage
    const progress =
        (pagesReadAll / totalPagesAll) * 100;

    // Calculate remaining pages
    const remainingPages =
        totalPagesAll - pagesReadAll;

    // Calculate estimated remaining hours
    const remainingHours =
        remainingPages / speed;

    // Display calculation results
    calculationResult.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = "Reading Summary";

    calculationResult.appendChild(heading);

    const results = [
        "Total Pages: " + totalPagesAll + " pages",
        "Pages Read: " + pagesReadAll + " pages",
        "Remaining Pages: " + remainingPages + " pages",
        "Reading Progress: " + progress.toFixed(1) + "%",
        "Estimated Remaining Time: " +
            remainingHours.toFixed(2) + " hours"
    ];

    results.forEach(result => {
        const paragraph = document.createElement("p");
        paragraph.textContent = result;
        calculationResult.appendChild(paragraph);
    });

    if (invalidBooks > 0) {
        const note = document.createElement("p");

        note.textContent =
            invalidBooks +
            " book(s) excluded because page counts are missing or invalid.";

        calculationResult.appendChild(note);
    }
}


/* =========================================
   11. EVENT HANDLERS
========================================= */

// Save or update book when form is submitted
bookForm.addEventListener("submit", handleSaveBook);

// Clear form when button is clicked
cancelBtn.addEventListener("click", () => {
    clearForm();
    showFormMessage("Form cleared.");
});

// Calculate reading progress
calculateBtn.addEventListener("click", calculateProgress);


/* =========================================
   12. LOAD SAVED BOOKS ON PAGE OPEN
========================================= */

displaySavedBooks();
