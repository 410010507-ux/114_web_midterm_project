//localStorage
function saveProfile(profile) {
    localStorage.setItem('fitnessProfile', JSON.stringify(profile));
}

function loadProfile() {
    const data = localStorage.getItem('fitnessProfile');
    return data ? JSON.parse(data) : null;
}

function saveWorkouts(list) {
    localStorage.setItem('workoutLogs', JSON.stringify(list));
}

function loadWorkouts() {
    const data = localStorage.getItem('workoutLogs');
    return data ? JSON.parse(data) : [];
}

//判斷是否為本週
function isInCurrentWeek(dateStr) {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;

    const now = new Date();
    const dayOfWeek = now.getDay() || 7;

    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return d >= monday && d <= sunday;
}

//運動強度對照表
function getMet(intensity) {
    if (intensity === 'low') return 3;
    if (intensity === 'medium') return 5;
    if (intensity === 'high') return 8;
    return 4;
}

//DOM元素
const profileForm = document.querySelector('#profile-form');
const profileResult = document.querySelector('#profile-result');
const profileCard = document.querySelector('#profile-card');
const calcBmiBtn = document.querySelector('#calc-bmi');
const deleteProfileBtn = document.querySelector('#delete-profile');

const workoutForm = document.querySelector('#workout-form');
const workoutList = document.querySelector('#workout-list');

const progressText = document.querySelector('#progress-text');
const progressBar = document.querySelector('#progress-bar');

const toggleThemeBtn = document.querySelector('#toggle-theme');

//深色模式
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleThemeBtn.textContent = '淺色模式';
    } else {
        document.body.classList.remove('dark-mode');
        toggleThemeBtn.textContent = '深色模式';
    }
}

const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);

toggleThemeBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
});

//本地資料
let profile = loadProfile();
let workouts = loadWorkouts();

//個人資料卡
function renderProfileCard() {
    if (!profile) {
        profileCard.innerHTML = '';
        return;
    }

    let genderText = '未設定';
    if (profile.gender === 'male') genderText = '男';
    else if (profile.gender === 'female') genderText = '女';

    profileCard.innerHTML = `
        <div class="card">
        <div class="card-body">
            <h3 class="card-title h5">${profile.name || '未命名使用者'}</h3>
            <p class="card-text mb-1">性別：${genderText}</p>
            <p class="card-text mb-1">年齡：${profile.age}</p>
            <p class="card-text mb-1">身高：${profile.height} cm，體重：${profile.weight} kg</p>
            <p class="card-text mb-1">目標體重：${profile.targetWeight} kg</p>
            <p class="card-text mb-0">每週目標運動時間：${profile.weeklyTargetMinutes} 分鐘</p>
        </div>
        </div>
    `;
}

//儲存個人資料
profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!profileForm.checkValidity()) {
        profileForm.reportValidity();
        return;
    }

    const formData = new FormData(profileForm);

    profile = {
        name: document.querySelector('#name').value.trim(),
        gender: formData.get('gender'),
        age: Number(document.querySelector('#age').value),
        height: Number(document.querySelector('#height').value),
        weight: Number(document.querySelector('#weight').value),
        targetWeight: Number(document.querySelector('#targetWeight').value),
        weeklyTargetMinutes: Number(document.querySelector('#weeklyTarget').value)
    };

    saveProfile(profile);
    renderProfileCard();
    updateProgress();
    alert('個人資料已儲存！');
});

//計算BMI
calcBmiBtn.addEventListener('click', () => {
    if (!profile) {
        profileResult.textContent = '請先填寫並儲存個人資料。';
        return;
    }

    const hMeter = profile.height / 100;
    const bmi = (profile.weight / (hMeter * hMeter)).toFixed(1);
    let level = '';

    if (bmi < 18.5) level = '體重過輕';
    else if (bmi < 24) level = '正常';
    else if (bmi < 27) level = '過重';
    else level = '肥胖';

    const diff = (profile.weight - profile.targetWeight).toFixed(1);

    profileResult.innerHTML = `
        <div class="alert alert-info mt-2">
        <p class="mb-1">BMI：<strong>${bmi}</strong> (${level})</p>
        <p class="mb-0">距離目標體重還 <strong>${diff} kg</strong></p>
        </div>
    `;
});

//刪除個人資料
function clearProfile() {
    if (!profile) {
        alert('目前沒有個人資料可以刪除。');
        return;
    }

    if (!confirm('確定要刪除個人資料嗎？')) return;

    localStorage.removeItem('fitnessProfile');
    profile = null;

    profileCard.innerHTML = '';
    profileResult.innerHTML = '';

    updateProgress();
    profileForm.reset();

    alert('個人資料已刪除。');
}

deleteProfileBtn.addEventListener('click', clearProfile);

//運動紀錄
function renderWorkouts() {
    workoutList.innerHTML = '';
    if (!workouts.length) return;

    workouts.forEach((w) => {
        const col = document.createElement('div');
        col.className = 'col-md-4';

        const card = document.createElement('div');
        card.className = 'card h-100';

        card.innerHTML = `
        <div class="card-body">
            <h3 class="card-title h6">${w.date} - ${w.type}</h3>
            <p class="card-text mb-1">時間：${w.minutes} 分鐘</p>
            <p class="card-text mb-1">預估消耗：${w.calories} kcal</p>
            ${w.note ? `<p class="card-text small text-muted mb-2">${w.note}</p>` : ''}
            <button class="btn btn-sm btn-outline-danger w-100">刪除</button>
        </div>
        `;

        const deleteBtn = card.querySelector('button');
        deleteBtn.addEventListener('click', () => {
        workouts = workouts.filter(item => item.id !== w.id);
        saveWorkouts(workouts);
        renderWorkouts();
        updateProgress();
        });

        col.appendChild(card);
        workoutList.appendChild(col);
    });
}

//新增紀錄
workoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!workoutForm.checkValidity()) {
        workoutForm.reportValidity();
        return;
    }

    if (!profile) {
        alert('請先設定個人資料與體重。');
        return;
    }

    const date = document.querySelector('#workout-date').value;

    
    if (!isInCurrentWeek(date)) {
        alert('這筆運動紀錄不是本週範圍，無法加入。');
        return;
    }

    const type = document.querySelector('#workout-type').value;
    const intensity = document.querySelector('#intensity').value;
    const minutes = Number(document.querySelector('#minutes').value);
    const note = document.querySelector('#note').value.trim();

    const met = getMet(intensity);
    const hours = minutes / 60;
    const calories = Math.round(met * profile.weight * hours);

    const workout = {
        id: Date.now().toString(),
        date,
        type,
        intensity,
        minutes,
        calories,
        note
    };

    workouts.push(workout);
    saveWorkouts(workouts);

    renderWorkouts();
    updateProgress();

    workoutForm.reset();
});

//進度條
function updateProgress() {
    if (!profile) {
        progressText.textContent = '請先設定每週目標運動時間。';
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        return;
    }

    let weeklyMinutes = 0;
    workouts.forEach((w) => {
        if (isInCurrentWeek(w.date)) {
        weeklyMinutes += w.minutes;
        }
    });

    const target = profile.weeklyTargetMinutes || 1;
    let percent = Math.round((weeklyMinutes / target) * 100);
    if (percent > 100) percent = 100;

    const remain = Math.max(target - weeklyMinutes, 0);

    progressText.textContent =
        `本週累計 ${weeklyMinutes} 分鐘，目標 ${target} 分鐘，還差 ${remain} 分鐘。`;

    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
}

renderProfileCard();
renderWorkouts();
updateProgress();
