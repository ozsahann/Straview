const BASE_URL = (window.location.protocol === 'file:') ? 'http://localhost:8080' : '';

// LocalStorage Mock Database Keys
const DB_TARGETS_KEY = 'strataview_targets';
const DB_TASKS_KEY = 'strataview_tasks';

const defaultTargets = [
    { id: 1, name: "Müşteri Sadakatini Artırma", targetPercentage: 40.0 },
    { id: 2, name: "Çekirdek Altyapı ve Teknik Borç", targetPercentage: 20.0 },
    { id: 3, name: "Kurumsal 5G Yayılımı", targetPercentage: 40.0 }
];

const defaultTasks = [
    { id: 1, title: "Giriş ekranı zaman aşımı hatasını düzelt", storyPoint: 5, strategicTargetId: 1 },
    { id: 2, title: "Veritabanı bağlantı havuzunu (pooling) yeniden yapılandır", storyPoint: 13, strategicTargetId: 2 },
    { id: 3, title: "Spring Boot ve çekirdek kütüphaneleri yükselt", storyPoint: 8, strategicTargetId: 2 },
    { id: 4, title: "Eski bildirim mikro servisini yeniden yaz", storyPoint: 13, strategicTargetId: 2 },
    { id: 5, title: "5G onboarding dokümantasyonunu taslak haline getir", storyPoint: 3, strategicTargetId: 3 },
    { id: 6, title: "API yanıt sürelerini optimize et", storyPoint: 5, strategicTargetId: 1 }
];

function initMockDb() {
    if (!localStorage.getItem(DB_TARGETS_KEY)) {
        localStorage.setItem(DB_TARGETS_KEY, JSON.stringify(defaultTargets));
    }
    if (!localStorage.getItem(DB_TASKS_KEY)) {
        localStorage.setItem(DB_TASKS_KEY, JSON.stringify(defaultTasks));
    }
}

function getMockTargets() {
    initMockDb();
    return JSON.parse(localStorage.getItem(DB_TARGETS_KEY));
}

function saveMockTargets(targets) {
    localStorage.setItem(DB_TARGETS_KEY, JSON.stringify(targets));
}

function getMockTasks() {
    initMockDb();
    return JSON.parse(localStorage.getItem(DB_TASKS_KEY));
}

function saveMockTasks(tasks) {
    localStorage.setItem(DB_TASKS_KEY, JSON.stringify(tasks));
}

function calculateAlignmentLocal() {
    const targets = getMockTargets();
    const tasks = getMockTasks();

    const totalStoryPoints = tasks.reduce((sum, t) => sum + t.storyPoint, 0);

    const targetStatuses = [];
    let totalAbsoluteGap = 0.0;
    let isMisaligned = false;

    targets.forEach(target => {
        const targetStoryPoints = tasks
            .filter(t => t.strategicTargetId === target.id)
            .reduce((sum, t) => sum + t.storyPoint, 0);

        let actualPercentage = 0.0;
        if (totalStoryPoints > 0) {
            actualPercentage = (targetStoryPoints / totalStoryPoints) * 100;
            actualPercentage = Math.round(actualPercentage * 10.0) / 10.0;
        }

        let alignmentGap = target.targetPercentage - actualPercentage;
        alignmentGap = Math.round(alignmentGap * 10.0) / 10.0;

        targetStatuses.push({
            targetId: target.id,
            targetName: target.name,
            targetPercentage: target.targetPercentage,
            actualPercentage: actualPercentage,
            alignmentGap: alignmentGap
        });

        totalAbsoluteGap += Math.abs(alignmentGap);

        if (Math.abs(alignmentGap) > 15.0) {
            isMisaligned = true;
        }
    });

    let alignmentScore = 100;
    if (targetStatuses.length > 0) {
        alignmentScore = Math.round(100.0 - (totalAbsoluteGap / 2.0));
        alignmentScore = Math.max(0, Math.min(100, alignmentScore));
    }

    const status = isMisaligned ? "Misaligned" : "Aligned";

    return {
        alignmentScore: alignmentScore,
        status: status,
        targetStatuses: targetStatuses
    };
}

let localTargets = [];
let localTasks = [];
let currentDashboard = null;
let useBackend = false;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    await checkBackendConnection();
    await loadInitialData();
    setupEventListeners();
}

