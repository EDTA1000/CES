// تابع اصلی برای پردازش ایمیل کاربر هنگام ثبت نام
async function handleSubscribe() {
    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();

    // اعتبارسنجی اولیه ایمیل
    if (!email) {
        alert("لطفاً ایمیل خود را وارد کنید.");
        emailInput.focus();
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("لطفاً یک آدرس ایمیل معتبر وارد کنید.");
        emailInput.focus();
        return;
    }

    // نمایش یک لودر یا پیام "در حال بررسی..." (اختیاری)
    const subscribeButton = document.querySelector('button[onclick="handleSubscribe()"]');
    if (subscribeButton) {
        subscribeButton.disabled = true;
        subscribeButton.textContent = 'در حال بررسی...';
    }

    try {
        // ارسال ایمیل به بک‌اند برای بررسی وضعیت کاربر
        const response = await fetch('/api/check-user-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "پاسخ نامعتبر از سرور دریافت شد." }));
            throw new Error(`خطا در سرور: ${response.status} - ${errorData.message || 'خطای ناشناخته'}`);
        }

        const userData = await response.json(); // پاسخ بک‌اند { isNewUser: boolean, message?: string, userId?: string }

        // پنهان کردن فرم اولیه ثبت نام
        document.getElementById('email-form-container').style.display = 'none';

        // بر اساس پاسخ بک‌اند، محتوای بعدی را نمایش می‌دهیم
        if (userData.isNewUser) {
            // کاربر جدید است: نمایش پیشنهاد اشتراک رایگان
            showFreeTrialOffer(email);
        } else {
            // کاربر قبلی است: نمایش پیام خوش‌آمدگویی و دکمه ورود
            showExistingUserOptions(userData.message || "خوش آمدید!");
        }

    } catch (error) {
        console.error("خطای رخ داده:", error);
        alert("خطا در ارتباط با سرور. لطفاً بعداً دوباره تلاش کنید. \n" + error.message);
        // بازگرداندن دکمه به حالت اولیه در صورت خطا
        if (subscribeButton) {
            subscribeButton.disabled = false;
            subscribeButton.textContent = 'تایید';
        }
    }
}

// تابع برای نمایش پیشنهاد اشتراک ۷ روزه رایگان
function showFreeTrialOffer(email) {
    const contentContainer = document.getElementById('content-container'); // فرض می‌کنیم یک کانتینر اصلی داریم
    contentContainer.innerHTML = `
        <div id="free-trial-offer" class="content-section">
            <h2>یک اشتراک ۷ روزه رایگان!</h2>
            <p>از تمام امکانات ما به مدت ۷ روز رایگان لذت ببرید.</p>
            <div class="offer-buttons">
                <button onclick="acceptFreeTrial('${email}')">استفاده از اشتراک ۷ روزه رایگان</button>
                <button onclick="declineFreeTrial('${email}')">نه متشکرم</button>
            </div>
        </div>
    `;
    // استایل‌های مربوط به این بخش باید در CSS اصلی یا اینجا اضافه شوند
}

// تابع برای پذیرش اشتراک ۷ روزه رایگان
async function acceptFreeTrial(email) {
    const offerButtonsContainer = document.querySelector('.offer-buttons');
    if (offerButtonsContainer) {
        offerButtonsContainer.innerHTML = '<p>در حال فعال‌سازی...</p>'; // نمایش پیام پردازش
    }

    try {
        const response = await fetch('/api/activate-free-trial', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ message: "پاسخ نامعتبر از سرور دریافت شد." }));
             throw new Error(`خطا در سرور: ${response.status} - ${errorData.message || 'خطای فعال‌سازی'}`);
        }

        const data = await response.json();
        alert(data.message || "اشتراک ۷ روزه رایگان شما فعال شد!");

        // پس از فعال‌سازی موفق، کاربر را به صفحه اصلی هدایت می‌کنیم
        // و دکمه "ورود به صفحه شخصی من" را نمایش می‌دهیم (یا مستقیماً هدایت می‌کنیم)
        // برای نمایش دکمه، نیاز به عنصری در HTML داریم که این دکمه در آن قرار گیرد
        // فعلا مستقیم هدایت می‌کنیم:
        window.location.href = 'index.html'; // یا مسیر صفحه اصلی شما

    } catch (error) {
        console.error("خطای فعال‌سازی اشتراک رایگان:", error);
        alert("خطا در فعال‌سازی اشتراک رایگان. لطفاً دوباره تلاش کنید. \n" + error.message);
        // در صورت خطا، دکمه‌ها را برمی‌گردانیم
        showFreeTrialOffer(email); // نمایش مجدد دکمه‌ها
    }
}

// تابع برای رد کردن اشتراک رایگان
function declineFreeTrial(email) {
    // اطلاع‌رسانی به بک‌اند مبنی بر رد پیشنهاد (اختیاری)
    fetch('/api/decline-free-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    }).catch(error => console.error("خطا در ثبت رد اشتراک رایگان:", error));

    alert("اشتراک رایگان شما برای استفاده در آینده محفوظ است.");

    // نمایش دکمه "ورود به صفحه شخصی من" و بازگشت به صفحه اصلی
    showExistingUserOptions("شما اشتراک رایگان خود را برای استفاده در آینده نگه داشتید.");
}

// تابع برای نمایش گزینه‌های کاربرانی که قبلاً ثبت نام کرده‌اند
function showExistingUserOptions(message) {
    const contentContainer = document.getElementById('content-container');
    contentContainer.innerHTML = `
        <div id="existing-user-options" class="content-section">
            <p>${message}</p>
            <div id="action-buttons">
                 <button onclick="goToPersonalPage()">ورود به صفحه شخصی من</button>
                 <button onclick="window.location.href='index.html'">بازگشت به صفحه اصلی</button>
            </div>
        </div>
    `;
    // استایل‌های مربوط به این بخش را اضافه کنید
}

// تابع برای هدایت کاربر به صفحه شخصی
function goToPersonalPage() {
    window.location.href = '/my-account'; // آدرس صفحه شخصی خود را تنظیم کنید
}

// تابع کمکی برای رفتن به صفحه اشتراک‌ها (اگر لازم شد)
function goToSubscriptionPlans() {
    window.location.href = '/subscription-plans'; // آدرس صفحه اشتراک‌ها را تنظیم کنید
}

// ممکن است در آینده بخواهید از این تابع برای نمایش پلن ها استفاده کنید
// function showSubscriptionPlans() {
//     document.getElementById('subscription-plans').style.display = 'flex'; // یا 'block'
//     // مخفی کردن عناصر قبلی
// }

// تابع buyPlan باید تعریف شود اگر دکمه‌های پلن فعال هستند
// function buyPlan(plan) {
//     alert("شما طرح " + plan + " را انتخاب کردید.");
//     // منطق خرید پلن
// }

// مقداردهی اولیه در هنگام بارگذاری صفحه (اگر نیاز باشد)
// document.addEventListener('DOMContentLoaded', () => {
//     // مثلاً اگر بخواهید بخشی را در ابتدا مخفی کنید یا نمایش دهید
// });
