document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initApp();
    
    // Initialize mobile menu
    initMobileMenu();
});

function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = nav.contains(event.target);
            const isClickOnMenuToggle = menuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnMenuToggle && nav.classList.contains('active')) {
                nav.classList.remove('active');
            }
        });
        
        // Close menu when a link is clicked
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
            });
        });
    }
}

function initApp() {
    // Set default date to today in the form
    if (document.getElementById('workout-date')) {
        document.getElementById('workout-date').valueAsDate = new Date();
    }

    // Load existing workouts
    loadWorkouts();

    // Add event listeners
    if (document.getElementById('workoutForm')) {
        document.getElementById('workoutForm').addEventListener('submit', addWorkout);
    }
    
    // Add event listener for time period selection
    const timePeriodSelectors = document.querySelectorAll('#timePeriod');
    timePeriodSelectors.forEach(selector => {
        if (selector) {
            selector.addEventListener('change', function() {
                updateProgressVisualization();
            });
        }
    });
    
    // Update progress visualization
    updateProgressVisualization();
}

// --- Workout Management Functions ---

function loadWorkouts() {
    // Get workouts from localStorage
    const workouts = getWorkoutsFromStorage();
    
    // Get DOM elements (may not exist on all pages)
    const workoutList = document.getElementById('workoutList');
    const noWorkoutsMessage = document.getElementById('noWorkoutsMessage');
    
    // If we're on the track page with the workout list
    if (workoutList && noWorkoutsMessage) {
        // Clear existing list
        workoutList.innerHTML = '';
        
        // Show/hide appropriate elements based on whether workouts exist
        if (workouts.length === 0) {
            noWorkoutsMessage.style.display = 'block';
            workoutList.style.display = 'none';
        } else {
            noWorkoutsMessage.style.display = 'none';
            workoutList.style.display = 'block';
            
            // Sort workouts by date, most recent first
            workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Render each workout
            workouts.forEach((workout, index) => {
                renderWorkoutItem(workout, index);
            });
        }
    }
}

function addWorkout(event) {
    event.preventDefault();
    
    // Get form values
    const date = document.getElementById('workout-date').value;
    const type = document.getElementById('workout-type').value;
    const duration = parseInt(document.getElementById('workout-duration').value);
    const description = document.getElementById('workout-description').value;
    
    // Create workout object
    const workout = {
        date: date,
        type: type,
        duration: duration,
        description: description,
        id: Date.now() // Use timestamp as unique ID
    };
    
    // Get existing workouts
    const workouts = getWorkoutsFromStorage();
    
    // Add new workout
    workouts.push(workout);
    
    // Save to localStorage
    saveWorkoutsToStorage(workouts);
    
    // Render the new workout
    renderWorkoutItem(workout, workouts.length - 1);
    
    // Reset the form
    document.getElementById('workoutForm').reset();
    document.getElementById('workout-date').valueAsDate = new Date();
    
    // Update the UI
    document.getElementById('noWorkoutsMessage').style.display = 'none';
    document.getElementById('workoutList').style.display = 'block';
    
    // Update progress visualization
    updateProgressVisualization();
}

function deleteWorkout(id) {
    // Get workouts from localStorage
    let workouts = getWorkoutsFromStorage();
    
    // Find the workout with the matching ID
    workouts = workouts.filter(workout => workout.id !== id);
    
    // Save the updated workouts array
    saveWorkoutsToStorage(workouts);
    
    // Reload workouts to update the UI
    loadWorkouts();
    
    // Update progress visualization
    updateProgressVisualization();
}

function renderWorkoutItem(workout, index) {
    const workoutList = document.getElementById('workoutList');
    
    if (!workoutList) return;
    
    // Format the date
    const formattedDate = new Date(workout.date).toLocaleDateString();
    
    // Create workout item
    const workoutItem = document.createElement('li');
    workoutItem.className = 'workout-item';
    workoutItem.innerHTML = `
        <div class="workout-date">${formattedDate}</div>
        <div class="workout-type">${workout.type}</div>
        <div class="workout-duration">${workout.duration} minutes</div>
        <div class="workout-description">${workout.description || 'No description provided.'}</div>
        <button class="delete-btn" onclick="deleteWorkout(${workout.id})">Delete</button>
    `;
    
    // Add to the list
    workoutList.appendChild(workoutItem);
}

