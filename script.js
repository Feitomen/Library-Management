const BOOK_DB = "library_books_v1";
const BORROW_DB = "library_borrowed_v1";

let books = [];
let borrowed = [];
let currentUser = null;

const users = [
  { username: "admin", password: "1234", role: "admin" },
  { username: "client", password: "1234", role: "client" },
];

function saveDB() {
  localStorage.setItem(BOOK_DB, JSON.stringify(books));
  localStorage.setItem(BORROW_DB, JSON.stringify(borrowed));
}

function loadDB() {
  books = JSON.parse(localStorage.getItem(BOOK_DB)) || [];
  borrowed = JSON.parse(localStorage.getItem(BORROW_DB)) || [];
  saveDB();
}

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  const found = users.find(u => u.username === user && u.password === pass);

  if (!found) return alert("Invalid username or password!");

  currentUser = found;
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("mainWebsite").style.display = "block";

  document.querySelectorAll(".adminOnly").forEach(el => {
    el.style.display = currentUser.role === "admin" ? "inline-block" : "none";
  });
  document.querySelectorAll(".clientOnly").forEach(el => {
    el.style.display = currentUser.role === "client" ? "inline-block" : "none";
  });

  updateClaimedList();
  showSection("home");
  alert(`Welcome ${currentUser.role}!`);
}

function logout() {
  currentUser = null;
  document.getElementById("mainWebsite").style.display = "none";
  document.getElementById("loginPage").style.display = "block";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  alert("You have logged out.");
}

