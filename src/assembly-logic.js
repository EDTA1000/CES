// ==========================================================
// assembly-logic.js (نسخه‌ی نهایی و اصلاح‌شده)
// شامل منطق D&D، نمایش 3D، فعال‌سازی شبیه‌سازی و بارگذاری مدل از URL
// ==========================================================
import { CarPhysicsLib } from './CarPhysicsLib.js'; // فرض می‌کنیم CarPhysicsLib در این فایل است
import * as THREE from 'three'; // برای استفاده از Three.js

// --- A. Global Variables and Initial Configuration ---
// پیکربندی اولیه - این مقادیر با Drop شدن قطعات یا بارگذاری مدل جایگزین می‌شوند
const ASSEMBLY_CONFIG = {
    // این بخش می‌تواند از داده‌های مدل پر شود
    motorType: 'ICE', // مقدار پیش‌فرض
    parts: {
        body: { mass: 1200, fuelMassKg: 50, batteryMassKg: 0 }, 
        powertrain: { maxTorque: 140, maxPower: 80000, maxRPM: 6500 }, 
        battery: { batteryCapacityKWh: 0, maxMotorTorque: 0, maxMotorPower: 0 }, 
        wheel: { radius: 0.35, inertia: 0.8 }, 
    },
    settings: {
        gearRatio: 4.5, 
        dragCoefficient: 0.35,
        frontalArea: 1.8,
        maxSteeringAngle: 30,
        brakeTorque: 3000
    }
};

// ✅ لیست پیکربندی‌های مدل (برای همگام‌سازی با Dashboard.js)
const MODELS_CONFIG = [
    { 
        id: 1, 
        name: 'خودروی اسپرت EV (LamSim)', 
        motorType: 'EV',
        physics: {
            gearRatio: 10.0, 
            dragCoefficient: 0.28,
            frontalArea: 2.2,
            maxSteeringAngle: 30,
            brakeTorque: 4000,
            // جزئیات قطعات برای CarPhysicsLib
            engine: { maxTorque: 0, maxPower: 0, maxRPM: 0 }, 
            electric: { batteryCapacityKWh: 120, maxMotorTorque: 400, maxMotorPower: 350000 },
            body: { mass: 1800, fuelMassKg: 0, batteryMassKg: 500 }, 
            wheel: { radius: 0.40, inertia: 1.2 }, 
        }
    },
    { 
        id: 2, 
        name: 'خودروی شهری ICE (تیبا ۲)', 
        motorType: 'ICE',
        physics: {
            gearRatio: 4.5, 
            dragCoefficient: 0.35,
            frontalArea: 1.8,
            maxSteeringAngle: 30,
            brakeTorque: 3000,
            // جزئیات قطعات برای CarPhysicsLib
            engine: { maxTorque: 140, maxPower: 80000, maxRPM: 6500 },
            electric: { batteryCapacityKWh: 0, maxMotorTorque: 0, maxMotorPower: 0 }, 
            body: { mass: 1000, fuelMassKg: 50, batteryMassKg: 0 }, 
            wheel: { radius: 0.35, inertia: 0.8 }, 
        }
    },
];


let carPhysics; 
let isAssemblyComplete = false;
let isSimulating = false; // متغیر وضعیت شبیه‌سازی
let lastTime = performance.now(); // برای محاسبه دلتا تایم

// ارجاع به المان‌های خروجی و ورودی (مطابق با IDهای HTML شما)
const speedOut = document.getElementById('speed-out');
const accelOut = document.getElementById('accel-out');
const chargeOut = document.getElementById('charge-out');
const throttleInput = document.getElementById('throttle-input');
const brakeInput = document.getElementById('brake-input');
const statusOut = document.getElementById('status-out');
const startSimButton = document.getElementById('start-simulation');
const resetSimButton = document.getElementById('reset-simulation'); // فرض می‌کنیم دکمه ریست وجود دارد

// متغیرهای Three.js
let scene, camera, renderer, carMesh; 

// --- B. Core Simulation Functions ---