// --- Progress Visualization Functions ---

function updateProgressVisualization() {
    const workouts = getWorkoutsFromStorage();
    const noProgressMessage = document.getElementById('noProgressMessage');
    
    // Get all visualization containers
    const progressStats = document.querySelectorAll('.progress-stats');
    const visualizationContainers = document.querySelectorAll('.visualization-container');
    const visualizationControls = document.querySelectorAll('.visualization-controls');
    
    if (workouts.length === 0) {
        // No workouts yet
        if (noProgressMessage) noProgressMessage.style.display = 'block';
        
        // Hide visualizations
        progressStats.forEach(el => { if (el) el.style.display = 'none'; });
        visualizationContainers.forEach(el => { if (el) el.style.display = 'none'; });
        visualizationControls.forEach(el => { if (el) el.style.display = 'none'; });
        
        return;
    }
    
    // We have workouts - show visualizations, hide message
    if (noProgressMessage) noProgressMessage.style.display = 'none';
    
    progressStats.forEach(el => { if (el) el.style.display = 'flex'; });
    visualizationContainers.forEach(el => { if (el) el.style.display = 'block'; });
    visualizationControls.forEach(el => { if (el) el.style.display = 'flex'; });
    
    // Update the stats
    updateStats(workouts);
    
    // Update the chart based on selected time period
    const timePeriodSelectors = document.querySelectorAll('#timePeriod');
    let selectedTimePeriod = 'week'; // Default
    
    // Get the selected time period from any selector on the page
    timePeriodSelectors.forEach(selector => {
        if (selector) {
            selectedTimePeriod = selector.value;
        }
    });
    
    // Sync all selectors to the same value
    timePeriodSelectors.forEach(selector => {
        if (selector && selector.value !== selectedTimePeriod) {
            selector.value = selectedTimePeriod;
        }
    });
    
    // Update the chart with the selected time period
    updateActivityChart(workouts, selectedTimePeriod);
}

function updateStats(workouts) {
    // Calculate total workouts
    const totalWorkouts = workouts.length;
    
    // Calculate total minutes
    const totalMinutes = workouts.reduce((total, workout) => total + workout.duration, 0);
    
    // Calculate average duration
    const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0;
    
    // Update the DOM - handle multiple instances of the stats (home & track page)
    const totalWorkoutsElements = document.querySelectorAll('#totalWorkouts');
    totalWorkoutsElements.forEach(element => {
        if (element) element.textContent = totalWorkouts;
    });
    
    const totalMinutesElements = document.querySelectorAll('#totalMinutes');
    totalMinutesElements.forEach(element => {
        if (element) element.textContent = totalMinutes;
    });
    
    const avgDurationElements = document.querySelectorAll('#avgDuration');
    avgDurationElements.forEach(element => {
        if (element) element.textContent = avgDuration;
    });
}

function updateActivityChart(workouts, timePeriod) {
    const activityChartCanvases = document.querySelectorAll('#activityChart');
    if (!activityChartCanvases.length) return;
    
    // Get chart data based on selected time period
    let chartData;
    let labelFormat;
    
    switch (timePeriod) {
        case 'day':
            chartData = getDailyChartData(workouts);
            labelFormat = 'hh a'; // Format: "10 AM", "2 PM", etc.
            break;
        case 'month':
            chartData = getMonthlyChartData(workouts);
            labelFormat = 'MMM d'; // Format: "Apr 1", "Apr 15", etc.
            break;
        case 'week':
        default:
            chartData = getWeeklyChartData(workouts);
            labelFormat = 'EEE'; // Format: "Mon", "Tue", etc.
            break;
    }
    
    // Create or update the charts on each canvas
    activityChartCanvases.forEach(canvas => {
        // Clear existing chart if there is one
        if (canvas.chart) {
            canvas.chart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        canvas.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Workouts',
                    data: chartData.counts,
                    backgroundColor: 'rgba(0, 116, 217, 0.7)',
                    borderColor: '#0074D9',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0 // Always use integers for workout counts
                        },
                        title: {
                            display: true,
                            text: 'Number of Workouts'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: getTimeAxisLabel(timePeriod)
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                return chartData.tooltipTitles[tooltipItems[0].dataIndex];
                            }
                        }
                    }
                }
            }
        });
    });
}