function showSection(id) {
  document.querySelectorAll(".content-section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if (id === "search") showAllBooks();
}

function addBook() {
  const id = bookId.value.trim();
  const title = bookTitle.value.trim();
  const author = bookAuthor.value.trim();
  const msg = addBookMsg;

  if (id && title && author) {
    books.push({ id, title, author, category: "-", status: "Available" });
    saveDB();
    msg.innerText = `✅ Book "${title}" added successfully!`;
    bookId.value = bookTitle.value = bookAuthor.value = "";
  } else {
    msg.innerText = "⚠️ Please fill in all fields.";
  }
}

function borrowBook() {
  const idInput = borrowBookId.value.trim();
  const borrowerName = clientName.value.trim();
  const studentIdInput = studentId.value.trim();
  const contactInput = contactNumber.value.trim();
  const categoryInput = borrowCategory.value;
  const msg = borrowMsg;

  if (!idInput || !borrowerName || !studentIdInput || !contactInput || !categoryInput) {
    msg.textContent = "⚠️ Please fill out all fields.";
    msg.style.color = "orange";
    return;
  }

  const books = JSON.parse(localStorage.getItem(BOOK_DB)) || [];
  const borrowed = JSON.parse(localStorage.getItem(BORROW_DB)) || [];

  const foundBook = books.find(book => book.id.toLowerCase() === idInput.toLowerCase());
  if (!foundBook) {
    msg.textContent = "❌ Book not found.";
    msg.style.color = "red";
    return;
  }

  if (borrowed.some(b => b.bookid && b.bookid.toLowerCase() === idInput.toLowerCase() && b.status !== "Returned")) {
    msg.textContent = "⚠️ This book is already borrowed.";
    msg.style.color = "orange";
    return;
  }

  borrowed.push({
    bookid: foundBook.id,
    title: foundBook.title,
    borrower: borrowerName,
    studentId: studentIdInput,
    contact: contactInput,
    category: categoryInput,
    dateBorrowed: new Date().toLocaleString(),
    status: "Borrowed",
  });

  foundBook.status = "Borrowed";

  localStorage.setItem(BOOK_DB, JSON.stringify(books));
  localStorage.setItem(BORROW_DB, JSON.stringify(borrowed));

  msg.textContent = "✅ Book borrowed successfully!";
  msg.style.color = "lightgreen";

  borrowBookId.value = clientName.value = studentId.value = contactNumber.value = "";
  borrowCategory.value = "";

  updateClaimedList();
  showAllBooks();
}

function returnBook() {
  const bookIdInput = document.getElementById("returnBookId").value.trim();
  const msg = document.getElementById("returnMsg");

  if (!bookIdInput) {
    msg.textContent = "⚠️ Enter a Book ID.";
    msg.style.color = "orange";
    return;
  }

  let borrowed = JSON.parse(localStorage.getItem(BORROW_DB)) || [];
  let books = JSON.parse(localStorage.getItem(BOOK_DB)) || [];

  const borrowIndex = borrowed.findIndex(b => (b.bookid || "").toLowerCase() === bookIdInput.toLowerCase());
  if (borrowIndex === -1) {
    msg.textContent = "❌ Book not found in borrowed records.";
    msg.style.color = "red";
    return;
  }

  borrowed[borrowIndex].status = "Returned";
  borrowed[borrowIndex].dateReturned = new Date().toLocaleString();

  const book = books.find(b => (b.id || "").toLowerCase() === bookIdInput.toLowerCase());
  if (book) book.status = "Available";

  localStorage.setItem(BOOK_DB, JSON.stringify(books));
  localStorage.setItem(BORROW_DB, JSON.stringify(borrowed));

  msg.textContent = "✅ Book returned successfully and now available.";
  msg.style.color = "lightgreen";
  document.getElementById("returnBookId").value = "";

  updateClaimedList();
  showAllBooks();
}

function updateClaimedList() {
  const table = claimedTable;
  table.innerHTML = `
    <tr>
      <th>Book ID</th><th>Title</th><th>Borrower</th><th>Student ID</th>
      <th>Contact</th><th>Category</th><th>Date Borrowed</th>
      <th>Date Returned</th><th>Status</th>
    </tr>`;

  const borrowed = JSON.parse(localStorage.getItem(BORROW_DB)) || [];
  borrowed.forEach(b => {
    table.innerHTML += `
      <tr>
        <td>${b.bookid}</td><td>${b.title}</td><td>${b.borrower}</td>
        <td>${b.studentId}</td><td>${b.contact}</td><td>${b.category}</td>
        <td>${b.dateBorrowed}</td><td>${b.dateReturned || "-"}</td><td>${b.status}</td>
      </tr>`;
  });
}

function searchBook() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const tableBody = document.getElementById("searchResultsBody");
  const msgContainer = document.getElementById("searchMsg");
  msgContainer.innerHTML = "";
  tableBody.innerHTML = "";

  const books = JSON.parse(localStorage.getItem(BOOK_DB)) || [];
  const availableBooks = books.filter(b => b.status === "Available");

  if (!query) {
    msgContainer.innerHTML = "<p style='color:orange;'>⚠️ Please enter a keyword.</p>";
    return;
  }

  const results = availableBooks.filter(book =>
    (book.title || "").toLowerCase().includes(query) ||
    (book.id || "").toLowerCase().includes(query) ||
    (book.category || "").toLowerCase().includes(query)
  );

  if (results.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="color:red;">❌ No available books found.</td></tr>`;
    return;
  }

  results.forEach(book => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${book.id}</td>
      <td>${book.title}</td>
      <td>${book.category || "-"}</td>
      <td style="color:green;font-weight:bold;">Available</td>`;
    tableBody.appendChild(row);
  });
}

function showAllBooks() {
  const books = JSON.parse(localStorage.getItem(BOOK_DB)) || [];
  const tableBody = document.getElementById("searchTableBody");
  tableBody.innerHTML = "";

  const availableBooks = books.filter(b => b.status === "Available");

  if (availableBooks.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="color:red;">❌ No available books in the library.</td></tr>`;
    return;
  }

  availableBooks.forEach(book => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${book.id}</td>
      <td>${book.title}</td>
      <td>${book.category || "-"}</td>
      <td style="color:green;font-weight:bold;">Available</td>`;
    tableBody.appendChild(row);
  });
}

window.addEventListener("load", () => {
  loadDB();
  showAllBooks();
});
