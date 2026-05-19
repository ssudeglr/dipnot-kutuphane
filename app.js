// --- Sınıflar ---
class Kitap {
    constructor(id, ad, yazar, kapak) {
        this.kitap_id = id;
        this.ad = ad;
        this.yazar = yazar;
        this.kapak = kapak || 'https://via.placeholder.com/90x130?text=Book';
        this.durum = 'Rafta';
    }
    durumGuncelle(yeniDurum) {
        this.durum = yeniDurum;
    }
}
class Uye {
    constructor(id, ad, soyad) {
        this.uye_id = id;
        this.ad = ad;
        this.soyad = soyad;
    }
}
class Odunc {
    constructor(kitap, uye, tarih) {
        this.kitap = kitap;
        this.uye = uye;
        this.tarih = tarih;
        this.durum = 'Ödünçte';
    }
    iadeEt() {
        this.durum = 'İade Edildi';
        this.kitap.durumGuncelle('Rafta');
    }
    oduncBilgisi() {
        return `${this.kitap.ad} - ${this.uye.ad} ${this.uye.soyad} (${this.tarih})`;
    }
}
// --- Veri Yapıları ---
let kitaplar = [
    new Kitap(1, 'Suç ve Ceza', 'Dostoyevski', 'https://covers.openlibrary.org/b/id/10523338-L.jpg'),
    new Kitap(2, 'Kürk Mantolu Madonna', 'Sabahattin Ali', 'https://covers.openlibrary.org/b/id/10523339-L.jpg'),
    new Kitap(3, 'Sefiller', 'Victor Hugo', 'https://covers.openlibrary.org/b/id/10523340-L.jpg'),
    new Kitap(4, 'Simyacı', 'Paulo Coelho', 'https://covers.openlibrary.org/b/id/10523341-L.jpg'),
    new Kitap(5, 'Bülbülü Öldürmek', 'Harper Lee', 'https://covers.openlibrary.org/b/id/10523342-L.jpg')
];
let uyeler = [
    new Uye(1, 'Ahmet', 'Yılmaz'),
    new Uye(2, 'Ayşe', 'Demir')
];
let oduncler = [];
// --- Carousel/Kitaplar ---
function guncelleBookCarousel() {
    const carousel = document.getElementById('bookCarousel');
    carousel.innerHTML = '';
    kitaplar.forEach(k => {
        const div = document.createElement('div');
        div.className = 'book-card';
        div.innerHTML = `<img src="${k.kapak}" alt="${k.ad}"><div class="book-title">${k.ad}</div><div class="book-author">${k.yazar}</div>`;
        carousel.appendChild(div);
    });
}
// --- Modal Yönetimi ---
function openModal(id) {
    document.getElementById(id).classList.add('active');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}
