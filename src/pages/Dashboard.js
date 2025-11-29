import React, { useState, useEffect } from 'react';

// ✅ تعریف مدل‌های ماشین و قطعات
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
    // می‌توانید در آینده لیست مدل‌ها را از یک API دریافت کنید.
    const [models, setModels] = useState(SIMULATOR_MODELS);
    
    // در اینجا می‌توانید یک useEffect برای واکشی داده‌های واقعی از سرور قرار دهید.
    /*
    useEffect(() => {
        // مثال: واکشی مدل‌های به‌روز از بک‌اند
        // fetch('https://your-backend-url/api/models').then(res => res.json()).then(setModels);
    }, []);
    */

    return (
        <div className="dashboard-page" style={{ padding: '20px', textAlign: 'right', direction: 'rtl' }}>
            <h1>🚀 داشبورد شبیه‌ساز CES</h1>
            <p style={{ color: '#4CC9F0', fontSize: '1.1rem' }}>به دنیای شبیه‌سازهای الکترونیک خودرو خوش آمدید! در اینجا می‌توانید مدل‌های موجود و قطعات آنها را مشاهده کنید.</p>
            
            <hr style={{ margin: '30px 0' }} />

            <div className="model-list">
                {models.map(model => (
                    <div key={model.id} className="model-card" style={styles.card}>
                        <h2 style={styles.cardTitle}>{model.name}</h2>
                        <p style={{ color: '#b0b0b0', marginBottom: '15px' }}>{model.description}</p>
                        
                        <h3 style={styles.partsTitle}>📦 قطعات کلیدی:</h3>
                        <ul style={styles.partsList}>
                            {model.parts.map((part, index) => (
                                <li key={index}>{part}</li>
                            ))}
                        </ul>
                        
                        <button 
                            className="start-sim-button" 
                            onClick={() => alert(`شروع شبیه‌سازی ${model.name}...`)}
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
        lineHeight: '1.8',
    },
    simButton: {
        marginTop: '20px',
        padding: '10px 20px',
        background: '#7209B7', // رنگ بنفش اصلی
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
};

export default Dashboard;