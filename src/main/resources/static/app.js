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
    { id: 1, title: "Giriş ekranı zaman aşımı hatasını düzelt", storyPoint: 5, strategicTargetId: 1, status: "DONE" },
    { id: 2, title: "Veritabanı bağlantı havuzunu (pooling) yeniden yapılandır", storyPoint: 13, strategicTargetId: 2, status: "IN_PROGRESS" },
    { id: 3, title: "Spring Boot ve çekirdek kütüphaneleri yükselt", storyPoint: 8, strategicTargetId: 2, status: "TODO" },
    { id: 4, title: "Eski bildirim mikro servisini yeniden yaz", storyPoint: 13, strategicTargetId: 2, status: "TODO" },
    { id: 5, title: "5G onboarding dokümantasyonunu taslak haline getir", storyPoint: 3, strategicTargetId: 3, status: "DONE" },
    { id: 6, title: "API yanıt sürelerini optimize et", storyPoint: 5, strategicTargetId: 1, status: "TODO" }
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
    const totalCompletedStoryPoints = tasks
        .filter(t => t.status === 'DONE')
        .reduce((sum, t) => sum + t.storyPoint, 0);

    const targetStatuses = [];
    let totalAbsoluteGap = 0.0;
    let totalCompletedAbsoluteGap = 0.0;
    let isMisaligned = false;
    let isCompletedMisaligned = false;

    targets.forEach(target => {
        const targetStoryPoints = tasks
            .filter(t => t.strategicTargetId === target.id)
            .reduce((sum, t) => sum + t.storyPoint, 0);

        const targetCompletedStoryPoints = tasks
            .filter(t => t.strategicTargetId === target.id && t.status === 'DONE')
            .reduce((sum, t) => sum + t.storyPoint, 0);

        let actualPercentage = 0.0;
        if (totalStoryPoints > 0) {
            actualPercentage = (targetStoryPoints / totalStoryPoints) * 100;
            actualPercentage = Math.round(actualPercentage * 10.0) / 10.0;
        }

        let completedPercentage = 0.0;
        if (totalCompletedStoryPoints > 0) {
            completedPercentage = (targetCompletedStoryPoints / totalCompletedStoryPoints) * 100;
            completedPercentage = Math.round(completedPercentage * 10.0) / 10.0;
        }

        let alignmentGap = target.targetPercentage - actualPercentage;
        alignmentGap = Math.round(alignmentGap * 10.0) / 10.0;

        let completedAlignmentGap = target.targetPercentage - completedPercentage;
        completedAlignmentGap = Math.round(completedAlignmentGap * 10.0) / 10.0;

        targetStatuses.push({
            targetId: target.id,
            targetName: target.name,
            targetPercentage: target.targetPercentage,
            actualPercentage: actualPercentage,
            alignmentGap: alignmentGap,
            completedPercentage: completedPercentage,
            completedAlignmentGap: completedAlignmentGap
        });

        totalAbsoluteGap += Math.abs(alignmentGap);
        totalCompletedAbsoluteGap += Math.abs(completedAlignmentGap);

        if (Math.abs(alignmentGap) > 15.0) {
            isMisaligned = true;
        }
        if (Math.abs(completedAlignmentGap) > 15.0) {
            isCompletedMisaligned = true;
        }
    });

    let alignmentScore = 100;
    if (targetStatuses.length > 0) {
        alignmentScore = Math.round(100.0 - (totalAbsoluteGap / 2.0));
        alignmentScore = Math.max(0, Math.min(100, alignmentScore));
    }

    let completedAlignmentScore = 100;
    if (targetStatuses.length > 0 && totalCompletedStoryPoints > 0) {
        completedAlignmentScore = Math.round(100.0 - (totalCompletedAbsoluteGap / 2.0));
        completedAlignmentScore = Math.max(0, Math.min(100, completedAlignmentScore));
    }

    const status = isMisaligned ? "Misaligned" : "Aligned";
    const completedStatus = isCompletedMisaligned ? "Misaligned" : "Aligned";

    return {
        alignmentScore: alignmentScore,
        status: status,
        completedAlignmentScore: completedAlignmentScore,
        completedStatus: completedStatus,
        targetStatuses: targetStatuses
    };
}