async function checkBackendConnection() {
    try {
        const res = await fetch(BASE_URL + '/api/targets');
        if (res.ok) {
            useBackend = true;
            console.log("Backend bağlantısı başarılı. Gerçek veritabanı kullanılıyor.");
            const badge = document.getElementById('backend-status-badge');
            if (badge) {
                badge.className = "flex items-center space-x-2 text-xs bg-emerald-950 border border-emerald-800 px-3 py-1.5 rounded-full text-emerald-300";
                badge.innerHTML = `
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Backend Bağlantısı Aktif (H2 Veritabanı)</span>
                `;
            }
        }
    } catch (e) {
        useBackend = false;
        console.log("Backend sunucusuna erişilemedi. Tarayıcı hafızası (LocalStorage) kullanılıyor.");
        const badge = document.getElementById('backend-status-badge');
        if (badge) {
            badge.className = "flex items-center space-x-2 text-xs bg-amber-950 border border-amber-800 px-3 py-1.5 rounded-full text-amber-300";
            badge.innerHTML = `
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Tarayıcı Hafızası Modu (Offline / Vercel)</span>
            `;
        }
    }
}

async function loadInitialData() {
    try {
        if (useBackend) {
            const targetsRes = await fetch(BASE_URL + '/api/targets');
            localTargets = await targetsRes.json();

            const tasksRes = await fetch(BASE_URL + '/api/tasks');
            localTasks = await tasksRes.json();

            const dashRes = await fetch(BASE_URL + '/api/dashboard');
            currentDashboard = await dashRes.json();
        } else {
            localTargets = getMockTargets();
            localTasks = getMockTasks();
            currentDashboard = calculateAlignmentLocal();
        }

        renderDashboard();
        populateTargetSelect();
        renderTasksTable();
        renderSliders();
    } catch (err) {
        console.error("Error loading Strataview data:", err);
        showErrorMessage("Hizalanma verileri yüklenirken bir hata oluştu.");
    }
}