document.querySelectorAll('.close').forEach(btn => {
    btn.onclick = () => closeModal(btn.getAttribute('data-close'));
});
window.onclick = function(e) {
    document.querySelectorAll('.modal').forEach(modal => {
        if (e.target === modal) modal.classList.remove('active');
    });
};
// --- Tablo Güncellemeleri ---
function guncelleKitapTablo() {
    const tbody = document.querySelector('#kitapTable tbody');
    tbody.innerHTML = '';
    kitaplar.forEach(k => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${k.kitap_id}</td><td>${k.ad}</td><td>${k.yazar}</td><td>${k.durum}</td>`;
        tbody.appendChild(tr);
    });
}
function guncelleUyeTablo() {
    const tbody = document.querySelector('#uyeTable tbody');
    tbody.innerHTML = '';
    uyeler.forEach((u, idx) => {
        const tr = document.createElement('tr');
        let silBtn = '';
        if(isAdmin) {
            silBtn = `<button class='uye-sil-btn' data-uye='${u.uye_id}'>Sil</button>`;
        }
        tr.innerHTML = `<td>${u.uye_id}</td><td>${u.ad}</td><td>${u.soyad}${silBtn}</td>`;
        tbody.appendChild(tr);
    });
    // Sil butonlarına event ekle
    if(isAdmin) {
        document.querySelectorAll('.uye-sil-btn').forEach(btn => {
            btn.onclick = function() {
                const uyeId = parseInt(this.getAttribute('data-uye'));
                // userList ve uyeler'den sil
                uyeler = uyeler.filter(u => u.uye_id !== uyeId);
                userList = userList.filter(u => u.uye_id !== uyeId);
                guncelleUyeTablo();
            };
        });
    }
}
function guncelleOduncTablo() {
    const tbody = document.querySelector('#oduncTable tbody');
    tbody.innerHTML = '';
    oduncler.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${o.kitap.ad}</td><td>${o.uye.ad} ${o.uye.soyad}</td><td>${o.tarih}</td><td>${o.durum}</td>`;
        tbody.appendChild(tr);
    });
}
// --- Modal Açma Butonları ---
document.getElementById('btnKitapEkle').onclick = () => openModal('kitapModal');
document.getElementById('btnUyeEkle').onclick = () => openModal('uyeModal');
document.getElementById('btnOduncVer').onclick = () => {
    // Sadece rafta olan kitaplar ve tüm üyeler
    const kitapSelect = document.getElementById('oduncKitap');
    kitapSelect.innerHTML = kitaplar.filter(k => k.durum === 'Rafta').map(k => `<option value="${k.kitap_id}">${k.ad}</option>`).join('');
    const uyeSelect = document.getElementById('oduncUye');
    uyeSelect.innerHTML = uyeler.map(u => `<option value="${u.uye_id}">${u.ad} ${u.soyad}</option>`).join('');
    openModal('oduncModal');
};
document.getElementById('btnIadeEt').onclick = () => {
    // Sadece ödünçte olanlar
    const oduncSelect = document.getElementById('iadeOdunc');
    oduncSelect.innerHTML = oduncler.filter(o => o.durum === 'Ödünçte').map((o, i) => `<option value="${i}">${o.kitap.ad} - ${o.uye.ad} ${o.uye.soyad}</option>`).join('');
    openModal('iadeModal');
};
// --- Formlar ---
document.getElementById('kitapForm').onsubmit = function(e) {
    e.preventDefault();
    const ad = document.getElementById('kitapAd').value.trim();
    const yazar = document.getElementById('kitapYazar').value.trim();
    let kapak = prompt('Kitap kapak görseli URL (boş bırakılırsa varsayılan):');
    if(ad && yazar) {
        kitaplar.push(new Kitap(kitaplar.length+1, ad, yazar, kapak));
        guncelleKitapTablo();
        guncelleBookCarousel();
        closeModal('kitapModal');
        this.reset();
    }
};
document.getElementById('uyeForm').onsubmit = function(e) {
    e.preventDefault();
    const ad = document.getElementById('uyeAd').value.trim();
    const soyad = document.getElementById('uyeSoyad').value.trim();
    if(ad && soyad) {
        uyeler.push(new Uye(uyeler.length+1, ad, soyad));
        guncelleUyeTablo();
        closeModal('uyeModal');
        this.reset();
    }
};
document.getElementById('oduncForm').onsubmit = function(e) {
    e.preventDefault();
    const kitapId = parseInt(document.getElementById('oduncKitap').value);
    const uyeId = parseInt(document.getElementById('oduncUye').value);
    const kitap = kitaplar.find(k => k.kitap_id === kitapId);
    const uye = uyeler.find(u => u.uye_id === uyeId);
    if(kitap && uye && kitap.durum === 'Rafta') {
        kitap.durumGuncelle('Ödünçte');
        oduncler.push(new Odunc(kitap, uye, new Date().toLocaleDateString('tr-TR')));
        guncelleKitapTablo();
        guncelleOduncTablo();
        guncelleBookCarousel();
        closeModal('oduncModal');
        this.reset();
    }
};
document.getElementById('iadeForm').onsubmit = function(e) {
    e.preventDefault();
    const oduncIndex = parseInt(document.getElementById('iadeOdunc').value);
    const odunc = oduncler[oduncIndex];
    if(odunc && odunc.durum === 'Ödünçte') {
        odunc.iadeEt();
        guncelleKitapTablo();
        guncelleOduncTablo();
        guncelleBookCarousel();
        closeModal('iadeModal');
        this.reset();
    }
};
// --- Sayfa Yüklenince Tabloyu ve Carousel'i Güncelle ---
guncelleKitapTablo();
guncelleUyeTablo();
guncelleOduncTablo();
guncelleBookCarousel();

