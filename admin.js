// Firebase configuration and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBaUaNDWEZBxUgXnxMqDxZoXVkz_KbDHWk",
    authDomain: "nothingness-1c905.firebaseapp.com",
    projectId: "nothingness-1c905",
    storageBucket: "nothingness-1c905.appspot.com",
    messagingSenderId: "734772689342",
    appId: "1:734772689342:web:0a49b8d1dda1c99c3c2d8d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin authentication check
onAuthStateChanged(auth, (user) => {
    if (user && user.email === "iamnikithamal@gmail.com") {
        initializeAdmin();
    } else {
        window.location.href = "signin.html";
    }
});

// Initialize admin dashboard
function initializeAdmin() {
    loadStats();
    loadUsers();
    loadArticles();
    setupEventListeners();
    initializeCharts();
}

// Load dashboard statistics
async function loadStats() {
    try {
        const usersCount = await getUsersCount();
        const articlesCount = await getArticlesCount();
        const reportsCount = await getReportsCount();
        const activeUsersCount = await getActiveUsersCount();

        document.getElementById("total-users").textContent = usersCount;
        document.getElementById("total-articles").textContent = articlesCount;
        document.getElementById("total-reports").textContent = reportsCount;
        document.getElementById("active-users").textContent = activeUsersCount;
    } catch (error) {
        console.error("Error loading stats:", error);
        showNotification("Error loading statistics", "error");
    }
}

