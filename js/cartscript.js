// 初始化購物車資料：嘗試從 localStorage 讀取，若無則為空陣列
// 在做什麼：去瀏覽器的「記憶空間 (localStorage)」找找看有沒有之前存過的購物車資料。
// 為什麼需要：這樣使用者重新整理網頁或關掉瀏覽器再回來時，原本選好的麵包才不會消失。
// 刪掉會怎樣：每次重新整理網頁，購物車就會被歸零。
// 初學者難點：如果前面找不到資料（空值)，就給它一個空的陣列 []」。
let cart = JSON.parse(localStorage.getItem('bakeryCart')) || [];

// 當網頁載入完成後執行
//第一行是「等網頁所有東西都蓋好後再執行」。後面的 const 是在幫網頁上的按鈕、文字框取名字（變數），方便之後控制。
document.addEventListener('DOMContentLoaded', () => {
    const cartCountElement = document.getElementById('cart-count');
    const addToCartButtons = document.querySelectorAll('.btn-cart');
    const cartBtn = document.getElementById('cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutOverlay = document.getElementById('contact');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    //更新 cartscript.js 中的表單提交事件。移除 alert，改為顯示成功視窗，並在 3 秒後自動關閉（或點擊背景關閉）。
    const closeCheckout = document.getElementById('close-checkout');
    const checkoutItemsList = document.getElementById('checkout-items-list');
    const checkoutTotalAmount = document.getElementById('checkout-total-amount');
    const successOverlay = document.getElementById('success-overlay');
    const pickupDateInput = document.getElementById('pickup-date');
    const successOrderDetails = document.getElementById('success-order-details');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const phoneInput = document.getElementById('phone');

    // 初始化畫面：如果 localStorage 有資料，立即更新計數與清單
    cartCountElement.textContent = cart.length;
    renderCart();

    // 設定取貨日期範圍：隔日至兩週內
    // 設定取貨日期範圍：今日至兩週內
    if (pickupDateInput) {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        const formatDate = (date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };
        pickupDateInput.min = formatDate(today);
        const twoWeeksLater = new Date();
        twoWeeksLater.setDate(today.getDate() + 14);
        pickupDateInput.max = formatDate(twoWeeksLater);
    }

    // 電話欄位自動檢查：只允許輸入 10 位純數字
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            // 使用正規表達式移除非數字字元
            let val = e.target.value.replace(/\D/g, '');
            // 限制最大長度為 10 位
            if (val.length > 10) val = val.slice(0, 10);
            e.target.value = val;
        });
    }

    // 數量增減按鈕功能控制 (+/-)
    // e.target。這是在問電腦：「到底是哪一個按鈕被點到了？」因為網頁上有很多個 + 按鈕，電腦需要確認身份。
    document.querySelectorAll('.product-grid').forEach(grid => {
        grid.addEventListener('click', (e) => {
            if (e.target.classList.contains('qty-btn')) {
                const container = e.target.closest('.qty-selector');
                const input = container.querySelector('.item-qty');
                let val = parseInt(input.value) || 1;
                
                if (e.target.classList.contains('minus')) {
                    val = val > 1 ? val - 1 : 1;
                } else if (e.target.classList.contains('plus')) {
                    val++;
                }
                input.value = val;
            }
        });
    });

    // 為每一個「加入購物車」按鈕加上點擊事件
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 取得商品名稱與價格
            // 建議改用 closest 確保即使 HTML 結構微調也能準確找到容器
            const productCard = button.closest('.product-item') || button.parentElement;
            const productName = productCard.querySelector('h4').textContent;
            const productPrice = parseInt(productCard.querySelector('.price').textContent.replace('$', ''));
            const qtyInput = productCard.querySelector('.item-qty');
            const quantity = parseInt(qtyInput.value) || 1;
            
            for (let i = 0; i < quantity; i++) {
                cart.push({ name: productName, price: productPrice });
            }
            
            // 2. 更新右上角的數字
            cartCountElement.textContent = cart.length;

            // 保存到 localStorage
            saveCartToStorage();

            // 重置數量輸入框為 1
            qtyInput.value = 1;

            // 3. 更新清單 HTML
            renderCart();

            // 4. 製作簡單的視覺回饋
            const originalText = button.textContent;
            button.textContent = '✅ 已加入';
            
            setTimeout(() => {
                button.textContent = originalText;
            }, 1000);
        });
    });

    // 漢堡選單切換
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');
        hamburger.classList.toggle('toggle');
    });

    // 點擊選單連結後自動關閉選單 (針對手機版)
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('nav-active');
            hamburger.classList.remove('toggle');
        });
    });

    // 切換購物車視窗顯示/隱藏
    cartBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止事件冒泡
        //這是在叫電腦「不要把點擊事件傳給別人」，防止剛打開視窗就被後面的「點擊頁面其他地方關閉」功能給關掉。
        cartModal.classList.toggle('active');
    });

    // 點擊頁面其他地方關閉購物車
    document.addEventListener('click', () => cartModal.classList.remove('active'));
    cartModal.addEventListener('click', (e) => e.stopPropagation());

    // 點擊「前往結帳」
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('購物車是空的喔！');
            return;
        }
        cartModal.classList.remove('active'); // 隱藏小購物車
        checkoutOverlay.classList.add('active'); // 顯示結帳畫面
    });

    // 關閉結帳畫面
    closeCheckout.addEventListener('click', () => checkoutOverlay.classList.remove('active'));

    // 點擊背景（周遭灰底部分）也關閉結帳畫面
    checkoutOverlay.addEventListener('click', (e) => {
        // 檢查被點擊的目標是否就是背景遮罩本身（而不是內部的表單容器）
        if (e.target === checkoutOverlay) {
            checkoutOverlay.classList.remove('active');
        }
    });

    // 處理刪除商品邏輯 (使用事件委託)
    cartItemsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-item')) {
            const name = e.target.getAttribute('data-name');
            
            // 從原始陣列中找到第一個符合該名稱的索引並移除
            const itemIndex = cart.findIndex(item => item.name === name);
            if (itemIndex !== -1) {
                cart.splice(itemIndex, 1);
            }
            
            // 更新上方計數與清單介面
            cartCountElement.textContent = cart.length;
            
            // 保存到 localStorage
            saveCartToStorage();
            renderCart();
        }
    });

    // 點擊「返回首頁」按鈕
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            successOverlay.classList.remove('active');
            window.location.hash = '#home'; // 導航回首頁區塊
        });
    }

    // 處理表單提交成功後自動關閉
    document.getElementById('orderForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 驗證取貨日期是否為週三 (週三為公休日)
        const selectedPickupDate = new Date(pickupDateInput.value);
        if (selectedPickupDate.getDay() === 3) { // JavaScript Date.getDay() 0=週日, 1=週一, ..., 3=週三
            alert('週三為公休日，請選擇其他取貨日期！');
            return; // 阻止表單提交
        }

        // 擷取訂單資訊以顯示在成功視窗
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;

        // 驗證電話號碼是否剛好為 10 位
        if (phone.length !== 10) {
            alert('請填寫正確的 10 位數電話號碼！');
            return;
        }

        const date = pickupDateInput.value;
        const time = document.getElementById('pickup-time').value;

        // 處理購物車內容聚合
        //在 cart = []（清空購物車）之前先計算好訂單摘要，否則成功視窗會顯示為空。
        const groupedCart = [];
        cart.forEach(item => {
            const found = groupedCart.find(g => g.name === item.name);
            if (found) found.count++;
            else groupedCart.push({ ...item, count: 1 });
        });
        const total = cart.reduce((sum, item) => sum + item.price, 0);

        // 更新成功視窗的 HTML 內容
        successOrderDetails.innerHTML = `
            <div class="success-info-grid">
                <p><strong>取貨人：</strong>${name}</p>
                <p><strong>電話：</strong>${phone}</p>
                <p><strong>取貨日期：</strong>${date}</p>
                <p><strong>取貨時間：</strong>${time}</p>
            </div>
            <hr>
            <ul class="success-items-list">
                ${groupedCart.map(item => `<li>${item.name} x ${item.count}</li>`).join('')}
            </ul>
            <p class="success-total">總計金額：$${total}</p>
        `;

        // 隱藏結帳畫面
        checkoutOverlay.classList.remove('active');

        // 顯示成功動畫彈窗
        successOverlay.classList.add('active');

        cart = []; // 清空購物車
        saveCartToStorage(); // 同步清空 localStorage
        cartCountElement.textContent = '0';
        renderCart();
        e.target.reset(); // 重置表單
    });

    // 將購物車資料轉為 JSON 字串並存入 localStorage
    function saveCartToStorage() {
        localStorage.setItem('bakeryCart', JSON.stringify(cart));
    }

    // 更新清單的函式
    function renderCart() {
        // 1. 將購物車資料進行聚合 (合併同名商品)
        const groupedCart = [];
        cart.forEach(item => {
            const found = groupedCart.find(g => g.name === item.name);
            if (found) {
                found.count++;
            } else {
                // 使用解構賦值複製物件，並新增 count 屬性
                groupedCart.push({ ...item, count: 1 });
            }
        });

        // 更新列表內容
        cartItemsList.innerHTML = groupedCart.map((item) => `
            <li>
                <span>${item.name} x ${item.count}</span>
                <span>
                    $${item.price * item.count} 
                    <button class="delete-item" data-name="${item.name}">×</button>
                </span>
            </li>
        `).join('');
        
        // 計算總金額
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotalAmount.textContent = total;

        // 同步更新結帳畫面的明細 (不含刪除按鈕，僅供確認)
        if (checkoutItemsList) {
            checkoutItemsList.innerHTML = groupedCart.map(item => `
                <li>
                    <span>${item.name} x ${item.count}</span>
                    <span>$${item.price * item.count}</span>
                </li>
            `).join('');
        }
        if (checkoutTotalAmount) {
            checkoutTotalAmount.textContent = total;
        }
    }
});