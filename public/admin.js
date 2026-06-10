// admin.js
console.log("Admin module loaded.");

const createPieceForm = document.getElementById('create-piece-form');

if (createPieceForm) {
    createPieceForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // امنیت: دوباره رمز عبور را بپرسید
        const adminPassword = prompt("لطفاً برای تایید عملیات، رمز ادمین را وارد کنید:");
        if (!adminPassword) return;

        const name = document.getElementById('piece-name').value.trim();
        const description = document.getElementById('piece-description').value.trim();

        try {
            const response = await fetch('/create-piece', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: adminPassword, pieceData: { name, description } })
            });
            
            const result = await response.json();
            if (response.ok) {
                alert("قطعه با موفقیت ساخته شد!");
            } else {
                alert("خطا: " + (result.error || "رمز اشتباه است"));
            }
        } catch (error) {
            alert("خطا در ارتباط با سرور");
        }
    });
}
