const BOOK_DB = "library_books_v1";
const BORROW_DB = "library_borrowed_v1";

let books = [];
let borrowed = [];
let currentUser = null;

// ✅ FIX: Get table reference for Borrowed List
const claimedTable = document.getElementById("claimedTable");
const searchBtn = document.getElementById("searchBtn");
const showAllBtn = document.getElementById("showAllBtn");

const users = [
  { username: "admin", password: "1234", role: "admin" },
  { username: "client", password: "1234", role: "client" }
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
  const user = username.value;
  const pass = password.value;

  const found = users.find(u => u.username === user && u.password === pass);
  if (!found) return alert("Invalid username or password!");

  currentUser = found;

  loginPage.style.display = "none";
  mainWebsite.style.display = "block";

  document.querySelectorAll(".adminOnly").forEach(el =>
    el.style.display = currentUser.role === "admin" ? "inline-block" : "none"
  );

  document.querySelectorAll(".clientOnly").forEach(el =>
    el.style.display = currentUser.role === "client" ? "inline-block" : "none"
  );

  updateClaimedList();
  showSection("home");

  alert(`Welcome ${currentUser.role}!`);
}

function logout() {
  currentUser = null;
  mainWebsite.style.display = "none";
  loginPage.style.display = "block";
  username.value = "";
  password.value = "";
  alert("You have logged out.");
}

function showSection(id) {
  document.querySelectorAll(".content-section").forEach(sec =>
    sec.classList.remove("active")
  );
  document.getElementById(id).classList.add("active");

  if (id === "search") showAllBooks();
}

function addBook() {
  const id = bookId.value.trim();
  const title = bookTitle.value.trim();
  const author = bookAuthor.value.trim();
  const msg = addBookMsg;

  if (id && title && author) {
    books.push({
      id,
      title,
      author,
      category: "-",
      status: "Available"
    });

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

  const foundBook = books.find(book => book.id.toLowerCase() === idInput.toLowerCase());

  if (!foundBook) {
    msg.textContent = "❌ Book not found.";
    msg.style.color = "red";
    return;
  }

  if (borrowed.some(b => b.bookid === foundBook.id && b.status !== "Returned")) {
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
    dateReturned: "-",
    status: "Borrowed"
  });

  foundBook.status = "Borrowed";

  saveDB();

  msg.textContent = "✅ Book borrowed successfully!";
  msg.style.color = "lightgreen";

  borrowBookId.value = clientName.value = studentId.value =
    contactNumber.value = borrowCategory.value = "";

  updateClaimedList();
  showAllBooks();
}

function returnBook() {
  const bookIdInput = returnBookId.value.trim();
  const msg = returnMsg;

  if (!bookIdInput) {
    msg.textContent = "⚠️ Enter a Book ID.";
    msg.style.color = "orange";
    return;
  }

  const borrowIndex = borrowed.findIndex(
    b => b.bookid.toLowerCase() === bookIdInput.toLowerCase()
  );

  if (borrowIndex === -1) {
    msg.textContent = "❌ Book not found in borrowed records.";
    msg.style.color = "red";
    return;
  }

  borrowed[borrowIndex].status = "Returned";
  borrowed[borrowIndex].dateReturned = new Date().toLocaleString();

  const book = books.find(b => b.id.toLowerCase() === bookIdInput.toLowerCase());
  if (book) book.status = "Available";

  saveDB();

  msg.textContent = "✅ Book returned successfully!";
  msg.style.color = "lightgreen";
  returnBookId.value = "";

  updateClaimedList();
  showAllBooks();
}

function updateClaimedList() {
  claimedTable.innerHTML = `
    <tr>
      <th>Book ID</th>
      <th>Title</th>
      <th>Borrower</th>
      <th>Student ID</th>
      <th>Contact</th>
      <th>Category</th>
      <th>Date Borrowed</th>
      <th>Date Returned</th>
      <th>Status</th>
    </tr>
  `;

  borrowed.forEach(b => {
    claimedTable.innerHTML += `
      <tr>
        <td>${b.bookid}</td>
        <td>${b.title}</td>
        <td>${b.borrower}</td>
        <td>${b.studentId}</td>
        <td>${b.contact}</td>
        <td>${b.category}</td>
        <td>${b.dateBorrowed}</td>
        <td>${b.dateReturned}</td>
        <td>${b.status}</td>
      </tr>
    `;
  });
}

function searchBook() {
  const query = searchInput.value.trim().toLowerCase();
  const tableBody = document.getElementById("searchTableBody");

  tableBody.innerHTML = "";

  const availableBooks = books.filter(b => b.status === "Available");

  const results = availableBooks.filter(book =>
    book.id.toLowerCase().includes(query) ||
    book.title.toLowerCase().includes(query) ||
    book.category.toLowerCase().includes(query)
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
      <td>${book.category}</td>
      <td style="color:green;font-weight:bold;">Available</td>
    `;
    tableBody.appendChild(row);
  });
}

function showAllBooks() {
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
      <td>${book.category}</td>
      <td style="color:green;font-weight:bold;">Available</td>
    `;
    tableBody.appendChild(row);
  });
}

searchBtn.addEventListener("click", searchBook);
showAllBtn.addEventListener("click", showAllBooks);

window.addEventListener("load", () => {
  loadDB();
  showAllBooks();
  updateClaimedList();
});