let localTargets = [];
let localTasks = [];
let currentDashboard = null;
let useBackend = false;
let alignmentChartInstance = null;
let filterSearchQuery = '';
let filterTargetId = '';
let activeEditTaskId = null;

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
        renderTargetsList();
    } catch (err) {
        console.error("Error loading Strataview data:", err);
        showErrorMessage("Hizalanma verileri yüklenirken bir hata oluştu.");
    }
}

function renderDashboard() {
    if (!currentDashboard) return;

    const scoreEl = document.getElementById('alignment-score');
    const statusEl = document.getElementById('alignment-status');
    const compScoreEl = document.getElementById('completed-alignment-score');
    const compStatusEl = document.getElementById('completed-alignment-status');
    const cardEl = document.getElementById('alignment-card');
    const cardBgEl = document.getElementById('alignment-card-bg');
    const warningWrapper = document.getElementById('alignment-warning-wrapper');
    const warningTextEl = document.getElementById('alignment-warning-text');
    const warningIcon = document.getElementById('alignment-warning-icon');
    const totalTasksEl = document.getElementById('total-tasks');
    const totalPointsEl = document.getElementById('total-story-points');

    // Update basic details
    scoreEl.innerText = `${currentDashboard.alignmentScore}%`;
    statusEl.innerText = currentDashboard.status === 'Aligned' ? 'Uyumlu' : 'Uyumsuz';
    
    compScoreEl.innerText = `${currentDashboard.completedAlignmentScore}%`;
    compStatusEl.innerText = currentDashboard.completedStatus === 'Aligned' ? 'Uyumlu' : 'Uyumsuz';
    
    const totalTasks = localTasks.length;
    const totalPoints = localTasks.reduce((sum, t) => sum + t.storyPoint, 0);
    totalTasksEl.innerText = `${totalTasks} Aktif`;
    totalPointsEl.innerText = `${totalPoints} Story Point`;

    // Update styles based on alignment status
    const isAnyMisaligned = currentDashboard.status === 'Misaligned' || currentDashboard.completedStatus === 'Misaligned';

    if (currentDashboard.status === 'Aligned') {
        scoreEl.className = "font-outfit font-extrabold text-3xl text-emerald-600";
        statusEl.className = "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200";
    } else {
        scoreEl.className = "font-outfit font-extrabold text-3xl text-red-600";
        statusEl.className = "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200";
    }

    if (currentDashboard.completedStatus === 'Aligned') {
        compScoreEl.className = "font-outfit font-extrabold text-3xl text-emerald-600";
        compStatusEl.className = "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200";
    } else {
        compScoreEl.className = "font-outfit font-extrabold text-3xl text-red-600";
        compStatusEl.className = "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200";
    }

    if (!isAnyMisaligned) {
        cardEl.className = "bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden";
        cardBgEl.className = "absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-40";
        warningWrapper.className = "flex items-center space-x-2 text-xs text-emerald-600";
        warningTextEl.innerText = "Stratejik hedefler ile operasyonel efor tam hizalandı!";
        warningIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
    } else {
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
        const isPlannedGapHigh = Math.abs(status.alignmentGap) > 15.0;
        const isCompletedGapHigh = Math.abs(status.completedAlignmentGap) > 15.0;

        const actualBarColor = isPlannedGapHigh ? 'bg-red-400' : 'bg-red-300';
        const completedBarColor = isCompletedGapHigh ? 'bg-red-500' : 'bg-emerald-400';

        const gapSign = status.alignmentGap >= 0 ? '+' : '';
        const compGapSign = status.completedAlignmentGap >= 0 ? '+' : '';

        const cardHtml = `
            <div class="p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div class="flex flex-col lg:flex-row justify-between mb-2 gap-2">
                    <div class="flex items-center space-x-2">
                        <span class="w-2.5 h-2.5 rounded-full ${color.dot}"></span>
                        <h4 class="font-semibold text-sm sm:text-base text-slate-800">${status.targetName}</h4>
                    </div>
                    <div class="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        Hedef: <span class="font-bold text-slate-700">${status.targetPercentage}%</span> | 
                        Planlanan: <span class="font-bold ${isPlannedGapHigh ? 'text-red-600' : 'text-slate-600'}">${status.actualPercentage}%</span> 
                        (Sapma: <span class="${isPlannedGapHigh ? 'text-red-600 font-bold' : 'text-slate-500'}">${gapSign}${status.alignmentGap}%</span>) |
                        Tamamlanan: <span class="font-bold ${isCompletedGapHigh ? 'text-red-600' : 'text-emerald-600'}">${status.completedPercentage}%</span> 
                        (Sapma: <span class="${isCompletedGapHigh ? 'text-red-600 font-bold' : 'text-emerald-600 font-semibold'}">${compGapSign}${status.completedAlignmentGap}%</span>)
                    </div>
                </div>
                <div class="space-y-1.5 mt-2">
                    <!-- Target Bar (Indigo) -->
                    <div class="flex items-center space-x-2">
                        <span class="text-[9px] font-semibold text-slate-400 w-16 uppercase">Hedef:</span>
                        <div class="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden relative">
                            <div class="h-full bg-indigo-500 rounded-full transition-all duration-500" style="width: ${status.targetPercentage}%"></div>
                        </div>
                    </div>
                    <!-- Planned Bar (Red/Rose) -->
                    <div class="flex items-center space-x-2">
                        <span class="text-[9px] font-semibold text-slate-400 w-16 uppercase">Planlanan:</span>
                        <div class="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden relative">
                            <div class="h-full ${actualBarColor} rounded-full transition-all duration-500" style="width: ${status.actualPercentage}%"></div>
                        </div>
                    </div>
                    <!-- Completed Bar (Emerald/Red) -->
                    <div class="flex items-center space-x-2">
                        <span class="text-[9px] font-semibold text-slate-400 w-16 uppercase">Tamamlanan:</span>
                        <div class="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden relative">
                            <div class="h-full ${completedBarColor} rounded-full transition-all duration-500" style="width: ${status.completedPercentage}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        progressContainer.insertAdjacentHTML('beforeend', cardHtml);
    });

    updateAlignmentChart(targetStatuses);
}

function populateTargetSelect() {
    const selectEl = document.getElementById('task-target-select');
    if (selectEl) {
        selectEl.innerHTML = '<option value="" disabled selected>Hedef seçin...</option>';
        localTargets.forEach(target => {
            const opt = document.createElement('option');
            opt.value = target.id;
            opt.innerText = target.name;
            selectEl.appendChild(opt);
        });
    }

    const filterEl = document.getElementById('task-filter-target');
    if (filterEl) {
        const currentSelected = filterEl.value;
        filterEl.innerHTML = '<option value="">Tüm Hedefler</option>';
        localTargets.forEach(target => {
            const opt = document.createElement('option');
            opt.value = target.id;
            opt.innerText = target.name;
            if (String(target.id) === currentSelected) {
                opt.selected = true;
            }
            filterEl.appendChild(opt);
        });
    }
}

function renderTasksTable() {
    const tbody = document.getElementById('tasks-table-body');
    tbody.innerHTML = '';

    const filteredTasks = localTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(filterSearchQuery.toLowerCase());
        const matchesTarget = filterTargetId === '' || task.strategicTargetId === parseInt(filterTargetId);
        return matchesSearch && matchesTarget;
    });

    if (filteredTasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-6 text-slate-400">Görev bulunmuyor veya arama kriteriyle eşleşen sonuç yok.</td>
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
    if (filteredTasks.length !== localTasks.length) {
        countEl.innerText = `${filteredTasks.length} / ${localTasks.length} Görev`;
    } else {
        countEl.innerText = `${localTasks.length} Görev`;
    }

    const colors = ['bg-blue-50 text-blue-700', 'bg-amber-50 text-amber-700', 'bg-emerald-50 text-emerald-700', 'bg-purple-50 text-purple-700'];

    filteredTasks.forEach(task => {
        const targetName = targetMap[task.strategicTargetId] || "Bilinmeyen Hedef";
        const colorClass = colors[task.strategicTargetId % colors.length] || 'bg-slate-100 text-slate-700';
        const statusVal = task.status || 'TODO';

        if (task.id === activeEditTaskId) {
            // Edit Mode Row
            let targetOptions = '';
            localTargets.forEach(t => {
                targetOptions += `<option value="${t.id}" ${t.id === task.strategicTargetId ? 'selected' : ''}>${t.name}</option>`;
            });

            const rowHtml = `
                <tr class="bg-indigo-50/30 animate-pulse-slow">
                    <td class="py-2.5 px-2">
                        <input type="text" id="edit-title-${task.id}" value="${task.title}" class="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                    </td>
                    <td class="py-2.5 px-2 text-center">
                        <input type="number" id="edit-sp-${task.id}" value="${task.storyPoint}" min="1" class="w-16 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-center font-bold">
                    </td>
                    <td class="py-2.5 px-2">
                        <select id="edit-target-${task.id}" class="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                            ${targetOptions}
                        </select>
                    </td>
                    <td class="py-2.5 px-2">
                        <select id="edit-status-${task.id}" class="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                            <option value="TODO" ${statusVal === 'TODO' ? 'selected' : ''}>TODO</option>
                            <option value="IN_PROGRESS" ${statusVal === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
                            <option value="DONE" ${statusVal === 'DONE' ? 'selected' : ''}>DONE</option>
                        </select>
                    </td>
                    <td class="py-2.5 px-2 text-right whitespace-nowrap">
                        <button onclick="saveEditTask(${task.id})" class="text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition-colors mr-2.5">Kaydet</button>
                        <button onclick="cancelEditTask()" class="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors">İptal</button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', rowHtml);
        } else {
            // Normal Row
            const rowHtml = `
                <tr class="hover:bg-slate-50/50 transition-colors">
                    <td class="py-3 px-2 font-medium text-slate-800">${task.title}</td>
                    <td class="py-3 px-2 text-center font-bold text-slate-600">${task.storyPoint}</td>
                    <td class="py-3 px-2">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${targetName}</span>
                    </td>
                    <td class="py-3 px-2">
                        <select onchange="updateTaskStatus(${task.id}, this.value)" class="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                            <option value="TODO" ${statusVal === 'TODO' ? 'selected' : ''}>TODO</option>
                            <option value="IN_PROGRESS" ${statusVal === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
                            <option value="DONE" ${statusVal === 'DONE' ? 'selected' : ''}>DONE</option>
                        </select>
                    </td>
                    <td class="py-3 px-2 text-right whitespace-nowrap">
                        <button onclick="startEditTask(${task.id})" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mr-2.5">Düzenle</button>
                        <button onclick="deleteTask(${task.id})" class="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">Sil</button>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', rowHtml);
        }
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
    let totalCompletedAbsoluteGap = 0.0;
    let isMisaligned = false;
    let isCompletedMisaligned = false;

    const simulatedStatuses = currentDashboard.targetStatuses.map(status => {
        const targetId = status.targetId;
        const targetPercentage = tempTargetPercentages[targetId] !== undefined ? tempTargetPercentages[targetId] : status.targetPercentage;
        const actualPercentage = status.actualPercentage;
        const completedPercentage = status.completedPercentage;
        
        const alignmentGap = Math.round((targetPercentage - actualPercentage) * 10) / 10;
        const completedAlignmentGap = Math.round((targetPercentage - completedPercentage) * 10) / 10;
        
        totalAbsoluteGap += Math.abs(alignmentGap);
        totalCompletedAbsoluteGap += Math.abs(completedAlignmentGap);
        
        if (Math.abs(alignmentGap) > 15.0) {
            isMisaligned = true;
        }
        if (Math.abs(completedAlignmentGap) > 15.0) {
            isCompletedMisaligned = true;
        }

        return {
            ...status,
            targetPercentage,
            alignmentGap,
            completedAlignmentGap
        };
    });

    let alignmentScore = 100;
    if (simulatedStatuses.length > 0) {
        alignmentScore = Math.round(100.0 - (totalAbsoluteGap / 2.0));
        alignmentScore = Math.max(0, Math.min(100, alignmentScore));
    }

    let completedAlignmentScore = 100;
    const totalCompletedPoints = localTasks
        .filter(t => t.status === 'DONE')
        .reduce((sum, t) => sum + t.storyPoint, 0);

    if (simulatedStatuses.length > 0 && totalCompletedPoints > 0) {
        completedAlignmentScore = Math.round(100.0 - (totalCompletedAbsoluteGap / 2.0));
        completedAlignmentScore = Math.max(0, Math.min(100, completedAlignmentScore));
    }

    // Update UI elements in simulation mode
    const scoreEl = document.getElementById('alignment-score');
    const statusEl = document.getElementById('alignment-status');
    const compScoreEl = document.getElementById('completed-alignment-score');
    const compStatusEl = document.getElementById('completed-alignment-status');
    const cardEl = document.getElementById('alignment-card');
    const cardBgEl = document.getElementById('alignment-card-bg');
    const warningWrapper = document.getElementById('alignment-warning-wrapper');
    const warningTextEl = document.getElementById('alignment-warning-text');
    const warningIcon = document.getElementById('alignment-warning-icon');
    
    scoreEl.innerText = `${alignmentScore}%`;
    statusEl.innerText = isMisaligned ? 'Uyumsuz' : 'Uyumlu';
    
    compScoreEl.innerText = `${completedAlignmentScore}%`;
    compStatusEl.innerText = isCompletedMisaligned ? 'Uyumsuz' : 'Uyumlu';

    if (isMisaligned) {
        scoreEl.className = "font-outfit font-extrabold text-3xl text-red-600 animate-pulse";
        statusEl.className = "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200";
    } else {
        scoreEl.className = "font-outfit font-extrabold text-3xl text-emerald-600";
        statusEl.className = "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200";
    }

    if (isCompletedMisaligned) {
        compScoreEl.className = "font-outfit font-extrabold text-3xl text-red-600 animate-pulse";
        compStatusEl.className = "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200";
    } else {
        compScoreEl.className = "font-outfit font-extrabold text-3xl text-emerald-600";
        compStatusEl.className = "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200";
    }

    const isAnyMisaligned = isMisaligned || isCompletedMisaligned;
    if (isAnyMisaligned) {
        cardEl.className = "bg-white rounded-2xl border border-red-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden";
        cardBgEl.className = "absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-40";
        warningWrapper.className = "flex items-center space-x-2 text-xs text-red-600";
        warningTextEl.innerText = "Simülasyon: Eylem Gerekiyor (Sapma %15'i aştı!)";
        warningIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>`;
    } else {
        cardEl.className = "bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden";
        cardBgEl.className = "absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-40";
        warningWrapper.className = "flex items-center space-x-2 text-xs text-emerald-600";
        warningTextEl.innerText = "Simülasyon: Optimal Stratejik Hizalanma!";
        warningIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>`;
    }

    renderProgressBars(simulatedStatuses);
}

function setupEventListeners() {
    const form = document.getElementById('task-form');
    form.addEventListener('submit', handleTaskSubmit);

    const targetForm = document.getElementById('target-form');
    if (targetForm) {
        targetForm.addEventListener('submit', handleTargetSubmit);
    }

    document.getElementById('reset-sim').addEventListener('click', () => {
        renderSliders();
        renderDashboard();
    });

    document.getElementById('save-sim').addEventListener('click', applySimulationToBackend);

    const searchInput = document.getElementById('task-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterSearchQuery = e.target.value;
            renderTasksTable();
        });
    }

    const filterTargetSelect = document.getElementById('task-filter-target');
    if (filterTargetSelect) {
        filterTargetSelect.addEventListener('change', (e) => {
            filterTargetId = e.target.value;
            renderTasksTable();
        });
    }
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
                body: JSON.stringify({ title, storyPoint, strategicTargetId, status: "TODO" })
            });
            if (!res.ok) throw new Error("Backend error");
        } else {
            const tasks = getMockTasks();
            const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
            const newTask = {
                id: nextId,
                title: title,
                storyPoint: storyPoint,
                strategicTargetId: strategicTargetId,
                status: "TODO"
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

async function updateTaskStatus(taskId, newStatus) {
    try {
        if (useBackend) {
            const res = await fetch(BASE_URL + `/api/tasks/${taskId}/status?status=${newStatus}`, {
                method: 'PUT'
            });
            if (!res.ok) throw new Error("Status update failed");
        } else {
            const tasks = getMockTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.status = newStatus;
                saveMockTasks(tasks);
            }
        }
        await loadInitialData();
    } catch (err) {
        console.error("Error updating task status:", err);
        alert("Görev durumu güncellenirken hata oluştu.");
    }
}

function startEditTask(taskId) {
    activeEditTaskId = taskId;
    renderTasksTable();
}

function cancelEditTask() {
    activeEditTaskId = null;
    renderTasksTable();
}

async function saveEditTask(taskId) {
    const titleInput = document.getElementById(`edit-title-${taskId}`);
    const spInput = document.getElementById(`edit-sp-${taskId}`);
    const targetSelect = document.getElementById(`edit-target-${taskId}`);
    const statusSelect = document.getElementById(`edit-status-${taskId}`);

    if (!titleInput || !spInput || !targetSelect || !statusSelect) return;

    const title = titleInput.value.trim();
    const storyPoint = parseInt(spInput.value);
    const strategicTargetId = parseInt(targetSelect.value);
    const status = statusSelect.value;

    if (!title || isNaN(storyPoint) || isNaN(strategicTargetId)) {
        alert("Lütfen tüm alanları geçerli doldurun.");
        return;
    }

    try {
        if (useBackend) {
            const res = await fetch(BASE_URL + `/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, storyPoint, strategicTargetId, status })
            });
            if (!res.ok) throw new Error("Backend update failed");
        } else {
            const tasks = getMockTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                task.title = title;
                task.storyPoint = storyPoint;
                task.strategicTargetId = strategicTargetId;
                task.status = status;
                saveMockTasks(tasks);
            }
        }
        activeEditTaskId = null;
        await loadInitialData();
    } catch (err) {
        console.error("Error saving task edit:", err);
        alert("Görev güncellenirken hata oluştu.");
    }
}

