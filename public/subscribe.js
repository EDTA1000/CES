async function handleSubscribe() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success) {
        alert(data.message);
        // اگر دسترسی تایید شد، کاربر را به صفحه اصلی برگردان
        window.location.href = 'index.html';
    } else {
        alert("خطا: " + data.message);
    }
}
