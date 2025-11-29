import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ModelUploader() {
    const navigate = useNavigate();
    const [modelName, setModelName] = useState('');
    const [componentName, setComponentName] = useState('');
    const [brand, setBrand] = useState('');
    const [controllerType, setControllerType] = useState('EMC'); 
    const [status, setStatus] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // 🚨 نکته: منطق آپلود فایل به Backend باید در اینجا پیاده‌سازی شود.
        setStatus('⏳ در حال ارسال داده‌ها به سرور...');
        
        // ... (منطق جمع‌آوری formData)

        setTimeout(() => {
            setStatus('✅ مدل جدید با موفقیت آماده آپلود است! (نیاز به پیاده‌سازی API)');
        }, 1500);
    };

    // ✅ تابع: خروج از حساب
    const handleLogout = () => {
        if (window.confirm('آیا مطمئنید که می‌خواهید از پنل مدیریت خارج شوید؟')) {
            localStorage.removeItem('ces-paid');
            localStorage.removeItem('ces-expire');
            navigate('/'); // هدایت به صفحه اصلی (Home)
        }
    };
    
    // ✅ تابع: بازگشت به صفحه اصلی
    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="uploader-page" style={styles.container}>
            <div style={styles.buttonContainer}>
                {/* دکمه بازگشت به صفحه اصلی */}
                <button 
                    onClick={handleGoHome} 
                    style={styles.backButton}
                >
                    🏠 بازگشت به صفحه اول
                </button>
                
                {/* دکمه خروج */}
                <button 
                    onClick={handleLogout} 
                    style={styles.logoutButton}
                >
                    🚪 خروج از حساب
                </button>
            </div>
            
            <h1 style={styles.title}>🚀 پنل مدیریت و آپلود مدل‌های سه‌بعدی (ویژه)</h1>
            <p style={styles.subtitle}>دسترسی ویژه فعال است: `danial.alinasiri1389@gmail.com`</p>
            
            <div style={styles.contentGrid}>
                
                {/* بخش اول: پیش‌نمایش 3D (Placeholder) */}
                <div style={styles.previewBox}>
                    <h2 style={styles.sectionTitle}>نمایش سه‌بعدی و برچسب قطعات</h2>
                    <div style={styles.threeDPlaceholder}>
                        <p>💡 در اینجا، کدهای **Three.js** شما برای نمایش مدل سه‌بعدی و برچسب‌گذاری قطعات بارگذاری می‌شود.</p>
                        <p style={{marginTop: '10px'}}>**(Placeholder 3D Viewer)**</p>
                    </div>
                </div>

                {/* بخش دوم: فرم آپلود و جزئیات */}
                <div style={styles.formBox}>
                    <h2 style={styles.sectionTitle}>ورود جزئیات و آپلود فایل‌ها</h2>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        
                        <input type="text" placeholder="نام کلی مدل خودرو (مثلاً: LamSim V1)" value={modelName} onChange={(e) => setModelName(e.target.value)} style={styles.input} required />
                        <input type="text" placeholder="نام قطعه (مثلاً: Differential - e-Diff)" value={componentName} onChange={(e) => setComponentName(e.target.value)} style={styles.input} required />
                        <input type="text" placeholder="برند قطعه (مثلاً: Bosch یا Continetal)" value={brand} onChange={(e) => setBrand(e.target.value)} style={styles.input} required />
                        
                        <select value={controllerType} onChange={(e) => setControllerType(e.target.value)} style={styles.input}>
                            <option value="EMC">نوع کنترلر: EMC (موتور الکتریکی)</option>
                            <option value="ECU">نوع کنترلر: ECU (موتور احتراق داخلی)</option>
                            <option value="VDC">نوع کنترلر: VDC (کنترل دینامیک خودرو)</option>
                        </select>
                        
                        <label style={styles.label}>آپلود مدل سه‌بعدی (OBJ/GLTF):</label>
                        <input type="file" id="model3d-file" style={styles.fileInput} accept=".obj,.gltf,.fbx" required />

                        <label style={styles.label}>آپلود نقشه مدار (Schematic/Map):</label>
                        <input type="file" id="map-file" style={styles.fileInput} accept=".pdf,.png,.jpg" required />

                        <button type="submit" style={styles.submitButton}>
                            ثبت و ذخیره مدل جدید
                        </button>
                    </form>

                    {status && <p style={styles.statusMessage}>{status}</p>}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        padding: '30px',
        textAlign: 'right',
        direction: 'rtl',
        minHeight: '100vh',
        background: '#0f1115',
        color: '#ffffff',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px',
    },
    backButton: {
        padding: '10px 15px',
        background: '#7209B7', // بنفش
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
        marginLeft: '10px' 
    },
    logoutButton: {
        padding: '10px 15px',
        background: '#F72585', // صورتی (رنگ هشدار)
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1rem',
    },
    title: {
        color: '#4CC9F0',
        borderBottom: '2px solid rgba(76, 201, 240, 0.5)',
        paddingBottom: '10px',
        marginBottom: '10px',
    },
    subtitle: {
        color: '#F72585',
        fontSize: '1.1rem',
        marginBottom: '30px',
    },
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '30px',
        marginTop: '30px',
    },
    previewBox: {
        background: '#151922',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    },
    formBox: {
        background: '#151922',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    },
    sectionTitle: {
        color: '#ffffff',
        marginBottom: '20px',
        borderBottom: '1px dashed rgba(255, 255, 255, 0.1)',
        paddingBottom: '10px',
    },
    threeDPlaceholder: {
        height: '400px',
        border: '3px dashed #7209B7',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#b0b0b0',
        borderRadius: '8px',
        fontSize: '1.1rem'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        padding: '10px',
        marginBottom: '15px',
        borderRadius: '6px',
        border: '1px solid #333',
        background: '#0f1115',
        color: '#ffffff',
        fontSize: '1rem',
        textAlign: 'right'
    },
    label: {
        textAlign: 'right',
        marginBottom: '5px',
        marginTop: '10px',
        color: '#4CC9F0',
        fontWeight: 'bold'
    },
    fileInput: {
        padding: '10px',
        marginBottom: '15px',
        border: '1px solid #7209B7',
        borderRadius: '6px',
        background: '#1f232b',
        cursor: 'pointer'
    },
    submitButton: {
        padding: '12px 20px',
        background: '#4CC9F0',
        color: '#0f1115',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        marginTop: '20px',
        fontWeight: 'bold',
        fontSize: '1.1rem'
    },
    statusMessage: {
        marginTop: '20px',
        fontSize: '1.1rem',
        color: '#4CC9F0'
    }
};

export default ModelUploader;