// --- Bookstore Bölümü ---
const bookstoreBooks = [
    {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg'
    },
    {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        cover: 'https://covers.openlibrary.org/b/id/8228691-L.jpg'
    },
    {
        title: '1984',
        author: 'George Orwell',
        cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg'
    },
    {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        cover: 'https://covers.openlibrary.org/b/id/8091016-L.jpg'
    },
    {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        cover: 'https://covers.openlibrary.org/b/id/6979861-L.jpg'
    },
    {
        title: 'Moby-Dick',
        author: 'Herman Melville',
        cover: 'https://covers.openlibrary.org/b/id/5552226-L.jpg'
    },
    {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        cover: 'https://covers.openlibrary.org/b/id/8231856-L.jpg'
    },
    {
        title: 'Brave New World',
        author: 'Aldous Huxley',
        cover: 'https://covers.openlibrary.org/b/id/8775116-L.jpg'
    },
    {
        title: 'The Little Prince',
        author: 'Antoine de Saint-Exupéry',
        cover: 'https://covers.openlibrary.org/b/id/9251996-L.jpg'
    },
    {
        title: 'War and Peace',
        author: 'Leo Tolstoy',
        cover: 'https://covers.openlibrary.org/b/id/7222161-L.jpg'
    }
];
function renderBookstore() {
    const grid = document.getElementById('bookstoreGrid');
    grid.innerHTML = '';
    bookstoreBooks.forEach(book => {
        const div = document.createElement('div');
        div.className = 'bookstore-card';
        div.innerHTML = `<img src="${book.cover}" alt="${book.title}"><div class="book-title">${book.title}</div><div class="book-author">${book.author}</div>`;
        grid.appendChild(div);
    });
}
// Navbar Bookstore menüsüne tıklama
const navBookstore = document.querySelector('.nav-menu li a[href="#"]');
if(navBookstore) {
    navBookstore.onclick = function(e) {
        e.preventDefault();
        document.querySelector('.hero').style.display = 'none';
        document.querySelector('.bestseller-header').style.display = 'none';
        document.querySelector('.book-carousel').style.display = 'none';
        document.querySelector('.actions').style.display = 'none';
        document.querySelector('.tables').style.display = 'none';
        document.getElementById('bookstoreSection').style.display = 'block';
        renderBookstore();
    };
}
// Ana sayfaya dönmek için logo tıklanırsa ana bölümler gösterilsin
const logo = document.querySelector('.bink-logo');
if(logo) {
    logo.onclick = function() {
        document.querySelector('.hero').style.display = '';
        document.querySelector('.bestseller-header').style.display = '';
        document.querySelector('.book-carousel').style.display = '';
        document.querySelector('.actions').style.display = '';
        document.querySelector('.tables').style.display = '';
        document.getElementById('bookstoreSection').style.display = 'none';
    };
}

// --- Giriş Modalı (Yönetici/Üye) ---
let isAdmin = false;
let currentUser = null;
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const loginText = document.getElementById('loginText');
const tabAdmin = document.getElementById('tabAdmin');
const tabUser = document.getElementById('tabUser');
const adminLoginForm = document.getElementById('adminLoginForm');
const userLoginForm = document.getElementById('userLoginForm');
const adminLoginError = document.getElementById('adminLoginError');
const userLoginError = document.getElementById('userLoginError');