// Load users table
async function loadUsers() {
    try {
        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(10));
        const snapshot = await getDocs(usersQuery);
        const usersTableBody = document.getElementById("users-table-body");
        usersTableBody.innerHTML = "";

        snapshot.forEach((doc) => {
            const user = doc.data();
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${user.photoURL || 'default-avatar.png'}" class="user-avatar me-3" alt="${user.displayName}">
                        <div>
                            <div class="fw-bold">${user.displayName}</div>
                            <div class="text-muted small">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${new Date(user.createdAt.toDate()).toLocaleDateString()}</td>
                <td>${user.status || 'Active'}</td>
                <td>
                    <button class="action-btn" onclick="banUser('${doc.id}')">
                        <svg><!-- Ban icon --></svg>
                    </button>
                    <button class="action-btn" onclick="deleteUser('${doc.id}')">
                        <svg><!-- Delete icon --></svg>
                    </button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading users:", error);
        showNotification("Error loading users", "error");
    }
}

// Load articles table
async function loadArticles() {
    try {
        const articlesQuery = query(collection(db, "articles"), orderBy("createdAt", "desc"), limit(10));
        const snapshot = await getDocs(articlesQuery);
        const articlesTableBody = document.getElementById("articles-table-body");
        articlesTableBody.innerHTML = "";

        snapshot.forEach((doc) => {
            const article = doc.data();
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <div class="fw-bold">${article.title}</div>
                    <div class="text-muted small">${article.author}</div>
                </td>
                <td>${new Date(article.createdAt.toDate()).toLocaleDateString()}</td>
                <td>${article.status}</td>
                <td>
                    <button class="action-btn" onclick="editArticle('${doc.id}')">
                        <svg><!-- Edit icon --></svg>
                    </button>
                    <button class="action-btn" onclick="deleteArticle('${doc.id}')">
                        <svg><!-- Delete icon --></svg>
                    </button>
                </td>
            `;
            articlesTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading articles:", error);
        showNotification("Error loading articles", "error");
    }
}

// Initialize charts
function initializeCharts() {
    // Users growth chart
    const usersCtx = document.getElementById("users-chart").getContext("2d");
    new Chart(usersCtx, {
        type: "line",
        data: {
            labels: getLastSevenDays(),
            datasets: [{
                label: "New Users",
                data: [65, 59, 80, 81, 56, 55, 40],
                borderColor: "#ff7700",
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(255, 255, 255, 0.1)"
                    },
                    ticks: {
                        color: "rgba(255, 255, 255, 0.7)"
                    }
                },
                x: {
                    grid: {
                        color: "rgba(255, 255, 255, 0.1)"
                    },
                    ticks: {
                        color: "rgba(255, 255, 255, 0.7)"
                    }
                }
            }
        }
    });
}

// User actions
async function banUser(userId) {
    try {
        await updateDoc(doc(db, "users", userId), {
            status: "Banned",
            bannedAt: new Date()
        });
        showNotification("User banned successfully", "success");
        loadUsers();
    } catch (error) {
        console.error("Error banning user:", error);
        showNotification("Error banning user", "error");
    }
}

async function deleteUser(userId) {
    if (confirm("Are you sure you want to delete this user?")) {
        try {
            await deleteDoc(doc(db, "users", userId));
            showNotification("User deleted successfully", "success");
            loadUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            showNotification("Error deleting user", "error");
        }
    }
}

// Article actions
async function deleteArticle(articleId) {
    if (confirm("Are you sure you want to delete this article?")) {
        try {
            await deleteDoc(doc(db, "articles", articleId));
            showNotification("Article deleted successfully", "success");
            loadArticles();
        } catch (error) {
            console.error("Error deleting article:", error);
            showNotification("Error deleting article", "error");
        }
    }
}

// Helper functions
function getLastSevenDays() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString("en-US", { weekday: "short" }));
    }
    return days;
}

function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Event listeners
function setupEventListeners() {
    // Navigation
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            const section = item.getAttribute("data-section");
            showSection(section);
        });
    });

    // Search functionality
    const searchInput = document.querySelector(".search-bar input");
    searchInput.addEventListener("input", debounce(handleSearch, 300));

    // Filter functionality
    const filterDropdown = document.querySelector(".filter-dropdown select");
    filterDropdown.addEventListener("change", handleFilter);
}

function showSection(sectionId) {
    const sections = document.querySelectorAll("section");
    sections.forEach(section => {
        section.style.display = section.id === sectionId ? "block" : "none";
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    const activeSection = document.querySelector("section[style*='display: block']");
    
    if (activeSection.id === "users-section") {
        const usersQuery = query(
            collection(db, "users"),
            where("displayName", ">=", searchTerm),
            where("displayName", "<=", searchTerm + "\uf8ff"),
            limit(10)
        );
        await loadUsers(usersQuery);
    } else if (activeSection.id === "articles-section") {
        const articlesQuery = query(
            collection(db, "articles"),
            where("title", ">=", searchTerm),
            where("title", "<=", searchTerm + "\uf8ff"),
            limit(10)
        );
        await loadArticles(articlesQuery);
    }
}

async function handleFilter(event) {
    const filterValue = event.target.value;
    const activeSection = document.querySelector("section[style*='display: block']");
    
    if (activeSection.id === "users-section") {
        const usersQuery = query(
            collection(db, "users"),
            where("status", "==", filterValue),
            limit(10)
        );
        await loadUsers(usersQuery);
    } else if (activeSection.id === "articles-section") {
        const articlesQuery = query(
            collection(db, "articles"),
            where("status", "==", filterValue),
            limit(10)
        );
        await loadArticles(articlesQuery);
    }
}

// Helper functions for getting counts
async function getUsersCount() {
    try {
        const snapshot = await getDocs(collection(db, "users"));
        return snapshot.size;
    } catch (error) {
        console.error("Error getting users count:", error);
        return 0;
    }
}

async function getArticlesCount() {
    try {
        const snapshot = await getDocs(collection(db, "articles"));
        return snapshot.size;
    } catch (error) {
        console.error("Error getting articles count:", error);
        return 0;
    }
}

async function getReportsCount() {
    try {
        const snapshot = await getDocs(collection(db, "reports"));
        return snapshot.size;
    } catch (error) {
        console.error("Error getting reports count:", error);
        return 0;
    }
}

async function getActiveUsersCount() {
    try {
        const activeUsersQuery = query(
            collection(db, "users"),
            where("status", "==", "Active")
        );
        const snapshot = await getDocs(activeUsersQuery);
        return snapshot.size;
    } catch (error) {
        console.error("Error getting active users count:", error);
        return 0;
    }
}

// Initialize admin dashboard when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user && user.email === "iamnikithamal@gmail.com") {
            initializeAdmin();
        } else {
            window.location.href = "signin.html";
        }
    });
}); 