function renderTargetsList() {
    const container = document.getElementById('targets-list-container');
    if (!container) return;

    container.innerHTML = '';

    if (localTargets.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 py-4 text-xs">Mevcut hedef bulunmuyor.</div>';
        return;
    }

    localTargets.forEach(target => {
        const itemHtml = `
            <div class="flex justify-between items-center py-2.5 text-sm">
                <span class="font-medium text-slate-700">${target.name}</span>
                <div class="flex items-center space-x-2">
                    <span class="text-xs text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">${target.targetPercentage}%</span>
                    <button onclick="handleDeleteTarget(${target.id})" class="text-xs font-semibold text-red-600 hover:text-red-800 transition-colors">Sil</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
}

async function handleTargetSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('target-name');
    const name = nameInput.value.trim();

    if (!name) {
        alert("Lütfen geçerli bir hedef adı girin.");
        return;
    }

    if (localTargets.some(t => t.name.toLowerCase() === name.toLowerCase())) {
        alert("Bu isimde bir hedef zaten mevcut!");
        return;
    }

    try {
        if (useBackend) {
            const res = await fetch(BASE_URL + '/api/targets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, targetPercentage: 0.0 })
            });
            if (!res.ok) throw new Error("Backend save failed");
        } else {
            const targets = getMockTargets();
            const nextId = targets.length > 0 ? Math.max(...targets.map(t => t.id)) + 1 : 1;
            targets.push({
                id: nextId,
                name: name,
                targetPercentage: 0.0
            });
            saveMockTargets(targets);
        }

        nameInput.value = '';
        alert("Yeni stratejik hedef eklendi (%0 başlangıç oranı ile).");
        await loadInitialData();
    } catch (err) {
        console.error("Error adding target:", err);
        alert("Hedef eklenirken hata oluştu.");
    }
}

async function handleDeleteTarget(targetId) {
    if (localTargets.length <= 1) {
        alert("En az bir stratejik hedef kalmalıdır. Son hedefi silemezsiniz!");
        return;
    }

    const targetToDelete = localTargets.find(t => t.id === targetId);
    if (!targetToDelete) return;

    const confirmMsg = `"${targetToDelete.name}" hedefini silmek istediğinize emin misiniz?\n\nUYARI: Bu hedefe bağlı tüm operasyonel görevler (backlog) de kalıcı olarak silinecektir!`;
    if (!confirm(confirmMsg)) return;

    try {
        const deletedPercent = targetToDelete.targetPercentage;
        const remainingTargets = localTargets.filter(t => t.id !== targetId);
        
        // Proportional normalization
        const S = 100.0 - deletedPercent;
        if (S > 0) {
            let allocated = 0;
            remainingTargets.forEach((t, idx) => {
                let newVal;
                if (idx === remainingTargets.length - 1) {
                    newVal = 100.0 - allocated;
                } else {
                    newVal = (t.targetPercentage * 100.0) / S;
                    newVal = Math.round(newVal * 10.0) / 10.0;
                    allocated += newVal;
                }
                newVal = Math.max(0.0, Math.min(100.0, newVal));
                t.targetPercentage = newVal;
            });
        } else {
            let allocated = 0;
            remainingTargets.forEach((t, idx) => {
                let newVal;
                if (idx === remainingTargets.length - 1) {
                    newVal = 100.0 - allocated;
                } else {
                    newVal = Math.round((100.0 / remainingTargets.length) * 10.0) / 10.0;
                    allocated += newVal;
                }
                newVal = Math.max(0.0, Math.min(100.0, newVal));
                t.targetPercentage = newVal;
            });
        }

        if (useBackend) {
            const deleteRes = await fetch(BASE_URL + `/api/targets/${targetId}`, {
                method: 'DELETE'
            });
            if (!deleteRes.ok) throw new Error("Delete failed");

            // Update other targets
            const updatePromises = remainingTargets.map(t => {
                return fetch(BASE_URL + `/api/targets/${t.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: t.name, targetPercentage: t.targetPercentage })
                });
            });
            await Promise.all(updatePromises);
        } else {
            saveMockTargets(remainingTargets);
            
            let tasks = getMockTasks();
            tasks = tasks.filter(task => task.strategicTargetId !== targetId);
            saveMockTasks(tasks);
        }

        alert("Hedef ve bağlı görevleri başarıyla silindi. Oranlar yeniden dağıtıldı.");
        await loadInitialData();
    } catch (err) {
        console.error("Error deleting target:", err);
        alert("Hedef silinirken hata oluştu.");
    }
}