// Sekme geçişleri
function showAdminTab() {
    tabAdmin.classList.add('active');
    tabUser.classList.remove('active');
    adminLoginForm.style.display = '';
    userLoginForm.style.display = 'none';
}
function showUserTab() {
    tabAdmin.classList.remove('active');
    tabUser.classList.add('active');
    adminLoginForm.style.display = 'none';
    userLoginForm.style.display = '';
}
tabAdmin.onclick = showAdminTab;
tabUser.onclick = showUserTab;

// Yönetici girişi (login modalı üzerinden)
adminLoginForm.onsubmit = function(e) {
    e.preventDefault();
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPass').value.trim();
    if(user === 'admin' && pass === '1234') {
        isAdmin = true;
        currentUser = null;
        closeModal('loginModal');
        adminLoginError.textContent = '';
        loginText.textContent = 'Yönetici (Çıkış)';
        document.getElementById('adminPanel').style.display = '';
    } else {
        adminLoginError.textContent = 'Kullanıcı adı veya şifre yanlış!';
    }
};
// Çıkış işlemi (Log In butonuna tekrar tıklanınca)
loginBtn.onclick = function() {
    if(isAdmin || currentUser) {
        isAdmin = false;
        currentUser = null;
        loginText.textContent = 'Log In';
        document.getElementById('adminPanel').style.display = 'none';
        return;
    }
    openModal('loginModal');
};

// Üye girişi (örnek: uye1/1234, uye2/1234 ...)
userLoginForm.onsubmit = function(e) {
    e.preventDefault();
    const user = document.getElementById('userUser').value.trim();
    const pass = document.getElementById('userPass').value.trim();
    // Basit örnek: uye1/1234, uye2/1234
    if(/^uye\d+$/.test(user) && pass === '1234') {
        isAdmin = false;
        currentUser = user;
        closeModal('loginModal');
        userLoginError.textContent = '';
        loginText.textContent = user + ' (Çıkış)';
        disableAdminPanel();
    } else {
        userLoginError.textContent = 'Üye adı veya şifre yanlış!';
    }
};
function enableAdminPanel() {
    document.querySelector('.actions').style.display = '';
    document.querySelector('.tables').style.display = '';
    guncelleUyeTablo();
}
function disableAdminPanel() {
    document.querySelector('.actions').style.display = 'none';
    document.querySelector('.tables').style.display = 'none';
}
// Sayfa açılışında yönetim paneli gizli olsun
window.addEventListener('DOMContentLoaded', function() {
    if(!isAdmin) disableAdminPanel();
});

// --- Kayıt Dizileri ---
let adminList = [{id:'admin', ad:'Admin', soyad:'', email:'', tel:'', gorev:'Yönetici', pass:'1234'}];
let userList = [{ad:'uye1', soyad:'Deneme', email:'', tel:'', dogum:'', pass:'1234'}];

// Kayıt Ol butonları
const adminRegisterBtn = document.getElementById('adminRegisterBtn');
const userRegisterBtn = document.getElementById('userRegisterBtn');
adminRegisterBtn.onclick = () => { closeModal('loginModal'); openModal('adminRegisterModal'); };
userRegisterBtn.onclick = () => { closeModal('loginModal'); openModal('userRegisterModal'); };