function handleStartSimulation() {
    if (isAssemblyComplete) {
        if (!isSimulating) {
            isSimulating = true;
            startSimButton.textContent = "توقف شبیه‌سازی";
            startSimButton.classList.remove('primary-btn');
            startSimButton.classList.add('danger-btn');
            
            // ریست کردن شبیه‌سازی در شروع
            carPhysics.resetState();
            statusOut.textContent = `🚀 شبیه‌سازی مدل ${ASSEMBLY_CONFIG.motorType} شروع شد.`;
            statusOut.style.color = '#4CC9F0';
            lastTime = performance.now(); // ریست زمان برای دقت بیشتر
        } else {
            isSimulating = false;
            startSimButton.textContent = "شروع شبیه‌سازی";
            startSimButton.classList.remove('danger-btn');
            startSimButton.classList.add('primary-btn');
            statusOut.textContent = `⏸️ شبیه‌سازی متوقف شد. سرعت نهایی: ${carPhysics.state.velocity * 3.6} km/h`;
            statusOut.style.color = '#F79F1F';
        }
    } else {
        alert("خطا: مونتاژ کامل نیست!");
    }
}

function handleResetSimulation() {
    // متوقف کردن در صورت فعال بودن
    if (isSimulating) {
        handleStartSimulation(); 
    }
    carPhysics.resetState();
    // به‌روزرسانی خروجی‌های UI
    updateSimulationOutput();
    statusOut.textContent = "✅ شبیه‌ساز ریست شد. آماده شروع مجدد.";
    statusOut.style.color = '#7209B7';
}

function updateSimulationOutput() {
    if (!carPhysics) return;
    
    // سرعت از m/s به km/h
    const speedKmH = carPhysics.state.velocity * 3.6; 
    speedOut.textContent = speedKmH.toFixed(1);
    
    // شتاب
    accelOut.textContent = carPhysics.state.acceleration.toFixed(2);
    
    // شارژ باتری (فقط برای EV)
    if (ASSEMBLY_CONFIG.motorType === 'EV') {
        const charge = carPhysics.state.batteryChargeKWh.toFixed(2);
        chargeOut.textContent = `${charge} kWh`;
    } else {
        chargeOut.textContent = '--';
    }
}

function animateSimulation() {
    requestAnimationFrame(animateSimulation);
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // Delta Time in seconds
    lastTime = now;

    if (isSimulating) {
        // خواندن ورودی‌ها
        const throttle = parseFloat(throttleInput.value) / 100; // 0.0 to 1.0
        const brake = parseFloat(brakeInput.value) / 100; // 0.0 to 1.0
        
        // اجرای گام شبیه‌سازی
        carPhysics.simulateStep(dt, throttle, brake, 0); // فرض می‌کنیم شیب صفر است

        // به‌روزرسانی خروجی‌ها
        updateSimulationOutput();
    }
    
    // رندر 3D (حتی اگر شبیه‌سازی متوقف باشد)
    if (renderer) {
        renderer.render(scene, camera);
    }
}

// --- C. Assembly and D&D Logic (Placeholders) ---

function init3DScene() {
    const container = document.getElementById('render-3d-output');
    if (!container) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x151922); // رنگ پس‌زمینه پنل

    // تنظیم دوربین
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    camera.lookAt(0, 0, 0);

    // تنظیم رندر
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // اضافه کردن زمین (ساده)
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = Math.PI / 2;
    scene.add(plane);
    
    // اضافه کردن یک مکعب برای نمایش خودرو (به عنوان Placeholder)
    const carGeometry = new THREE.BoxGeometry(2, 0.5, 4);
    const carMaterial = new THREE.MeshBasicMaterial({ color: 0x4CC9F0 });
    carMesh = new THREE.Mesh(carGeometry, carMaterial);
    carMesh.position.y = 0.25;
    scene.add(carMesh);

    // نورپردازی
    const light = new THREE.AmbientLight(0x404040); // نور نرم
    scene.add(light);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
}

// توابع Drag and Drop (باید وجود داشته باشند اما فعلاً کاری انجام نمی‌دهند)
function dragStart(e) { /* Placeholder */ }
function dragEnd(e) { /* Placeholder */ }
function dragOver(e) { e.preventDefault(); }
function dragEnter(e) { e.preventDefault(); }
function dragLeave(e) { /* Placeholder */ }
function drop(e) { 
    e.preventDefault(); 
    // ... منطق واقعی D&D
    checkAssemblyStatus(); // پس از رها کردن قطعه، وضعیت مونتاژ را بررسی می‌کند
}

function setupDragAndDrop() {
    // 1. تنظیم رویدادهای قطعات قابل کشیدن
    document.querySelectorAll('.draggable-part').forEach(part => {
        part.addEventListener('dragstart', dragStart);
        part.addEventListener('dragend', dragEnd);
    });

    // 2. تنظیم رویدادهای منطقه رها کردن (Drop Target)
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', dragOver);
        zone.addEventListener('dragenter', dragEnter);
        zone.addEventListener('dragleave', dragLeave);
        zone.addEventListener('drop', drop);
    });
}

