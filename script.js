const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const recipesContainer = document.getElementById("recipesContainer");
const modal = document.getElementById("recipeModal");
const recipeDetails = document.getElementById("recipeDetails");
const closeModal = document.getElementById("closeModal");
const categorySelect = document.getElementById("categorySelect");
const viewFavoritesBtn = document.getElementById("viewFavorites");

// STATE TRACKING
let currentView = "search"; // SEARCH | FAVORITES | CATEGORY
let currentQuery = "";
let currentCategory = "";

// LOCAL STORAGE
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// EVENTS
searchBtn.addEventListener("click", () => {
    currentView = "search";
    currentQuery = searchInput.value.trim();
    searchRecipes();
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        currentView = "search";
        currentQuery = searchInput.value.trim();
        searchRecipes();
    }
});

categorySelect.addEventListener("change", () => {
    currentView = "category";
    currentCategory = categorySelect.value;
    filterByCategory();
});

viewFavoritesBtn.addEventListener("click", () => {
    currentView = "favorites";
    showFavorites();
});

closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
});

window.addEventListener("DOMContentLoaded", loadCategories);

// LOAD CATEGORIES
async function loadCategories() {
    try {
        const res = await fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list");
        const data = await res.json();
        data.meals.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.strCategory;
            option.textContent = cat.strCategory;
            categorySelect.appendChild(option);
        });
    } catch {
        console.log("Failed to load categories");
    }
}

// SEARCH
async function searchRecipes() {
    if (!currentQuery) return alert("Enter a recipe");
    recipesContainer.innerHTML = "<p>Loading...</p>";
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${currentQuery}`);
        const data = await res.json();
        displayRecipes(data.meals);
    } catch {
        recipesContainer.innerHTML = "<p>Error fetching recipes</p>";
    }
}

// FILTER
async function filterByCategory() {
    if (!currentCategory) return;
    recipesContainer.innerHTML = "<p>Loading...</p>";
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${currentCategory}`);
        const data = await res.json();
        displayRecipes(data.meals);
    } catch {
        recipesContainer.innerHTML = "<p>Error loading category</p>";
    }
}

// DISPLAY
function displayRecipes(meals) {
    recipesContainer.innerHTML = ""; 
    if (!meals || meals.length === 0) {
        recipesContainer.innerHTML = "<p>No recipes Found</p>";
        return;
    }

    meals.forEach(meal => {
        const isFav = favorites.some(f => f.idMeal === meal.idMeal);
        const div = document.createElement("div");
        div.classList.add("recipe");
        div.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <h3>${meal.strMeal}</h3>
            <button class="fav-btn" data-id="${meal.idMeal}">${isFav ? "💔 Remove" : "❤️ Favorite"}</button>
            <a href="#recipeDetails"class="btn">View Recipes</a>
        `;
       
        recipesContainer.appendChild(div);
        div.addEventListener("click", () => getRecipeDetails(meal.idMeal));
    });
    attachEventListeners();
}

// ATTACH BUTTON EVENTS
function attachEventListeners() {
    document.querySelectorAll(".fav-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent the div click event
            toggleFavorite(btn.dataset.id);
        });
    });
}

// DETAILS
async function getRecipeDetails(id) {
    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        showRecipeModal(data.meals[0]);
    } catch {
        alert("Failed to load details");
    }
}

// MODAL
function showRecipeModal(meal) {
    let ingredients = "";
    for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`]) {
            ingredients += `<li>${meal[`strIngredient${i}`]} - ${meal[`strMeasure${i}`]}</li>`;
        }
    }
    recipeDetails.innerHTML = `
        <h2>${meal.strMeal}</h2>
        <img src="${meal.strMealThumb}" width="200">
        <h3>Ingredients</h3>
        <ul>${ingredients}</ul>
        <h3>Instructions</h3>
        <p>${meal.strInstructions}</p>
    `;
    modal.classList.remove("hidden");
}

// FAVORITES
function toggleFavorite(id) {
    const index = favorites.findIndex(f => f.idMeal === id);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        const meal = {
            idMeal: id
        };
        favorites.push(meal);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
    refreshCurrentView(); // keeps UI consistent
}

// SHOW FAVORITES
async function showFavorites() {
    if (favorites.length === 0) {
        recipesContainer.innerHTML = "<p>No favorites yet</p>";
        return;
    }
    recipesContainer.innerHTML = "<p>Loading...</p>";
    try {
        const meals = [];
        for (let fav of favorites) {
            const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${fav.idMeal}`);
            const data = await res.json();
            meals.push(data.meals[0]);
        }
        displayRecipes(meals);
    } catch {
        recipesContainer.innerHTML = "<p>Error loading favorites</p>";
    }
}

// REFRESH CURRENT VIEW
function refreshCurrentView() {
    if (currentView === "search") {
        searchRecipes();
    } else if (currentView === "category") {
        filterByCategory();
    } else if (currentView === "favorites") {
        showFavorites();
    }
}