function renderDashboard() {
    if (!currentDashboard) return;

    const scoreEl = document.getElementById('alignment-score');
    const statusEl = document.getElementById('alignment-status');
    const cardEl = document.getElementById('alignment-card');
    const cardBgEl = document.getElementById('alignment-card-bg');
    const warningWrapper = document.getElementById('alignment-warning-wrapper');
    const warningTextEl = document.getElementById('alignment-warning-text');
    const warningIcon = document.getElementById('alignment-warning-icon');
    const totalTasksEl = document.getElementById('total-tasks');
    const totalPointsEl = document.getElementById('total-story-points');

    // Update basic details
    scoreEl.innerText = `${currentDashboard.alignmentScore}%`;
    statusEl.innerText = `Durum: ${currentDashboard.status === 'Aligned' ? 'Uyumlu' : 'Uyumsuz'}`;
    
    const totalTasks = localTasks.length;
    const totalPoints = localTasks.reduce((sum, t) => sum + t.storyPoint, 0);
    totalTasksEl.innerText = `${totalTasks} Aktif`;
    totalPointsEl.innerText = `${totalPoints} Story Point`;

    // Update styles based on alignment status
    if (currentDashboard.status === 'Aligned') {
        // Aligned styling
        scoreEl.className = "font-outfit font-extrabold text-6xl text-emerald-600";
        statusEl.className = "px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200";
        cardEl.className = "bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden";
        cardBgEl.className = "absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-40";
        
        warningWrapper.className = "flex items-center space-x-2 text-xs text-emerald-600";
        warningTextEl.innerText = "Stratejik hedefler ile operasyonel efor tam hizalandı!";
        warningIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
    } else {
        // Misaligned styling
        scoreEl.className = "font-outfit font-extrabold text-6xl text-red-600";
        statusEl.className = "px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200";
        cardEl.className = "bg-white rounded-2xl border border-red-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden";
        cardBgEl.className = "absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-40";
        
        warningWrapper.className = "flex items-center space-x-2 text-xs text-red-600";
        warningTextEl.innerText = "Efor Dağılımı Uyumsuz: Sapma %15'i aştı!";
        warningIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>`;
    }

    renderProgressBars(currentDashboard.targetStatuses);
}

function renderProgressBars(targetStatuses) {
    const progressContainer = document.getElementById('objectives-container');
    progressContainer.innerHTML = '';

    const colors = [
        { text: 'text-blue-600', dot: 'bg-blue-600', bar: 'bg-indigo-500' },
        { text: 'text-amber-600', dot: 'bg-amber-600', bar: 'bg-indigo-500' },
        { text: 'text-emerald-600', dot: 'bg-emerald-600', bar: 'bg-indigo-500' },
        { text: 'text-purple-600', dot: 'bg-purple-600', bar: 'bg-indigo-500' }
    ];

    targetStatuses.forEach((status, index) => {
        const color = colors[index % colors.length];
        const isGapHigh = Math.abs(status.alignmentGap) > 15.0;
        const actualBarColor = isGapHigh ? 'bg-red-400' : 'bg-emerald-400';
        const gapSign = status.alignmentGap >= 0 ? '+' : '';
        const gapColor = isGapHigh ? 'text-red-600 font-bold' : 'text-slate-500';

        const cardHtml = `
            <div class="p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div class="flex flex-col sm:flex-row justify-between mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="w-2.5 h-2.5 rounded-full ${color.dot}"></span>
                        <h4 class="font-semibold text-sm sm:text-base text-slate-800">${status.targetName}</h4>
                    </div>
                    <div class="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-0">
                        Hedef: <span class="font-bold text-slate-700">${status.targetPercentage}%</span> | 
                        Gerçekleşen: <span class="font-bold ${isGapHigh ? 'text-red-600' : 'text-emerald-600'}">${status.actualPercentage}%</span> 
                        (Sapma: <span class="${gapColor}">${gapSign}${status.alignmentGap}%</span>)
                    </div>
                </div>
                <div class="space-y-2">
                    <!-- Target Bar (Indigo) -->
                    <div class="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative">
                        <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" style="width: ${status.targetPercentage}%"></div>
                    </div>
                    <!-- Actual Bar (Red/Green) -->
                    <div class="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative">
                        <div class="h-full ${actualBarColor} rounded-full transition-all duration-500" style="width: ${status.actualPercentage}%"></div>
                    </div>
                </div>
            </div>
        `;
        progressContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function populateTargetSelect() {
    const selectEl = document.getElementById('task-target-select');
    selectEl.innerHTML = '<option value="" disabled selected>Hedef seçin...</option>';
    
    localTargets.forEach(target => {
        const opt = document.createElement('option');
        opt.value = target.id;
        opt.innerText = target.name;
        selectEl.appendChild(opt);
    });
}

function renderTasksTable() {
    const tbody = document.getElementById('tasks-table-body');
    tbody.innerHTML = '';

    if (localTasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-6 text-slate-400">Backlogda görev bulunmuyor. Hizalamayı hesaplamak için görev ekleyin!</td>
            </tr>
        `;
        const countEl = document.getElementById('tasks-count');
        countEl.innerText = "0 Görev";
        return;
    }

    // Map targets by ID
    const targetMap = {};
    localTargets.forEach(t => { targetMap[t.id] = t.name; });

    const countEl = document.getElementById('tasks-count');
    countEl.innerText = `${localTasks.length} Görev`;

    const colors = ['bg-blue-50 text-blue-700', 'bg-amber-50 text-amber-700', 'bg-emerald-50 text-emerald-700', 'bg-purple-50 text-purple-700'];

    localTasks.forEach(task => {
        const targetName = targetMap[task.strategicTargetId] || "Bilinmeyen Hedef";
        const colorClass = colors[task.strategicTargetId % colors.length] || 'bg-slate-100 text-slate-700';

        const rowHtml = `
            <tr class="hover:bg-slate-50/50 transition-colors">
                <td class="py-3 px-2 font-medium text-slate-800">${task.title}</td>
                <td class="py-3 px-2 text-center font-bold text-slate-600">${task.storyPoint}</td>
                <td class="py-3 px-2">
                    <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${targetName}</span>
                </td>
                <td class="py-3 px-2 text-right">
                    <button onclick="deleteTask(${task.id})" class="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">Sil</button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', rowHtml);
    });
}

function renderSliders() {
    const slidersContainer = document.getElementById('sliders-container');
    slidersContainer.innerHTML = '';

    localTargets.forEach(target => {
        const sliderHtml = `
            <div>
                <div class="flex justify-between items-center text-xs mb-1.5">
                    <span class="font-semibold text-slate-700">${target.name} Hedefi</span>
                    <span class="font-bold text-indigo-600 text-sm" id="slider-val-${target.id}">${target.targetPercentage}%</span>
                </div>
                <input type="range" min="0" max="100" value="${target.targetPercentage}" 
                       data-target-id="${target.id}"
                       class="sim-slider w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                       oninput="onSliderChange(this, ${target.id})">
            </div>
        `;
        slidersContainer.insertAdjacentHTML('beforeend', sliderHtml);
    });

    updateSlidersSum();
}

function onSliderChange(slider, targetId) {
    const targetIdInt = parseInt(targetId);
    const newValue = parseInt(slider.value);
    
    // Proportional auto-balancing algorithm
    const sliders = Array.from(document.querySelectorAll('.sim-slider'));
    const N = sliders.length;
    
    if (N > 1) {
        const otherSliders = sliders.filter(s => parseInt(s.getAttribute('data-target-id')) !== targetIdInt);
        const sumOtherOld = otherSliders.reduce((sum, s) => sum + parseInt(s.value), 0);
        const remaining = 100 - newValue;
        
        if (sumOtherOld > 0) {
            let allocated = 0;
            otherSliders.forEach((s, idx) => {
                let val;
                if (idx === otherSliders.length - 1) {
                    val = remaining - allocated;
                } else {
                    const oldVal = parseInt(s.value);
                    val = Math.round((oldVal / sumOtherOld) * remaining);
                    allocated += val;
                }
                val = Math.max(0, Math.min(100, val));
                s.value = val;
                
                const id = s.getAttribute('data-target-id');
                const label = document.getElementById(`slider-val-${id}`);
                if (label) label.innerText = `${val}%`;
            });
        } else {
            let allocated = 0;
            otherSliders.forEach((s, idx) => {
                let val;
                if (idx === otherSliders.length - 1) {
                    val = remaining - allocated;
                } else {
                    val = Math.round(remaining / otherSliders.length);
                    allocated += val;
                }
                val = Math.max(0, Math.min(100, val));
                s.value = val;
                
                const id = s.getAttribute('data-target-id');
                const label = document.getElementById(`slider-val-${id}`);
                if (label) label.innerText = `${val}%`;
            });
        }
    }
    
    const valLabel = document.getElementById(`slider-val-${targetId}`);
    if (valLabel) valLabel.innerText = `${newValue}%`;
    
    updateSlidersSum();
    runLocalSimulation();
}

function updateSlidersSum() {
    const sliders = document.querySelectorAll('.sim-slider');
    let total = 0;
    sliders.forEach(s => {
        total += parseInt(s.value);
    });
    const totalEl = document.getElementById('total-val');
    totalEl.innerText = `${total}%`;
    
    if (total === 100) {
        totalEl.className = "font-bold text-emerald-600";
    } else {
        totalEl.className = "font-bold text-red-500 animate-pulse";
    }
}

function runLocalSimulation() {
    if (!currentDashboard) return;

    const sliders = document.querySelectorAll('.sim-slider');
    const tempTargetPercentages = {};
    sliders.forEach(s => {
        const tid = s.getAttribute('data-target-id');
        tempTargetPercentages[tid] = parseFloat(s.value);
    });

    let totalAbsoluteGap = 0.0;
    let isMisaligned = false;

    const simulatedStatuses = currentDashboard.targetStatuses.map(status => {
        const targetId = status.targetId;
        const targetPercentage = tempTargetPercentages[targetId] !== undefined ? tempTargetPercentages[targetId] : status.targetPercentage;
        const actualPercentage = status.actualPercentage;
        const alignmentGap = Math.round((targetPercentage - actualPercentage) * 10) / 10;
        
        totalAbsoluteGap += Math.abs(alignmentGap);
        if (Math.abs(alignmentGap) > 15.0) {
            isMisaligned = true;
        }

        return {
            ...status,
            targetPercentage,
            alignmentGap
        };
    });

    let alignmentScore = 100;
    if (simulatedStatuses.length > 0) {
        alignmentScore = Math.round(100.0 - (totalAbsoluteGap / 2.0));
        alignmentScore = Math.max(0, Math.min(100, alignmentScore));
    }

    // Update UI elements in simulation mode
    const scoreEl = document.getElementById('alignment-score');
    const statusEl = document.getElementById('alignment-status');
    const cardEl = document.getElementById('alignment-card');
    const cardBgEl = document.getElementById('alignment-card-bg');
    const warningWrapper = document.getElementById('alignment-warning-wrapper');
    const warningTextEl = document.getElementById('alignment-warning-text');
    const warningIcon = document.getElementById('alignment-warning-icon');
    
    scoreEl.innerText = `${alignmentScore}%`;
    statusEl.innerText = `Simüle Edilen Durum: ${isMisaligned ? 'Uyumsuz' : 'Uyumlu'}`;
    
    if (isMisaligned) {
        scoreEl.className = "font-outfit font-extrabold text-6xl text-red-600 animate-pulse";
        statusEl.className = "px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200";
        cardEl.className = "bg-white rounded-2xl border border-red-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden";
        cardBgEl.className = "absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-40";
        
        warningWrapper.className = "flex items-center space-x-2 text-xs text-red-600";
        warningTextEl.innerText = "Simülasyon: Eylem Gerekiyor (Sapma %15'i aştı!)";
        warningIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>`;
    } else {
        scoreEl.className = "font-outfit font-extrabold text-6xl text-emerald-600";
        statusEl.className = "px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200";
        cardEl.className = "bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden";
        cardBgEl.className = "absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-40";
        
        warningWrapper.className = "flex items-center space-x-2 text-xs text-emerald-600";
        warningTextEl.innerText = "Simülasyon: Optimal Stratejik Hizalanma!";
        warningIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
    }

    // Refresh progress bars locally
    renderProgressBars(simulatedStatuses);
}

function setupEventListeners() {
    const form = document.getElementById('task-form');
    form.addEventListener('submit', handleTaskSubmit);

    document.getElementById('reset-sim').addEventListener('click', () => {
        renderSliders();
        renderDashboard();
    });

    document.getElementById('save-sim').addEventListener('click', applySimulationToBackend);
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const storyPoint = parseInt(document.getElementById('task-story-point').value);
    const strategicTargetId = parseInt(document.getElementById('task-target-select').value);

    if (!title || isNaN(storyPoint) || isNaN(strategicTargetId)) {
        alert("Lütfen tüm alanları doldurun.");
        return;
    }

    try {
        if (useBackend) {
            const res = await fetch(BASE_URL + '/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, storyPoint, strategicTargetId })
            });
            if (!res.ok) throw new Error("Backend error");
        } else {
            const tasks = getMockTasks();
            const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
            const newTask = {
                id: nextId,
                title: title,
                storyPoint: storyPoint,
                strategicTargetId: strategicTargetId
            };
            tasks.push(newTask);
            saveMockTasks(tasks);
        }

        document.getElementById('task-form').reset();
        await loadInitialData();
    } catch (err) {
        console.error("Error creating task:", err);
        alert("Görev eklenirken hata oluştu.");
    }
}

