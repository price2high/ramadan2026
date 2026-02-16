// Combine data parts into one array
let ramadanData = [];
if (typeof ramadanDataPart1 !== 'undefined') {
    ramadanData = ramadanData.concat(ramadanDataPart1);
}
if (typeof ramadanDataPart2 !== 'undefined') {
    ramadanData = ramadanData.concat(ramadanDataPart2);
}

// Prayer Guide Data (Static)
const prayerGuide = {
    suhoor: {
        rakats: "N/A",
        sunnah: "Eat before Fajr",
        dhikr: "Dua for Fasting",
        tip: "A blessed meal."
    },
    fajr: {
        rakats: "2 Sunnah + 2 Fard",
        sunnah: "2 Rakats before Fard",
        dhikr: "SubhanAllah x33, Awal-Waqt",
        tip: "Praying Fajr in congregation puts you in Allah's protection."
    },
    dhuhr: {
        rakats: "4 Sunnah + 4 Fard + 2 Sunnah",
        sunnah: "4 before, 2 after",
        dhikr: "Ayatul Kursi",
        tip: "Do not delay."
    },
    asr: {
        rakats: "4 Sunnah (Optional) + 4 Fard",
        sunnah: "4 before (non-emphasized)",
        dhikr: "Evening Adhkar",
        tip: "The middle prayer."
    },
    maghrib: {
        rakats: "3 Fard + 2 Sunnah",
        sunnah: "2 after",
        dhikr: "Dua after Adhan",
        tip: "Break fast immediately."
    },
    isha: {
        rakats: "4 Sunnah (Optional) + 4 Fard + 2 Sunnah + Witr",
        sunnah: "2 after",
        dhikr: "Surah Al-Mulk",
        tip: "Pray Witr before sleep."
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const calendarGrid = document.getElementById('calendarGrid');
    const dayDetailsSection = document.getElementById('dayDetails');
    const progressBarFill = document.querySelector('.progress-fill');
    const progressText = document.getElementById('progressPercentage');

    // Details Elements
    const currentDaySpan = document.getElementById('currentDay');
    const dayDateEl = document.getElementById('dayDate');
    const themeIconEl = document.getElementById('themeIcon');
    const dayThemeEl = document.getElementById('dayTheme');
    const prayerTimesContainer = document.getElementById('prayerTimes');

    const verseArabic = document.getElementById('verseArabic');
    const verseTranslation = document.getElementById('verseTranslation');
    const verseReference = document.getElementById('verseReference');
    const verseReflection = document.getElementById('verseReflection');

    const duaArabic = document.getElementById('duaArabic');
    const duaTransliteration = document.getElementById('duaTransliteration');
    const duaMeaning = document.getElementById('duaMeaning');

    const actionItemText = document.getElementById('actionItem');
    const markCompleteBtn = document.getElementById('markCompleteBtn');

    const prevDayBtn = document.getElementById('prevDay');
    const nextDayBtn = document.getElementById('nextDay');

    // State
    const startDate = new Date('2026-02-18');
    const today = new Date();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let currentDayIndex = 0;
    let selectedDayIndex = 0;

    if (today < startDate) {
        currentDayIndex = 0;
    } else if (diffDays > 30) {
        currentDayIndex = 29;
    } else {
        currentDayIndex = diffDays - 1;
        if (currentDayIndex < 0) currentDayIndex = 0;
    }

    selectedDayIndex = currentDayIndex;

    // Load saved granular progress
    let ramadanProgress = JSON.parse(localStorage.getItem('ramadanProgress')) || {};

    // Initialize
    init();

    function init() {
        renderCalendarGrid();
        updateProgress();
        loadDayDetails(selectedDayIndex);

        // Attempt to get user location for dynamic prayer times
        initGeolocation();

        // Event Listeners
        markCompleteBtn.addEventListener('click', () => {
            const dayNum = ramadanData[selectedDayIndex].day;
            toggleAllForDay(dayNum);
        });

        prevDayBtn.addEventListener('click', () => {
            if (selectedDayIndex > 0) {
                selectedDayIndex--;
                loadDayDetails(selectedDayIndex);
                scrollToDetails();
            }
        });

        nextDayBtn.addEventListener('click', () => {
            if (selectedDayIndex < ramadanData.length - 1) {
                selectedDayIndex++;
                loadDayDetails(selectedDayIndex);
                scrollToDetails();
            }
        });
    }

    // --- Geolocation & Dynamic Prayer Times ---
    function initGeolocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(updatePrayerTimesData, (error) => {
                console.log("Geolocation denied or error:", error.message);
                // Keep default static data (Forest Park, GA)
            });
        } else {
            console.log("Geolocation not supported.");
        }
    }

    function updatePrayerTimesData(position) {
        if (typeof adhan === 'undefined') {
            console.error("Adhan library not loaded.");
            return;
        }

        const coordinates = new adhan.Coordinates(position.coords.latitude, position.coords.longitude);
        const params = adhan.CalculationMethod.NorthAmerica();
        params.madhab = adhan.Madhab.Shafi; // Standard

        const start = new Date(2026, 1, 18); // Feb 18, 2026

        ramadanData.forEach((day, index) => {
            const date = new Date(start);
            date.setDate(start.getDate() + index);

            const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

            // Suhoor (approx 20 mins before Fajr)
            const suhoorTime = new Date(prayerTimes.fajr);
            suhoorTime.setMinutes(suhoorTime.getMinutes() - 20);

            day.prayerTimes.suhoor = formatTime(suhoorTime);
            day.prayerTimes.fajr = formatTime(prayerTimes.fajr);
            day.prayerTimes.dhuhr = formatTime(prayerTimes.dhuhr);
            day.prayerTimes.asr = formatTime(prayerTimes.asr);
            day.prayerTimes.maghrib = formatTime(prayerTimes.maghrib);
            day.prayerTimes.isha = formatTime(prayerTimes.isha);
        });

        // Update UI with new data
        loadDayDetails(selectedDayIndex);

        // Update Subtitle
        const subtitle = document.querySelector('.subtitle');
        if (subtitle) {
            subtitle.textContent = "February 18 - March 19, 2026 | Local Time";
        }
    }

    function formatTime(date) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    // ------------------------------------------

    function renderCalendarGrid() {
        calendarGrid.innerHTML = '';
        ramadanData.forEach((dayData, index) => {
            const dayCard = document.createElement('div');
            dayCard.classList.add('day-card');

            const dayProgress = ramadanProgress[dayData.day] || {};
            const isDayCompleted = isDayFullyComplete(dayProgress);

            if (isDayCompleted) {
                dayCard.classList.add('completed');
            }

            if (index === currentDayIndex) {
                dayCard.classList.add('current');
            }

            if (index === selectedDayIndex) {
                dayCard.classList.add('active');
            }

            dayCard.innerHTML = `
                <div class="day-number">Day ${dayData.day}</div>
                <div class="day-theme">${dayData.theme}</div>
                ${isDayCompleted ? '<div class="day-card.completed::after"></div>' : ''} 
            `;

            dayCard.addEventListener('click', () => {
                selectedDayIndex = index;
                loadDayDetails(index);
                scrollToDetails();

                document.querySelectorAll('.day-card').forEach(c => c.classList.remove('active'));
                dayCard.classList.add('active');
            });

            calendarGrid.appendChild(dayCard);
        });
    }

    function isDayFullyComplete(dayProgress) {
        const requiredKeys = ['suhoor', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'action'];
        return requiredKeys.every(key => dayProgress[key] === true);
    }

    function loadDayDetails(index) {
        const data = ramadanData[index];
        if (!data) return;

        document.querySelectorAll('.day-card').forEach((c, i) => {
            if (i === index) c.classList.add('active');
            else c.classList.remove('active');
        });

        currentDaySpan.textContent = data.day;
        dayDateEl.textContent = data.date;
        dayThemeEl.textContent = data.theme;

        const dayProgress = ramadanProgress[data.day] || {};

        prayerTimesContainer.innerHTML = `
            ${createDetailedCheckboxItem('Suhoor', data.prayerTimes.suhoor, 'suhoor', data.day, dayProgress.suhoor, prayerGuide.suhoor)}
            ${createDetailedCheckboxItem('Fajr', data.prayerTimes.fajr, 'fajr', data.day, dayProgress.fajr, prayerGuide.fajr)}
            ${createDetailedCheckboxItem('Dhuhr', data.prayerTimes.dhuhr, 'dhuhr', data.day, dayProgress.dhuhr, prayerGuide.dhuhr)}
            ${createDetailedCheckboxItem('Asr', data.prayerTimes.asr, 'asr', data.day, dayProgress.asr, prayerGuide.asr)}
            ${createDetailedCheckboxItem('Maghrib', data.prayerTimes.maghrib, 'maghrib', data.day, dayProgress.maghrib, prayerGuide.maghrib)}
            ${createDetailedCheckboxItem('Isha', data.prayerTimes.isha, 'isha', data.day, dayProgress.isha, prayerGuide.isha)}
        `;

        const checkboxes = prayerTimesContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                toggleItem(data.day, e.target.dataset.key, e.target.checked);
            });
        });

        verseArabic.textContent = data.verse.arabic;
        verseTranslation.textContent = data.verse.translation;
        verseReference.textContent = data.verse.reference;
        verseReflection.textContent = data.verse.reflection;

        duaArabic.textContent = data.dua.arabic;
        duaTransliteration.textContent = data.dua.transliteration;
        duaMeaning.textContent = data.dua.meaning;

        actionItemText.innerHTML = `
            <label class="action-checkbox-container">
                <input type="checkbox" ${dayProgress.action ? 'checked' : ''} data-key="action" data-day="${data.day}">
                <span class="action-text">${data.actionItem}</span>
            </label>
        `;
        const actionCb = actionItemText.querySelector('input');
        if (actionCb) {
            actionCb.addEventListener('change', (e) => {
                toggleItem(data.day, 'action', e.target.checked);
            });
        }

        updateButtonState(data.day);

        prevDayBtn.disabled = (index === 0);
        nextDayBtn.disabled = (index === ramadanData.length - 1);
    }

    // New detailed item creator
    function createDetailedCheckboxItem(name, time, key, day, isChecked, guide) {
        return `
            <div class="prayer-time-item detailed ${isChecked ? 'completed' : ''}">
                <div class="prayer-header">
                    <label class="prayer-checkbox-label">
                        <input type="checkbox" 
                            data-key="${key}" 
                            data-day="${day}" 
                            ${isChecked ? 'checked' : ''}>
                        <span class="custom-checkbox"></span>
                        <div class="prayer-info">
                            <span class="prayer-name">${name}</span>
                            <span class="prayer-time">${time}</span>
                        </div>
                    </label>
                </div>
                <div class="prayer-details">
                    <div class="detail-row">
                        <span class="detail-label">Rakats:</span>
                        <span class="detail-value">${guide.rakats}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Sunnah:</span>
                        <span class="detail-value">${guide.sunnah}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Dhikr:</span>
                        <span class="detail-value">${guide.dhikr}</span>
                    </div>
                    <div class="prayer-tip">${guide.tip}</div>
                </div>
            </div>
        `;
    }

    function toggleItem(day, key, isChecked) {
        if (!ramadanProgress[day]) {
            ramadanProgress[day] = {};
        }
        ramadanProgress[day][key] = isChecked;
        saveProgress();

        if (key !== 'action') {
            const cb = document.querySelector(`input[data-key="${key}"][data-day="${day}"]`);
            if (cb) {
                const itemRow = cb.closest('.prayer-time-item');
                if (isChecked) itemRow.classList.add('completed');
                else itemRow.classList.remove('completed');
            }
        }

        updateProgress();
        renderCalendarGrid();
        updateButtonState(day);
    }

    function toggleAllForDay(dayNum) {
        const dayProgress = ramadanProgress[dayNum] || {};
        const isComplete = isDayFullyComplete(dayProgress);
        const newState = !isComplete;

        if (!ramadanProgress[dayNum]) ramadanProgress[dayNum] = {};
        const keys = ['suhoor', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'action'];
        keys.forEach(k => ramadanProgress[dayNum][k] = newState);

        saveProgress();

        if (ramadanData[selectedDayIndex].day === dayNum) {
            loadDayDetails(selectedDayIndex);
        }

        updateProgress();
        renderCalendarGrid();
    }

    function saveProgress() {
        localStorage.setItem('ramadanProgress', JSON.stringify(ramadanProgress));
    }

    function updateButtonState(dayNum) {
        const dayProgress = ramadanProgress[dayNum] || {};
        if (isDayFullyComplete(dayProgress)) {
            markCompleteBtn.textContent = "Mark Day as Incomplete";
            markCompleteBtn.classList.add('completed');
        } else {
            markCompleteBtn.textContent = "Mark Day as Complete";
            markCompleteBtn.classList.remove('completed');
        }
    }

    function updateProgress() {
        const totalDays = 30;
        const itemsPerDay = 7;
        const totalItems = totalDays * itemsPerDay;

        let completedCount = 0;
        Object.values(ramadanProgress).forEach(day => {
            if (day.suhoor) completedCount++;
            if (day.fajr) completedCount++;
            if (day.dhuhr) completedCount++;
            if (day.asr) completedCount++;
            if (day.maghrib) completedCount++;
            if (day.isha) completedCount++;
            if (day.action) completedCount++;
        });

        const percentage = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

        if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${Math.round(percentage)}% Completed`;
    }

    function scrollToDetails() {
        dayDetailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});