// Yönetici kayıt
const adminRegisterForm = document.getElementById('adminRegisterForm');
const adminRegisterError = document.getElementById('adminRegisterError');
adminRegisterForm.onsubmit = function(e) {
    e.preventDefault();
    const id = document.getElementById('regAdminId').value.trim();
    const ad = document.getElementById('regAdminAd').value.trim();
    const soyad = document.getElementById('regAdminSoyad').value.trim();
    const email = document.getElementById('regAdminEmail').value.trim();
    const tel = document.getElementById('regAdminTel').value.trim();
    const gorev = document.getElementById('regAdminGorev').value.trim();
    const pass = document.getElementById('regAdminPass').value.trim();
    if(adminList.find(a => a.id === id)) {
        adminRegisterError.textContent = 'Bu ID ile yönetici zaten var!';
        return;
    }
    adminList.push({id, ad, soyad, email, tel, gorev, pass});
    adminRegisterError.textContent = '';
    closeModal('adminRegisterModal');
    openModal('loginModal');
    showAdminTab();
};
// Üye kayıt
const userRegisterForm = document.getElementById('userRegisterForm');
const userRegisterError = document.getElementById('userRegisterError');
userRegisterForm.onsubmit = function(e) {
    e.preventDefault();
    const ad = document.getElementById('regUserAd').value.trim();
    const soyad = document.getElementById('regUserSoyad').value.trim();
    const email = document.getElementById('regUserEmail').value.trim();
    const tel = document.getElementById('regUserTel').value.trim();
    const dogum = document.getElementById('regUserDogum').value.trim();
    const pass = document.getElementById('regUserPass').value.trim();
    if(userList.find(u => u.ad === ad && u.soyad === soyad)) {
        userRegisterError.textContent = 'Bu ad-soyad ile üye zaten var!';
        return;
    }
    const uye_id = uyeler.length ? uyeler[uyeler.length-1].uye_id+1 : 1;
    uyeler.push({uye_id, ad, soyad});
    userList.push({uye_id, ad, soyad, email, tel, dogum, pass});
    userRegisterError.textContent = '';
    closeModal('userRegisterModal');
    openModal('loginModal');
    showUserTab();
    guncelleUyeTablo();
};

// Bestseller ve Recommended Books için örnek kitaplar
const bestsellers = [
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', cover: 'https://covers.openlibrary.org/b/id/8228691-L.jpg' },
    { title: '1984', author: 'George Orwell', cover: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' },
    { title: 'Pride and Prejudice', author: 'Jane Austen', cover: 'https://covers.openlibrary.org/b/id/8091016-L.jpg' },
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', cover: 'https://covers.openlibrary.org/b/id/6979861-L.jpg' },
    { title: 'Moby-Dick', author: 'Herman Melville', cover: 'https://covers.openlibrary.org/b/id/5552226-L.jpg' },
    { title: 'The Catcher in the Rye', author: 'J.D. Salinger', cover: 'https://covers.openlibrary.org/b/id/8231856-L.jpg' },
];
const recommended = [
    { title: 'War and Peace', author: 'Leo Tolstoy', cover: 'https://covers.openlibrary.org/b/id/7222161-L.jpg' },
    { title: 'Brave New World', author: 'Aldous Huxley', cover: 'https://covers.openlibrary.org/b/id/8775116-L.jpg' },
    { title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', cover: 'https://covers.openlibrary.org/b/id/9251996-L.jpg' },
    { title: 'Sefiller', author: 'Victor Hugo', cover: 'https://covers.openlibrary.org/b/id/10523340-L.jpg' },
    { title: 'Simyacı', author: 'Paulo Coelho', cover: 'https://covers.openlibrary.org/b/id/10523341-L.jpg' },
    { title: 'Bülbülü Öldürmek', author: 'Harper Lee', cover: 'https://covers.openlibrary.org/b/id/10523342-L.jpg' },
];

function renderBestsellers() {
    const carousel = document.getElementById('bookCarousel');
    if (!carousel) return;
    carousel.innerHTML = '';
    bestsellers.forEach(book => {
        const div = document.createElement('div');
        div.className = 'book-card';
        div.innerHTML = `<img src="${book.cover}" alt="${book.title}"><div class="book-title">${book.title}</div><div class="book-author">${book.author}</div>`;
        carousel.appendChild(div);
    });
}
function renderRecommended() {
    const grid = document.getElementById('recommendedGrid');
    if (!grid) return;
    grid.innerHTML = '';
    recommended.forEach(book => {
        const div = document.createElement('div');
        div.className = 'recommended-card';
        div.innerHTML = `<img src="${book.cover}" alt="${book.title}"><div class="recommended-title">${book.title}</div><div class="recommended-author">${book.author}</div>`;
        grid.appendChild(div);
    });
}
window.addEventListener('DOMContentLoaded', function() {
    renderBestsellers();
    renderRecommended();
});