function getDailyChartData(workouts) {
    // Group workouts by hour of the day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Initialize hours array (0-23)
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const hourCounts = Array(24).fill(0);
    const tooltipTitles = [];
    
    // Generate labels for each hour
    const labels = hours.map(hour => {
        const time = new Date();
        time.setHours(hour, 0, 0, 0);
        return formatTime(time);
    });
    
    // Count workouts for each hour
    workouts.forEach(workout => {
        const workoutDate = new Date(workout.date);
        
        // Check if the workout date is today (ignoring time)
        if (workoutDate.toDateString() === today.toDateString()) {
            // Use workout time if available, or distribute throughout the day
            // For simplicity, we'll just count all workouts towards the current hour
            const hour = new Date().getHours();
            hourCounts[hour]++;
        }
    });
    
    // Create tooltip titles
    hours.forEach(hour => {
        const time = new Date();
        time.setHours(hour, 0, 0, 0);
        tooltipTitles.push(`${formatTime(time)} - ${hourCounts[hour]} workout(s)`);
    });
    
    return {
        labels: labels,
        counts: hourCounts,
        tooltipTitles: tooltipTitles
    };
}

function getWeeklyChartData(workouts) {
    // Get current date and calculate the start of the week (Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Initialize array for each day of the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayCounts = Array(7).fill(0);
    const tooltipTitles = [];
    
    // Count workouts for each day
    workouts.forEach(workout => {
        const workoutDate = new Date(workout.date);
        
        // Check if the workout is in the current week
        if (workoutDate >= startOfWeek && workoutDate <= today) {
            const dayIndex = workoutDate.getDay();
            dayCounts[dayIndex]++;
        }
    });
    
    // Create tooltip titles
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        tooltipTitles.push(`${days[i]}, ${date.toLocaleDateString()} - ${dayCounts[i]} workout(s)`);
    }
    
    return {
        labels: days,
        counts: dayCounts,
        tooltipTitles: tooltipTitles
    };
}

function getMonthlyChartData(workouts) {
    // Get the current date
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Initialize arrays for each day of the month
    const days = [];
    const dayCounts = [];
    const tooltipTitles = [];
    
    // Generate labels and initialize counts for each day
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        days.push(formatDate(date));
        dayCounts.push(0);
    }
    
    // Count workouts for each day
    workouts.forEach(workout => {
        const workoutDate = new Date(workout.date);
        
        // Check if the workout is in the current month
        if (workoutDate.getMonth() === currentMonth && workoutDate.getFullYear() === currentYear) {
            const dayIndex = workoutDate.getDate() - 1; // Adjust for 0-indexed array
            dayCounts[dayIndex]++;
        }
    });
    
    // Create tooltip titles
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        tooltipTitles.push(`${formatDate(date)} - ${dayCounts[day-1]} workout(s)`);
    }
    
    return {
        labels: days,
        counts: dayCounts,
        tooltipTitles: tooltipTitles
    };
}

// --- Helper Functions ---

function formatTime(date) {
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12; // Convert to 12-hour format
    return `${hour12} ${ampm}`;
}

function formatDate(date) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
}

function getTimeAxisLabel(timePeriod) {
    switch (timePeriod) {
        case 'day':
            return 'Hour of the Day';
        case 'month':
            return 'Day of the Month';
        case 'week':
        default:
            return 'Day of the Week';
    }
}

// --- LocalStorage Functions ---

function getWorkoutsFromStorage() {
    const workouts = localStorage.getItem('workouts');
    return workouts ? JSON.parse(workouts) : [];
}

function saveWorkoutsToStorage(workouts) {
    localStorage.setItem('workouts', JSON.stringify(workouts));
}