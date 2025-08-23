
let menuData = {};
let userDate = new Date(); // This will be corrected below if needed
let userHasInteractedToday = false;
const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const mealTimings = {
    "breakfast": { start: [7, 30], end: [9, 30] },
    "lunch": { start: [12, 0], end: [14, 0] },
    "snacks": { start: [16, 30], end: [17, 30] },
    "dinner": { start: [19, 0], end: [21, 0] }
};

document.addEventListener('DOMContentLoaded', () => {
    const initialState = getCurrentMealState();
    if (!areDatesOnSameDay(new Date(), initialState.targetDate)) {
        userDate = initialState.targetDate;
    }

    fetch('assets/menus/aug-sept.json')
        .then(response => response.json())
        .then(data => {
            menuData = data;

            // --- KEY FIX: Perform the initial load correctly here ---
            // We use initialState.meal but userDate because userDate is now correctly set.
            loadMenu(initialState.meal, userDate);

            // Now, start the interval for live progress bar and meal transitions.
            setInterval(updateLiveState, 1000);
        })
        .catch(error => console.error("Error loading menu data:", error));

    const suggestionForm = document.getElementById('suggestion-form');
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', (e) => handleFormSubmit(e, 'suggestion'));
    }

    const complaintForm = document.getElementById('complaint-form');
    if (complaintForm) {
        complaintForm.addEventListener('submit', (e) => handleFormSubmit(e, 'complaint'));
    }
});

// ===============================================
// ============== HELPER FUNCTIONS ===============
// ===============================================

function areDatesOnSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

