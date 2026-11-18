import { initializeApp } from "https://gstatic.com";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from "https://gstatic.com";

const firebaseConfig = {
  apiKey: "AIzaSyAP37GTj_IM3ZDc0ZFkirOT6_b4L0Tw6g4",
  authDomain: "://firebaseapp.com",
  projectId: "ejad-taif",
  storageBucket: "ejad-taif.firebasestorage.app",
  messagingSenderId: "534238571388",
  appId: "1:534238571388:web:a1ef30d5e05a701ac652f9",
  measurementId: "G-0EVQMRHKJQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const itemsRef = collection(db, "ejad_items");

let records = [];

// الاستماع اللحظي للبيانات من Firebase وتحديث القائمة تلقائياً
const q = query(itemsRef, orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
  records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  if (document.getElementById('view-list').classList.contains('active')) {
    renderList(document.getElementById('search-input').value);
  }
});

const heroHeaders = {
  home: { title: 'منصة إيجاد الرقمية بالكلية التقنية بالطائف', subtitle: 'منصة إلكترونية متطورة للإبلاغ، تسجيل وتتبع المفقودات' },
  qr: { title: 'إنشاء QR', subtitle: 'توليد رمز استجابة سريعة لبيانات الغرض' },
  list: { title: 'قائمة المفقودات', subtitle: 'استعراض والبحث في جميع البلاغات المسجلة' },
  support: { title: 'الدعم الفني', subtitle: 'تواصل مباشر مع فريق الدعم بالكلية التقنية بالطائف' },
  help: { title: 'المساعدة', subtitle: 'دليل استخدام منصة إيجاد الرقمية بالكلية التقنية بالطائف' },
  info: { title: 'معلومات', subtitle: 'معلومات عن منصة إيجاد الرقمية بالكلية التقنية بالطائف' }
};

window.closeWelcome = function() {
  const modal = document.getElementById('welcome-modal');
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
};

window.toggleMenu = function() {
  document.getElementById('side-menu').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
};

window.navigateMenu = function(id) {
  window.toggleMenu();
  window.showView(id);
};

window.navigateForm = function(status) {
  window.toggleMenu();
  window.openForm(status);
};

window.showView = function(id) {
  document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
  const home = document.getElementById('view-home');
  const hero = document.getElementById('main-hero');
  
  if (heroHeaders[id]) {
    document.getElementById('hero-title').innerText = heroHeaders[id].title;
    document.getElementById('hero-subtitle').innerText = heroHeaders[id].subtitle;
  }

  if (id === 'home') {
    home.style.display = 'flex';
    hero.classList.remove('compact');
    document.body.classList.remove('sub-view-active');
  } else {
    home.style.display = 'none';
    hero.classList.add('compact');
    document.body.classList.add('sub-view-active');
    document.getElementById('view-' + id).classList.add('active');
    if (id === 'list') window.renderList();
  }
};

window.openForm = function(status) {
  document.getElementById('item-status').value = status;
  const titleText = status === 'معثور عليه' ? 'تسجيل غرض جديد' : 'الإبلاغ عن غرض مفقود';
  document.getElementById('form-title').innerText = titleText;
  document.getElementById('hero-title').innerText = titleText;
  document.getElementById('hero-subtitle').innerText = 'أدخل بيانات الغرض بدقة لتسهيل عملية الوصول';
  document.getElementById('photo-preview-box').style.display = 'none';
  window.showView('form');
};

window.previewPhoto = function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('photo-preview').src = e.target.result;
      document.getElementById('photo-preview-box').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
};

function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxWidth = 400;
      const scale = maxWidth / img.width;
      canvas.width = img.width > maxWidth ? maxWidth : img.width;
      canvas.height = img.width > maxWidth ? img.height * scale : img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

window.addItem = async function(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.innerText = 'جاري الحفظ في السحابة...';
  submitBtn.disabled = true;

  const fileInput = document.getElementById('item-image');
  const file = fileInput.files[0];

  const saveToFirebase = async (compressedImg) => {
    try {
      await addDoc(itemsRef, {
        status: document.getElementById('item-status').value,
        name: document.getElementById('item-name').value,
        loc: document.getElementById('item-loc').value,
        phone: document.getElementById('item-phone').value,
        image: compressedImg || '',
        createdAt: Date.now()
      });
      e.target.reset();
      document.getElementById('photo-preview-box').style.display = 'none';
      window.showView('list');
    } catch (error) {
      alert('تأكد من تفعيل Firestore Database في وضع الاختبار: ' + error.message);
    } finally {
      submitBtn.innerText = 'حفظ في النظام';
      submitBtn.disabled = false;
    }
  };

  if (file) {
    compressImage(file, saveToFirebase);
  } else {
    saveToFirebase('');
  }
};

window.renderList = function(filter = '') {
  const box = document.getElementById('items-list');
  box.innerHTML = '';
  
  const filtered = records.filter(r => r.name.includes(filter) || r.loc.includes(filter));
  
  if (filtered.length === 0) {
    box.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">لا توجد بلاغات مسجلة حالياً.</p>';
    return;
  }

  filtered.forEach(r => {
    const statusColor = r.status === 'معثور عليه' ? '#006c35' : '#dc2626';
    const imgTag = r.image 
      ? `<img src="${r.image}" alt="${r.name}" style="width:65px; height:65px; object-fit:cover; border-radius:10px; border:1px solid #cbd5e1; flex-shrink:0;">` 
      : '';
    
    box.innerHTML += `
      <div class="item-card">
        <div style="display:flex; align-items:center; gap:12px;">
          ${imgTag}
          <div>
            <span style="font-size:0.8rem; font-weight:bold; color:${statusColor}">${r.status}</span>
            <h4 style="margin:4px 0;">${r.name}</h4>
            <p style="font-size:0.85rem; color:#64748b;">📍 ${r.loc}</p>
          </div>
        </div>
        <strong style="font-size:0.9rem;">${r.phone}</strong>
      </div>
    `;
  });
};

window.searchItems = function() {
  window.showView('list');
  window.renderList(document.getElementById('search-input').value);
};

window.makeQR = function() {
  const val = document.getElementById('qr-data').value;
  if (!val) return alert('أدخل البيانات أولاً');
  
  document.getElementById('qr-img').src = 'https://qrserver.com' + encodeURIComponent(val);
  document.getElementById('qr-output').style.display = 'block';
};