function checkAssemblyStatus() {
    // این تابع باید وضعیت isAssemblyComplete را بر اساس وجود قطعات تعیین کند.
    // در حالت بارگذاری مدل از URL، آن را به true تنظیم می‌کنیم.
    // اگر مونتاژ کامل است:
    // startSimButton.disabled = false;
    // در غیر این صورت:
    // startSimButton.disabled = true;
    
    startSimButton.disabled = !isAssemblyComplete; 
}

// --- D. Event Listeners and Initial Setup (با اصلاحیه اصلی) ---

window.addEventListener('load', () => {
    // 1. ✅ استخراج Model ID از URL
    const urlParams = new URLSearchParams(window.location.search);
    const modelId = parseInt(urlParams.get('model')); 
    
    // 2. ✅ پیدا کردن پیکربندی مدل
    const selectedModelConfig = MODELS_CONFIG.find(m => m.id === modelId);

    if (selectedModelConfig) {
        // --- تزریق پیکربندی مدل ---
        
        // A. تنظیم نوع موتور
        ASSEMBLY_CONFIG.motorType = selectedModelConfig.motorType;
        
        // B. تنظیم پارامترهای فیزیک در تنظیمات عمومی
        Object.assign(ASSEMBLY_CONFIG.settings, selectedModelConfig.physics);
        
        // C. تنظیم جزئیات قطعات (برای CarPhysicsLib)
        // این کار فرض می‌کند که با انتخاب مدل، قطعات آن به طور خودکار "نصب" شده‌اند.
        ASSEMBLY_CONFIG.parts.powertrain = selectedModelConfig.physics.engine;
        ASSEMBLY_CONFIG.parts.battery = selectedModelConfig.physics.electric;
        ASSEMBLY_CONFIG.parts.body = selectedModelConfig.physics.body;
        ASSEMBLY_CONFIG.parts.wheel = selectedModelConfig.physics.wheel;

        // 3. مقداردهی اولیه CarPhysicsLib با پیکربندی کامل
        // ما تمام اجزای لازم را به CarPhysicsLib پاس می‌دهیم
        carPhysics = new CarPhysicsLib({
            motorType: ASSEMBLY_CONFIG.motorType,
            ...ASSEMBLY_CONFIG.settings,
            ...ASSEMBLY_CONFIG.parts, 
        });
        
        // 4. به‌روزرسانی رابط کاربری و وضعیت
        statusOut.textContent = `مدل فعال: ${selectedModelConfig.name} - مونتاژ اولیه آماده`;
        statusOut.style.color = '#4CC9F0';
        isAssemblyComplete = true; // مونتاژ کامل فرض می‌شود
        
        console.log(`[INIT] Simulator initialized for model ID: ${modelId} (${selectedModelConfig.name})`);
    } else {
        // حالت خطای مدل یا بدون پارامتر (باید ابتدا مونتاژ شود)
        statusOut.textContent = "⚙️ آماده مونتاژ دستی (لطفاً قطعات را بکشید و رها کنید).";
        statusOut.style.color = '#F79F1F';
        isAssemblyComplete = false;
        
        // در این حالت، carPhysics با مقادیر پیش‌فرض ASSEMBLY_CONFIG اولیه می‌شود
        carPhysics = new CarPhysicsLib({
            motorType: ASSEMBLY_CONFIG.motorType,
            ...ASSEMBLY_CONFIG.settings,
            ...ASSEMBLY_CONFIG.parts,
        });
    }

    // اتصال دکمه شروع شبیه‌سازی
    startSimButton.addEventListener('click', handleStartSimulation);
    if (resetSimButton) {
        resetSimButton.addEventListener('click', handleResetSimulation);
    }
    
    init3DScene();
    animateSimulation(); 
    setupDragAndDrop(); // فعال‌سازی منطق D&D
    checkAssemblyStatus(); // بررسی وضعیت اولیه (دکمه‌ها باید فعال شوند یا غیرفعال بمانند)

    // تنظیمات تغییر اندازه برای Three.js
    new ResizeObserver(() => {
        const container = document.getElementById('render-3d-output');
        if (renderer && container) {
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
        }
    }).observe(document.getElementById('render-3d-output'));
});