function createDate(hours, minutes) {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function getCurrentMealState() {
    const now = new Date();
    for (const meal in mealTimings) {
        const startTime = createDate(...mealTimings[meal].start);
        const endTime = createDate(...mealTimings[meal].end);
        if (now >= startTime && now <= endTime) {
            return { meal, status: "ongoing", timeLeft: (endTime - now), totalDuration: (endTime - startTime), targetDate: now };
        }
    }

    for (const meal of ["breakfast", "lunch", "snacks", "dinner"]) {
        const startTime = createDate(...mealTimings[meal].start);
        if (now < startTime) {
            return { meal, status: "upcoming", timeLeft: (startTime - now), targetDate: now };
        }
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const nextBreakfastTime = createDate(...mealTimings.breakfast.start);
    nextBreakfastTime.setDate(tomorrow.getDate());
    nextBreakfastTime.setMonth(tomorrow.getMonth());
    nextBreakfastTime.setFullYear(tomorrow.getFullYear());
    return { meal: "breakfast", status: "upcoming", timeLeft: (nextBreakfastTime - now), targetDate: tomorrow };
}

function formatTime(ms) {
    const totalMinutes = Math.round(ms / 60000);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

// ===============================================
// ============== UI UPDATE FUNCTIONS ============
// ===============================================

function updateLiveState() {
    const state = getCurrentMealState();
    updateProgressBar(state);

    // --- KEY FIX: This function now only handles live transitions on the CURRENT day ---
    // The initial load is handled separately in DOMContentLoaded.
    if (isToday(userDate) && !userHasInteractedToday) {
        // Check if the displayed tab matches the current live meal
        const activeTab = document.querySelector('.btn-meal.active-tab');
        const activeMeal = activeTab ? activeTab.id.toLowerCase() : null;
        if (activeMeal !== state.meal) {
            loadMenu(state.meal, state.targetDate);
        }
    }
}

function updateProgressBar(state) {
    const { meal, status, timeLeft, totalDuration } = state;
    const indicator = document.getElementById("progressBarIndicator");
    const text = document.getElementById("progressBarText");

    if (status === "ongoing") {
        const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
        indicator.style.width = `${progress}%`;
        text.innerText = `${meal.charAt(0).toUpperCase() + meal.slice(1)} ends in ${formatTime(timeLeft)}`;
    } else {
        indicator.style.width = `0%`;
        text.innerText = `Next: ${meal.charAt(0).toUpperCase() + meal.slice(1)} in ${formatTime(timeLeft)}`;
    }
}

function loadMenu(mealToShow, dateToShow) {
    const currentDay = daysOfWeek[dateToShow.getDay()];
    const menuTable = document.getElementById("menuTable");
    menuTable.innerHTML = "";

    const mealData = menuData[mealToShow];
    let extraMessingItem = "Not Available";

    if (mealData) {
        if (mealData["Meals"] && mealData["Meals"][currentDay]) {
            const items = mealData["Meals"][currentDay].split(',');
            items.forEach(item => {
                if (item.trim()) {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>Meal</td><td>${item.trim()}</td>`;
                    menuTable.appendChild(tr);
                }
            });
        } else {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>Meal</td><td>Not Available</td>`;
            menuTable.appendChild(tr);
        }

        if (mealData["Extra Messing"] && mealData["Extra Messing"][currentDay]) {
            extraMessingItem = mealData["Extra Messing"][currentDay];
        }
    }

    document.getElementById("extraMessing").innerText = extraMessingItem;
    updateDateDisplay(dateToShow);
    updateActiveTab(mealToShow);
}

function updateDateDisplay(date) {
    document.getElementById("currentDate").innerText =
        date.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function updateActiveTab(activeMeal) {
    document.querySelectorAll(".btn-meal").forEach(btn => btn.classList.remove("active-tab"));
    const activeBtn = document.getElementById(activeMeal.charAt(0).toUpperCase() + activeMeal.slice(1));
    if (activeBtn) {
        activeBtn.classList.add("active-tab");
    }
}

// ===============================================
// ============== USER INTERACTIONS ==============
// ===============================================

function loadMenuByUser(selectedMeal) {
    // Set interaction flag only if user is clicking tabs on the actual current day
    if (isToday(userDate)) {
        userHasInteractedToday = true;
    }
    loadMenu(selectedMeal, userDate);
}

function changeDate(days) {
    userDate.setDate(userDate.getDate() + days);
    userHasInteractedToday = false;
    loadMenuByUser('breakfast');
}

function isToday(someDate) {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
}

// ======================================================
// ============== SECURE GEMINI AI FUNCTION ==============
// ======================================================

async function getDietitianSuggestion() {
    const userPromptText = document.getElementById('ai-prompt').value;
    const suggestionBtn = document.getElementById('get-suggestion-btn');
    const responseContainer = document.getElementById('ai-response-container');
    const responseDiv = document.getElementById('ai-response');

    if (!userPromptText) {
        alert("Please enter your goal or requirement.");
        return;
    }

    suggestionBtn.disabled = true;
    suggestionBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
    responseContainer.style.display = 'block';
    responseDiv.innerHTML = 'Thinking... 🧠';

    const activeMealTab = document.querySelector('.btn-meal.active-tab');
    const mealType = activeMealTab ? activeMealTab.innerText.split('\n')[1] : "the current meal";

    let menuItems = Array.from(document.querySelectorAll('#menuTable tr'))
        .map(row => row.cells[1] ? row.cells[1].innerText.trim() : null)
        .filter(Boolean);
    const menuContext = menuItems.join(', ');

    const fullPrompt = `You are an expert AI dietitian for a student mess. Your task is to provide helpful, actionable dietary advice based on the available menu and a student's specific requirement.

**Context:**
- Meal Type: ${mealType}
- Available Menu Items: ${menuContext}
- Student's Requirement: "${userPromptText}"

**Your Instructions:**
1. Analyze the student's requirement and the available menu.
2. Suggest a combination of items from the menu that best fits their goal.
3. Recommend practical portion sizes (e.g., "1 bowl of dal", "2 rotis", "a small portion of rice").
4. Briefly explain *why* your suggestion is suitable for their goal.
5. If the menu is not ideal for their goal, politely explain why and suggest what to look for in future meals.
6. Format your response using clear headings, bold text, and bullet points (markdown). Do not use HTML tags.`;

    try {
        const response = await fetch('/.netlify/functions/get-suggestion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: fullPrompt }),
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        const data = await response.json();
        responseDiv.innerHTML = marked.parse(data.suggestion);

    } catch (error) {
        console.error("API Error:", error);
        responseDiv.innerHTML = `<p class="text-danger">Sorry, I couldn't generate a suggestion right now. Please check the console for errors.</p>`;
    } finally {
        suggestionBtn.disabled = false;
        suggestionBtn.innerText = 'Get Suggestion';
    }
}

// =============================================================
// ============== SECURE W3FORMS SUBMISSION LOGIC ==============
// =============================================================

async function handleFormSubmit(event, formType) {
    event.preventDefault();
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;

    submitButton.disabled = true;
    submitButton.innerHTML = 'Submitting...';

    try {
        const formData = new FormData(form);
        const formObject = Object.fromEntries(formData.entries());
        formObject.formType = formType;

        const response = await fetch('/.netlify/functions/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formObject)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong.');
        }

        submitButton.innerHTML = 'Submitted Successfully!';
        form.reset();
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }, 3000);

    } catch (error) {
        submitButton.innerHTML = 'Submission Failed';
        alert(`Error: ${error.message}`);
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }, 3000);
    }
}