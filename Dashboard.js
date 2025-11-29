import React, { useState} from 'react';

// ✅ تعریف مدل‌های ماشین و قطعات (همان لیست استفاده شده در assembly-logic.js)
const SIMULATOR_MODELS = [
    { 
        id: 1, 
        name: 'خودروی اسپرت EV', 
        description: 'شبیه‌ساز پیشرفته برقی با باتری لیتیومی پرظرفیت.', 
        parts: ['موتور AC سه‌فاز', 'باتری 100kWh', 'سیستم بازیابی انرژی (Regen)'] 
    },
    { 
        id: 2, 
        name: 'خودروی شهری ICE', 
        description: 'شبیه‌ساز بنزینی با موتور 1.6 لیتری و گیربکس دستی.', 
        parts: ['موتور احتراق داخلی 4 سیلندر', 'سیستم مدیریت سوخت ECU', 'گیربکس 5 سرعته'] 
    },
    // ... می‌توانید مدل‌های بیشتری اضافه کنید
];

function Dashboard() {
    const [models] = useState(SIMULATOR_MODELS);
    
    // ✅ تابع جدید برای شروع شبیه‌سازی و هدایت
    const handleStartSim = (modelId) => {
        // ساخت مسیر جدید: /CES-car-electronical-simulator/indexmain.html?model=1
        // این کار مرورگر را به طور مستقیم به فایل HTML هدایت می‌کند و ID مدل را پاس می‌دهد.
        window.location.href = `/CES-car-electronical-simulator/indexmain.html?model=${modelId}`;
    };

    return (
        <div className="dashboard-container" style={styles.container}>
            <h1>انتخاب مدل خودرو برای شبیه‌سازی</h1>
            
            <div className="models-list">
                {models.map((model) => (
                    <div key={model.id} style={styles.card}>
                        <h2 style={styles.cardTitle}>{model.name} (ID: {model.id})</h2>
                        <p>{model.description}</p>
                        
                        <h4 style={styles.partsTitle}>قطعات اصلی شبیه‌سازی:</h4>
                        <ul style={styles.partsList}>
                            {model.parts.map((part, index) => (
                                <li key={index}>{part}</li>
                            ))}
                        </ul>
                        
                        <button 
                            className="start-sim-button" 
                            // ✅ اتصال تابع جدید به دکمه
                            onClick={() => handleStartSim(model.id)}
                            style={styles.simButton}
                        >
                            شروع شبیه‌سازی
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// استایل‌های ساده برای تمیز نگه داشتن فایل
const styles = {
    container: {
        textAlign: 'center',
        padding: '20px',
        maxWidth: '900px',
        margin: '0 auto',
    },
    card: {
        background: '#151922',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '20px',
        margin: '20px 0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    cardTitle: {
        color: '#4CC9F0',
        borderBottom: '1px dashed rgba(255, 255, 255, 0.2)',
        paddingBottom: '10px',
        marginBottom: '10px',
    },
    partsTitle: {
        color: '#ffffff',
        fontSize: '1rem',
        marginTop: '15px',
    },
    partsList: {
        listStyleType: 'disc',
        marginRight: '20px',
        marginTop: '10px',
        color: '#b0b0b0',
        textAlign: 'right',
    },
    simButton: {
        marginTop: '20px',
        padding: '10px 20px',
        fontSize: '1.1rem',
        background: '#7209B7',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
};

export default Dashboard;