function updateAlignmentChart(targetStatuses) {
    const canvas = document.getElementById('alignmentChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (alignmentChartInstance) {
        alignmentChartInstance.destroy();
    }

    alignmentChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: targetStatuses.map(s => s.targetName),
            datasets: [
                {
                    label: 'Hedef %',
                    data: targetStatuses.map(s => s.targetPercentage),
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderColor: '#6366f1',
                    borderWidth: 1.5,
                    borderRadius: 5
                },
                {
                    label: 'Planlanan %',
                    data: targetStatuses.map(s => s.actualPercentage),
                    backgroundColor: 'rgba(251, 113, 133, 0.8)',
                    borderColor: '#fb7185',
                    borderWidth: 1.5,
                    borderRadius: 5
                },
                {
                    label: 'Tamamlanan %',
                    data: targetStatuses.map(s => s.completedPercentage),
                    backgroundColor: 'rgba(52, 211, 153, 0.8)',
                    borderColor: '#34d399',
                    borderWidth: 1.5,
                    borderRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        font: {
                            family: 'Outfit, sans-serif',
                            size: 11,
                            weight: '500'
                        },
                        color: '#334155'
                    }
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleFont: {
                        family: 'Outfit, sans-serif',
                        size: 12,
                        weight: 'bold'
                    },
                    bodyFont: {
                        family: 'Inter, sans-serif',
                        size: 11
                    },
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return ` ${context.dataset.label}: %${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 10
                        },
                        callback: function(value) {
                            const label = this.getLabelForValue(value);
                            return label.length > 15 ? label.substring(0, 12) + '...' : label;
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: '#f1f5f9'
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            family: 'Inter, sans-serif',
                            size: 10
                        },
                        callback: function(value) {
                            return '%' + value;
                        }
                    }
                }
            }
        }
    });
}