async function deleteTask(taskId) {
    if (!confirm("Görevi silmek istediğinize emin misiniz?")) return;

    try {
        if (useBackend) {
            const res = await fetch(BASE_URL + `/api/tasks/${taskId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Backend error");
        } else {
            let tasks = getMockTasks();
            tasks = tasks.filter(t => t.id !== taskId);
            saveMockTasks(tasks);
        }

        await loadInitialData();
    } catch (err) {
        console.error("Error deleting task:", err);
        alert("Görev silinirken hata oluştu.");
    }
}

async function applySimulationToBackend() {
    const sliders = document.querySelectorAll('.sim-slider');
    let sum = 0;
    sliders.forEach(s => { sum += parseInt(s.value); });
    
    if (sum !== 100) {
        alert("Hedeflerin toplamı kaydetmek için tam olarak %100 olmalıdır!");
        return;
    }

    try {
        if (useBackend) {
            const updatePromises = Array.from(sliders).map(slider => {
                const id = slider.getAttribute('data-target-id');
                const val = parseFloat(slider.value);
                return fetch(BASE_URL + `/api/targets/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetPercentage: val })
                });
            });
            await Promise.all(updatePromises);
            alert("Yeni stratejik hedefler başarıyla veri tabanına kaydedildi!");
        } else {
            const targets = getMockTargets();
            sliders.forEach(slider => {
                const id = parseInt(slider.getAttribute('data-target-id'));
                const val = parseFloat(slider.value);
                const target = targets.find(t => t.id === id);
                if (target) {
                    target.targetPercentage = val;
                }
            });
            saveMockTargets(targets);
            alert("Yeni stratejik hedefler başarıyla tarayıcı hafızasına kaydedildi!");
        }
        await loadInitialData();
    } catch (err) {
        console.error("Error applying simulation targets:", err);
        alert("Hedefler güncellenirken hata oluştu.");
    }
}

function showErrorMessage(msg) {
    alert(msg);
}
