let menuData = {};
let currentDate = new Date();
const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const mealTimings = {
    "breakfast": [7, 30, 9, 30],
    "lunch": [12, 0, 14, 0],
    "snacks": [16, 30, 17, 30],
    "dinner": [19, 0, 21, 0]
};

function fetchMenuData() {
    fetch('assets/menus/aug-sept.json')
        .then(response => response.json())
        .then(data => {
            menuData = data;
            loadMenu();
            updateProgressBar();  // Update the progress bar initially
            setInterval(updateProgressBar, 1000); // Update progress bar every second
        })
        .catch(error => console.error("Error loading JSON:", error));
}

function updateDateDisplay() {
    document.getElementById("currentDate").innerText =
        currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getCurrentOrNextMeal() {
    let now = new Date();
    let closestMeal = null;
    let minDiff = Infinity;

    for (let meal in mealTimings) {
        let [startH, startM, endH, endM] = mealTimings[meal];
        let startTime = new Date();
        startTime.setHours(startH, startM, 0);
        let endTime = new Date();
        endTime.setHours(endH, endM, 0);

        // ✅ Meal is currently happening → Show time left
        if (now >= startTime && now <= endTime) {
            return { meal, status: "ongoing", timeLeft: Math.round((endTime - now) / 60000) };
        }

        // ✅ Find the next meal after the current time
        let timeDiff = startTime - now;
        if (timeDiff > 0 && timeDiff < minDiff) {
            minDiff = timeDiff;
            closestMeal = { meal, status: "upcoming", timeLeft: Math.round(minDiff / 60000) };
        }
    }

    // ✅ Special Case: After Dinner (Past 9 PM → Before 12 AM)
    if (now.getHours() >= 21) {
        let nextBreakfast = new Date();
        nextBreakfast.setDate(now.getDate() + 1); // Move to next day
        nextBreakfast.setHours(mealTimings["breakfast"][0], mealTimings["breakfast"][1], 0); // Set to breakfast time

        let timeLeft = Math.round((nextBreakfast - now) / 60000); // Convert to minutes
        return { meal: "breakfast", status: "upcoming", timeLeft };
    }

    return closestMeal || { meal: "breakfast", status: "upcoming", timeLeft: 0 };
}

function formatTime(minutes) {
    let hrs = Math.floor(minutes / 60);
    let mins = minutes % 60;
    return hrs > 0 ? `${hrs} hr ${mins} mins` : `${mins} mins`;
}

function updateProgressBar() {
    let now = new Date();
    let { meal, status, timeLeft } = getCurrentOrNextMeal();
    let progressBar = document.getElementById("progressBar");

    if (status === "ongoing") {
        let [startH, startM, endH, endM] = mealTimings[meal];
        let startTime = new Date();
        startTime.setHours(startH, startM, 0);
        let endTime = new Date();
        endTime.setHours(endH, endM, 0);

        let totalDuration = (endTime - startTime) / 60000;  // Total minutes
        let elapsedTime = totalDuration - timeLeft;
        let progress = (elapsedTime / totalDuration) * 100;

        progressBar.style.width = `${progress}%`;
        progressBar.innerText = `${meal} ends in ${formatTime(timeLeft)}`;

    } else if (status === "upcoming") {
        progressBar.style.width = `100%`;  /* ✅ Always keep text fully visible */
        progressBar.innerText = `Next meal (${meal}) in ${formatTime(timeLeft)}`;
    }
}

function loadMenu(selectedMeal = null) {
    let currentDay = daysOfWeek[currentDate.getDay()];
    let { meal: activeMeal } = getCurrentOrNextMeal();
    activeMeal = selectedMeal || activeMeal;
    let menuTable = document.getElementById("menuTable");
    let extraMessingList = [];

    menuTable.innerHTML = "";
    let mealData = menuData[activeMeal];

    if (mealData) {
        Object.keys(mealData).forEach(type => {
            let item = mealData[type][currentDay] || "Not Available";
            if (type.toLowerCase() === "extra messing") {
                extraMessingList.push(item);
            } else {
                let tr = document.createElement("tr");
                tr.innerHTML = `<td>${type}</td><td>${item}</td>`;
                menuTable.appendChild(tr);
            }
        });
    }

    document.getElementById("extraMessing").innerText = extraMessingList.join(", ") || "Not Available";

    document.querySelectorAll(".btn-outline-dark").forEach(btn => btn.classList.remove("active-tab"));
    document.getElementById(activeMeal.charAt(0).toUpperCase() + activeMeal.slice(1)).classList.add("active-tab");

    updateDateDisplay();
    updateProgressBar();
}

function changeDate(days) {
    currentDate.setDate(currentDate.getDate() + days);
    loadMenu();
}
