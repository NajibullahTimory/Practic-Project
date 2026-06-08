// ═══════════════════════════════════
//  AUTH GUARD + GREETING
// ═══════════════════════════════════
(function () {
    var role = sessionStorage.getItem('pubg_role');
    var name = sessionStorage.getItem('pubg_name') || 'Player';
    if (!role) { window.location.href = 'login.html'; return; }
    if (role === 'admin') document.body.classList.add('is-admin');

    window.addEventListener('DOMContentLoaded', function () {
        var badge = document.getElementById('role-badge');
        if (badge) {
            badge.textContent = role === 'admin' ? '▣ ADMIN' : '◈ USER';
            badge.className = 'role-chip ' + role;
        }
        var bar  = document.getElementById('greeting-bar');
        var text = document.getElementById('greeting-text');
        if (bar && text) {
            var h = new Date().getHours();
            var g = h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
            if (role === 'admin') {
                text.innerHTML = '// ' + g + ', <strong style="color:#e01830;font-family:\'Share Tech Mono\',monospace">' + name.toUpperCase() + '</strong> &nbsp;·&nbsp; Welcome back, Admin. Full control is yours.';
            } else {
                text.innerHTML = '// ' + g + ', <strong style="color:#4fc3f7;font-family:\'Share Tech Mono\',monospace">' + name.toUpperCase() + '</strong> &nbsp;·&nbsp; Welcome to PUBG Marketplace. You can add and browse listings.';
            }
        }
    });
})();

function logout() {
    sessionStorage.removeItem('pubg_role');
    sessionStorage.removeItem('pubg_name');
    window.location.href = 'login.html';
}

// ═══════════════════════════════════
//  INDEXEDDB — MEDIA STORAGE
// ═══════════════════════════════════
var DB_NAME    = 'pubg_media_db';
var DB_VERSION = 1;
var DB_STORE   = 'media';
var _db        = null;

function openDB() {
    return new Promise(function (resolve, reject) {
        if (_db) { resolve(_db); return; }
        var req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = function (e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE, { keyPath: 'key' });
            }
        };
        req.onsuccess = function (e) { _db = e.target.result; resolve(_db); };
        req.onerror   = function (e) { reject(e.target.error); };
    });
}

function saveMedia(key, mediaArray) {
    return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx    = db.transaction(DB_STORE, 'readwrite');
            var store = tx.objectStore(DB_STORE);
            var req   = store.put({ key: key, data: mediaArray });
            req.onsuccess = function () { resolve(); };
            req.onerror   = function (e) { reject(e.target.error); };
        });
    });
}

function loadMedia(key) {
    return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx    = db.transaction(DB_STORE, 'readonly');
            var store = tx.objectStore(DB_STORE);
            var req   = store.get(key);
            req.onsuccess = function (e) {
                resolve(e.target.result ? e.target.result.data : []);
            };
            req.onerror = function (e) { reject(e.target.error); };
        });
    });
}

function deleteMedia(key) {
    return openDB().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx    = db.transaction(DB_STORE, 'readwrite');
            var store = tx.objectStore(DB_STORE);
            var req   = store.delete(key);
            req.onsuccess = function () { resolve(); };
            req.onerror   = function (e) { reject(e.target.error); };
        });
    });
}

// ═══════════════════════════════════
//  PROFIT CALCULATOR — 10% of price
// ═══════════════════════════════════
function calcProfit(input) {
    var badge = document.getElementById('profit-badge');
    if (!badge) return;
    var raw   = (input.value || '').replace(/,/g, '');
    var m     = raw.match(/[\d]+(?:\.\d+)?/);
    var price = m ? parseFloat(m[0]) : NaN;
    if (isNaN(price) || price <= 0) { badge.style.display = 'none'; return; }
    var benefit = Math.round(price * 0.10);
    badge.style.display = 'block';
    badge.textContent   = '◈ SELLER BENEFIT: +' + benefit.toLocaleString() + ' (10% of price)';
}

function getSellerBenefit(priceStr) {
    var raw = (priceStr || '').replace(/,/g, '');
    var m   = raw.match(/[\d]+(?:\.\d+)?/);
    if (!m) return 0;
    var price = parseFloat(m[0]);
    if (isNaN(price) || price <= 0) return 0;
    return Math.round(price * 0.10);
}

// ═══════════════════════════════════
//  PRICE FILTER
// ═══════════════════════════════════
var priceFilter = null;

function extractNum(s) {
    var m = (s || '').replace(/,/g, '').match(/[\d]+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
}

function applyMaxFilter() {
    var max = parseFloat(document.getElementById('pf-max').value);
    if (isNaN(max)) { alert('Enter a valid max price.'); return; }
    priceFilter = { mode: 'max', max: max };
    filterCards();
}

function applyRangeFilter() {
    var min = parseFloat(document.getElementById('pf-min').value) || 0;
    var max = parseFloat(document.getElementById('pf-rmax').value);
    if (isNaN(max)) { alert('Enter a valid max price.'); return; }
    priceFilter = { mode: 'range', min: min, max: max };
    filterCards();
}

function clearPriceFilter() {
    priceFilter = null;
    ['pf-max','pf-min','pf-rmax'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
    filterCards();
}

function filterCards() {
    document.querySelectorAll('.card').forEach(function (card) {
        var p = card.querySelector('.card-price');
        if (!p) { card.classList.remove('price-hidden'); return; }
        var price = extractNum(p.textContent);
        if (!priceFilter || price === null) { card.classList.remove('price-hidden'); return; }
        var visible;
        if (priceFilter.mode === 'max') {
            visible = price <= priceFilter.max;
        } else {
            visible = price >= priceFilter.min && price <= priceFilter.max;
        }
        card.classList.toggle('price-hidden', !visible);
    });
}

function clearSearch() {
    document.getElementById('global-search').value = '';
    document.getElementById('search-clear').classList.remove('visible');
    document.getElementById('search-results').classList.remove('open');
}

function esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════
//  MARKETPLACE
// ═══════════════════════════════════
var market;

window.addEventListener('DOMContentLoaded', function () {
    market = new Market();
});

function Market() {
    this.accounts   = JSON.parse(localStorage.getItem('pubg_accounts') || '[]');
    this.uc         = JSON.parse(localStorage.getItem('pubg_uc')       || '[]');
    this.trade      = JSON.parse(localStorage.getItem('pubg_trade')    || '[]');
    this.accMedia   = [];
    this.trMedia    = [];
    this.stTimeout  = null;

    var self = this;

    // ── NAVIGATION ──
    document.querySelectorAll('.ntab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.ntab').forEach(function(b){ b.classList.remove('active'); });
            btn.classList.add('active');
            document.querySelectorAll('.pg').forEach(function(s){ s.classList.remove('active'); });
            document.getElementById(btn.dataset.page + '-page').classList.add('active');
            filterCards();
        });
    });

    // ── FORMS ──
    document.getElementById('account-form').addEventListener('submit', function(e){ self.addAccount(e); });
    document.getElementById('uc-form').addEventListener('submit',      function(e){ self.addUC(e); });
    document.getElementById('trade-form').addEventListener('submit',   function(e){ self.addTrade(e); });

    // ── MEDIA INPUTS ──
    document.getElementById('acc-media-input').addEventListener('change', function(e){
        self.pickMedia(e.target.files, 'acc');
    });
    document.getElementById('media-input').addEventListener('change', function(e){
        self.pickMedia(e.target.files, 'tr');
    });

    // ── MODAL CLOSE ──
    document.getElementById('modal').addEventListener('click', function(e){
        if (e.target.id === 'modal') closeModal();
    });

    // ── SEARCH ──
    var si = document.getElementById('global-search');
    si.addEventListener('input', function(e) {
        var q = e.target.value.trim();
        document.getElementById('search-clear').classList.toggle('visible', q.length > 0);
        clearTimeout(self.stTimeout);
        self.stTimeout = setTimeout(function(){ self.doSearch(q); }, 180);
    });
    si.addEventListener('focus', function() {
        if (si.value.trim()) self.doSearch(si.value.trim());
    });
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-zone')) {
            document.getElementById('search-results').classList.remove('open');
        }
    });

    // ── RENDER WITH MEDIA FROM INDEXEDDB ──
    this.renderAll();
}

Market.prototype.pickMedia = function (files, ctx) {
    var arr = ctx === 'acc' ? this.accMedia : this.trMedia;
    var pid = ctx === 'acc' ? 'acc-media-previews' : 'media-previews';
    var iid = ctx === 'acc' ? 'acc-media-input' : 'media-input';
    var self = this;
    Array.from(files).forEach(function (f) {
        var i = arr.length;
        arr.push(f);
        self.showPreview(f, i, pid, arr);
    });
    document.getElementById(iid).value = '';
};

Market.prototype.showPreview = function (file, idx, cid, arr) {
    var c    = document.getElementById(cid);
    var item = document.createElement('div');
    item.className = 'prev-item';
    var url = URL.createObjectURL(file);
    var el  = document.createElement(file.type.startsWith('video/') ? 'video' : 'img');
    el.src  = url;
    if (el.tagName === 'VIDEO') { el.muted = true; el.playsInline = true; }
    item.appendChild(el);
    var rm = document.createElement('button');
    rm.className = 'rm';
    rm.textContent = '✕';
    rm.addEventListener('click', function () { arr.splice(idx, 1); item.remove(); });
    item.appendChild(rm);
    c.appendChild(item);
};

Market.prototype.toB64 = function (file) {
    return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onload  = function () { resolve({ dataUrl: r.result, type: file.type }); };
        r.onerror = reject;
        r.readAsDataURL(file);
    });
};

// ── ADD ACCOUNT ──
Market.prototype.addAccount = function (e) {
    e.preventDefault();
    var self = this;
    var btn  = document.querySelector('#account-form .btn-submit');
    btn.textContent = 'UPLOADING...'; btn.disabled = true;

    var mediaFiles = this.accMedia.slice();
    var promises   = mediaFiles.map(function(f){ return self.toB64(f); });

    Promise.all(promises).then(function (mediaData) {
        var item = {
            id:          Date.now(),
            username:    document.getElementById('acc-username').value,
            rank:        document.getElementById('acc-rank').value,
            level:       document.getElementById('acc-level').value,
            items:       document.getElementById('acc-items').value,
            price:       document.getElementById('acc-price').value,
            description: document.getElementById('acc-description').value,
            listedBy:    sessionStorage.getItem('pubg_name') || 'Unknown',
            date:        new Date().toLocaleDateString()
        };

        // Save media to IndexedDB
        var key = 'acc_' + item.id;
        saveMedia(key, mediaData).catch(function(){});

        self.accounts.unshift(item);
        self.saveAccounts();

        document.getElementById('account-form').reset();
        document.getElementById('acc-media-previews').innerHTML = '';
        document.getElementById('profit-badge').style.display = 'none';
        self.accMedia = [];

        btn.textContent = '▶ LIST ACCOUNT'; btn.disabled = false;

        // Re-render and load the new card's media
        self.renderAccounts();
        alert('✓ Account listed!');
    }).catch(function () {
        btn.textContent = '▶ LIST ACCOUNT'; btn.disabled = false;
        alert('Error uploading media. Try again.');
    });
};

// ── ADD UC ──
Market.prototype.addUC = function (e) {
    e.preventDefault();
    var item = {
        id:       Date.now(),
        name:     document.getElementById('uc-name').value,
        amount:   document.getElementById('uc-amount').value,
        price:    document.getElementById('uc-price').value,
        mobileId: document.getElementById('uc-mobile-id').value,
        details:  document.getElementById('uc-details').value,
        listedBy: sessionStorage.getItem('pubg_name') || 'Unknown',
        date:     new Date().toLocaleDateString()
    };
    this.uc.unshift(item);
    this.saveUC();
    document.getElementById('uc-form').reset();
    this.renderUC();
    alert('✓ UC Package added!');
};

// ── ADD TRADE ──
Market.prototype.addTrade = function (e) {
    e.preventDefault();
    var self = this;
    var btn  = document.querySelector('.tr-btn');
    btn.textContent = 'UPLOADING...'; btn.disabled = true;

    var mediaFiles = this.trMedia.slice();
    var promises   = mediaFiles.map(function(f){ return self.toB64(f); });

    Promise.all(promises).then(function (mediaData) {
        var item = {
            id:       Date.now(),
            title:    document.getElementById('trade-title').value,
            game:     document.getElementById('trade-game').value,
            price:    document.getElementById('trade-price').value,
            contact:  document.getElementById('trade-contact').value,
            desc:     document.getElementById('trade-desc').value,
            listedBy: sessionStorage.getItem('pubg_name') || 'Unknown',
            date:     new Date().toLocaleDateString()
        };

        var key = 'tr_' + item.id;
        saveMedia(key, mediaData).catch(function(){});

        self.trade.unshift(item);
        self.saveTrade();

        document.getElementById('trade-form').reset();
        document.getElementById('media-previews').innerHTML = '';
        self.trMedia = [];

        btn.textContent = '▶ POST LISTING'; btn.disabled = false;
        self.renderTrade();
        alert('✓ Listing posted!');
    }).catch(function () {
        btn.textContent = '▶ POST LISTING'; btn.disabled = false;
        alert('Error uploading media. Try again.');
    });
};

// ── SAVE ──
Market.prototype.saveAccounts = function () {
    try { localStorage.setItem('pubg_accounts', JSON.stringify(this.accounts)); } catch(e) {}
};
Market.prototype.saveUC = function () {
    localStorage.setItem('pubg_uc', JSON.stringify(this.uc));
};
Market.prototype.saveTrade = function () {
    try { localStorage.setItem('pubg_trade', JSON.stringify(this.trade)); } catch(e) {}
};

// ── BUILD CARD MEDIA HTML ──
// Media is loaded async from IndexedDB, so we build a placeholder and fill it in
Market.prototype.mediaHtml = function (id, prefix, emoji) {
    var divId = 'cm_' + id;
    // Load from IndexedDB async and inject
    loadMedia(prefix + '_' + id).then(function (arr) {
        var el = document.getElementById(divId);
        if (!el) return;
        if (arr && arr.length > 0) {
            var f   = arr[0];
            var cnt = arr.length > 1 ? '<span class="media-count">+' + (arr.length - 1) + '</span>' : '';
            var tag;
            if (f.type && f.type.startsWith('video/')) {
                tag = '<video src="' + f.dataUrl + '" muted playsinline loop autoplay style="width:100%;height:100%;object-fit:cover;display:block;"></video>';
            } else {
                tag = '<img src="' + f.dataUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block;">';
            }
            el.className = 'card-media';
            el.innerHTML = tag + cnt;
        }
    }).catch(function(){});

    return '<div id="' + divId + '" class="card-placeholder">' + emoji + '</div>';
};

// ── RENDER ACCOUNTS ──
Market.prototype.renderAccounts = function () {
    var self = this;
    var g    = document.getElementById('accounts-grid');
    if (!this.accounts.length) {
        g.innerHTML = '<div class="empty"><h3>NO ACCOUNTS YET</h3><p>List your first PUBG account above.</p></div>';
        return;
    }
    g.innerHTML = this.accounts.map(function (a) {
        var benefit = getSellerBenefit(a.price);
        return '<div class="card">' +
            self.mediaHtml(a.id, 'acc', '⚔') +
            '<div class="card-body">' +
            '<div class="card-tag">// PUBG ACCOUNT</div>' +
            '<h4>' + esc(a.username) + '</h4>' +
            '<div class="card-info">' +
            'COLLECTION &nbsp;<span>' + esc(a.rank) + '</span><br>' +
            'LEVEL &nbsp;<span>' + esc(a.level) + '</span><br>' +
            'SKINS &nbsp;<span>' + esc(a.items || 'Various') + '</span><br>' +
            'BY &nbsp;<span>' + esc(a.listedBy) + '</span>' +
            '</div>' +
            '<div class="card-price-row">' +
            '<div class="card-price">' + esc(a.price) + '</div>' +
            (benefit > 0 ? '<div class="card-profit">+' + benefit.toLocaleString() + ' BENEFIT</div>' : '') +
            '</div>' +
            '<div class="card-btns">' +
            '<button class="btn-view" onclick="market.viewAcc(' + a.id + ')">▶ VIEW</button>' +
            '<button class="btn-del"  onclick="market.delAcc(' + a.id + ')">✕ DELETE</button>' +
            '</div></div></div>';
    }).join('');
    filterCards();
};

// ── RENDER UC ──
Market.prototype.renderUC = function () {
    var g = document.getElementById('uc-grid');
    if (!this.uc.length) {
        g.innerHTML = '<div class="empty"><h3>NO UC PACKAGES</h3><p>Add UC packages to get started.</p></div>';
        return;
    }
    g.innerHTML = this.uc.map(function (u) {
        return '<div class="card uc-card">' +
            '<div class="card-placeholder">💎</div>' +
            '<div class="card-body">' +
            '<div class="card-tag">// UC PACKAGE</div>' +
            '<h4>' + esc(u.name) + '</h4>' +
            '<div class="card-info">' +
            'UC AMOUNT &nbsp;<span>' + esc(u.amount) + '</span><br>' +
            'MOBILE ID &nbsp;<span>' + esc(u.mobileId || 'Not specified') + '</span><br>' +
            'BY &nbsp;<span>' + esc(u.listedBy) + '</span>' +
            '</div>' +
            '<div class="card-price-row"><div class="card-price">' + esc(u.price) + '</div></div>' +
            '<div class="card-btns">' +
            '<button class="btn-view" onclick="market.viewUC(' + u.id + ')">▶ VIEW</button>' +
            '<button class="btn-del"  onclick="market.delUC(' + u.id + ')">✕ DELETE</button>' +
            '</div></div></div>';
    }).join('');
    filterCards();
};

// ── RENDER TRADE ──
Market.prototype.renderTrade = function () {
    var self = this;
    var g    = document.getElementById('trade-grid');
    if (!this.trade.length) {
        g.innerHTML = '<div class="empty"><h3>NO LISTINGS YET</h3><p>Post your first listing above.</p></div>';
        return;
    }
    g.innerHTML = this.trade.map(function (l) {
        return '<div class="card trade-card">' +
            self.mediaHtml(l.id, 'tr', '📱') +
            '<div class="card-body">' +
            '<div class="card-tag">// TRADE LISTING</div>' +
            '<h4>' + esc(l.title) + '</h4>' +
            '<div class="card-info">' +
            'GAME &nbsp;<span>' + esc(l.game) + '</span><br>' +
            'CONTACT &nbsp;<span>' + esc(l.contact || 'See details') + '</span><br>' +
            'BY &nbsp;<span>' + esc(l.listedBy) + '</span>' +
            '</div>' +
            '<div class="card-price-row"><div class="card-price">' + esc(l.price) + '</div></div>' +
            '<div class="card-btns">' +
            '<button class="btn-view" onclick="market.viewTr(' + l.id + ')">▶ VIEW</button>' +
            '<button class="btn-del"  onclick="market.delTr(' + l.id + ')">✕ DELETE</button>' +
            '</div></div></div>';
    }).join('');
    filterCards();
};

Market.prototype.renderAll = function () {
    this.renderAccounts();
    this.renderUC();
    this.renderTrade();
};

// ── GALLERY HTML FOR MODAL ──
Market.prototype.gallery = function (mediaArr, border) {
    if (!mediaArr || !mediaArr.length) return '';
    var html = '<div class="modal-gallery">';
    mediaArr.forEach(function (m) {
        if (m.type && m.type.startsWith('video/')) {
            html += '<video src="' + m.dataUrl + '" controls style="width:120px;height:90px;object-fit:cover;border-radius:2px;border:1px solid ' + border + '"></video>';
        } else {
            html += '<img src="' + m.dataUrl + '" style="width:120px;height:90px;object-fit:cover;border-radius:2px;border:1px solid ' + border + '" alt="">';
        }
    });
    html += '</div>';
    return html;
};

// ── VIEW ACCOUNT ──
Market.prototype.viewAcc = function (id) {
    var a = this.accounts.find(function(x){ return x.id === id; });
    if (!a) return;
    var self    = this;
    var benefit = getSellerBenefit(a.price);
    var base    = '<h3>⚔ ACCOUNT DETAILS</h3>' +
        '<p><strong>USERNAME</strong> ' + esc(a.username) + '</p>' +
        '<p><strong>COLLECTION</strong> ' + esc(a.rank) + '</p>' +
        '<p><strong>LEVEL</strong> ' + esc(a.level) + '</p>' +
        '<p><strong>ITEMS & SKINS</strong> ' + esc(a.items || 'Not specified') + '</p>' +
        '<p><strong>PRICE</strong> ' + esc(a.price) + '</p>' +
        (benefit > 0 ? '<p><strong>SELLER BENEFIT</strong> +' + benefit.toLocaleString() + ' (10% of price)</p>' : '') +
        '<p><strong>DESCRIPTION</strong> ' + esc(a.description || 'None') + '</p>' +
        '<p><strong>LISTED BY</strong> ' + esc(a.listedBy) + '</p>' +
        '<p><strong>DATE</strong> ' + a.date + '</p>' +
        '<button class="modal-btn">▶ BUY NOW</button>';

    loadMedia('acc_' + id).then(function (arr) {
        document.getElementById('modal-body').innerHTML = '<h3>⚔ ACCOUNT DETAILS</h3>' + self.gallery(arr, 'rgba(192,21,42,.4)') + base.replace('<h3>⚔ ACCOUNT DETAILS</h3>', '');
        openModal();
    }).catch(function () {
        document.getElementById('modal-body').innerHTML = base;
        openModal();
    });
};

// ── VIEW UC ──
Market.prototype.viewUC = function (id) {
    var u = this.uc.find(function(x){ return x.id === id; });
    if (!u) return;
    document.getElementById('modal-body').innerHTML =
        '<h3>💎 UC PACKAGE</h3>' +
        '<p><strong>PACKAGE</strong> ' + esc(u.name) + '</p>' +
        '<p><strong>UC AMOUNT</strong> ' + esc(u.amount) + '</p>' +
        '<p><strong>PRICE</strong> ' + esc(u.price) + '</p>' +
        '<p><strong>MOBILE ID</strong> ' + esc(u.mobileId || 'Any valid ID') + '</p>' +
        '<p><strong>DETAILS</strong> ' + esc(u.details || 'No details') + '</p>' +
        '<p><strong>ADDED BY</strong> ' + esc(u.listedBy) + '</p>' +
        '<p><strong>DATE</strong> ' + u.date + '</p>' +
        '<button class="modal-btn uc-mb">▶ PURCHASE NOW</button>';
    openModal();
};

// ── VIEW TRADE ──
Market.prototype.viewTr = function (id) {
    var l = this.trade.find(function(x){ return x.id === id; });
    if (!l) return;
    var self = this;
    var base =
        '<p><strong>TITLE</strong> ' + esc(l.title) + '</p>' +
        '<p><strong>GAME</strong> ' + esc(l.game) + '</p>' +
        '<p><strong>PRICE</strong> ' + esc(l.price) + '</p>' +
        '<p><strong>CONTACT</strong> ' + esc(l.contact || 'Not provided') + '</p>' +
        '<p><strong>DETAILS</strong> ' + esc(l.desc || 'None') + '</p>' +
        '<p><strong>LISTED BY</strong> ' + esc(l.listedBy) + '</p>' +
        '<p><strong>POSTED</strong> ' + l.date + '</p>' +
        '<button class="modal-btn tr-mb">▶ CONTACT SELLER</button>';

    loadMedia('tr_' + id).then(function (arr) {
        document.getElementById('modal-body').innerHTML = '<h3>⇄ TRADE LISTING</h3>' + self.gallery(arr, 'rgba(124,77,255,.4)') + base;
        openModal();
    }).catch(function () {
        document.getElementById('modal-body').innerHTML = '<h3>⇄ TRADE LISTING</h3>' + base;
        openModal();
    });
};

// ── DELETE ──
Market.prototype.delAcc = function (id) {
    if (sessionStorage.getItem('pubg_role') !== 'admin') return;
    if (!confirm('Delete this account listing?')) return;
    deleteMedia('acc_' + id).catch(function(){});
    this.accounts = this.accounts.filter(function(x){ return x.id !== id; });
    this.saveAccounts();
    this.renderAccounts();
};

Market.prototype.delUC = function (id) {
    if (sessionStorage.getItem('pubg_role') !== 'admin') return;
    if (!confirm('Delete this UC package?')) return;
    this.uc = this.uc.filter(function(x){ return x.id !== id; });
    this.saveUC();
    this.renderUC();
};

Market.prototype.delTr = function (id) {
    if (sessionStorage.getItem('pubg_role') !== 'admin') return;
    if (!confirm('Delete this listing?')) return;
    deleteMedia('tr_' + id).catch(function(){});
    this.trade = this.trade.filter(function(x){ return x.id !== id; });
    this.saveTrade();
    this.renderTrade();
};

// ── MODAL ──
function openModal()  { document.getElementById('modal').classList.add('show'); }
function closeModal() { document.getElementById('modal').classList.remove('show'); }

// ── SEARCH ──
Market.prototype.doSearch = function (q) {
    var el = document.getElementById('search-results');
    if (!q) { el.classList.remove('open'); return; }
    var lq = q.toLowerCase();

    function match(item, fields) {
        return fields.some(function(f){ return (item[f]||'').toString().toLowerCase().indexOf(lq) !== -1; });
    }

    var aM = this.accounts.filter(function(a){ return match(a, ['username','rank','level','items','price','description']); });
    var uM = this.uc.filter(function(u){       return match(u, ['name','amount','price','mobileId','details']); });
    var tM = this.trade.filter(function(l){    return match(l, ['title','game','price','contact','desc']); });

    if (!aM.length && !uM.length && !tM.length) {
        el.innerHTML = '<div class="sd-empty">// NO RESULTS FOR "' + esc(q) + '"</div>';
        el.classList.add('open'); return;
    }

    var html = '';
    var self = this;

    if (aM.length) {
        html += '<div class="sd-head">// ACCOUNTS (' + aM.length + ')</div>';
        aM.slice(0,5).forEach(function(a){
            html += '<div class="sd-item" onclick="market.jumpTo(\'accounts\',' + a.id + ')">' +
                '<div class="sd-thumb">⚔</div>' +
                '<div class="sd-info"><div class="sd-title">' + esc(a.username) + '</div><div class="sd-sub">Lvl ' + esc(a.level) + ' · ' + esc(a.items||'Various') + '</div></div>' +
                '<div class="sd-price">' + esc(a.price) + '</div></div>';
        });
    }
    if (uM.length) {
        html += '<div class="sd-head">// UC PACKAGES (' + uM.length + ')</div>';
        uM.slice(0,5).forEach(function(u){
            html += '<div class="sd-item" onclick="market.jumpTo(\'uc\',' + u.id + ')">' +
                '<div class="sd-thumb">💎</div>' +
                '<div class="sd-info"><div class="sd-title">' + esc(u.name) + '</div><div class="sd-sub">' + esc(u.amount) + ' UC</div></div>' +
                '<div class="sd-price">' + esc(u.price) + '</div></div>';
        });
    }
    if (tM.length) {
        html += '<div class="sd-head">// TRADE (' + tM.length + ')</div>';
        tM.slice(0,5).forEach(function(l){
            html += '<div class="sd-item" onclick="market.jumpTo(\'trade\',' + l.id + ')">' +
                '<div class="sd-thumb">📱</div>' +
                '<div class="sd-info"><div class="sd-title">' + esc(l.title) + '</div><div class="sd-sub">' + esc(l.game) + '</div></div>' +
                '<div class="sd-price">' + esc(l.price) + '</div></div>';
        });
    }

    el.innerHTML = html;
    el.classList.add('open');
};

Market.prototype.jumpTo = function (section, id) {
    document.getElementById('search-results').classList.remove('open');
    document.getElementById('global-search').value = '';
    document.getElementById('search-clear').classList.remove('visible');
    var btn = document.querySelector('.ntab[data-page="' + section + '"]');
    if (btn) {
        document.querySelectorAll('.ntab').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.pg').forEach(function(s){ s.classList.remove('active'); });
        document.getElementById(section + '-page').classList.add('active');
    }
    var self = this;
    setTimeout(function () {
        if (section === 'accounts') self.viewAcc(id);
        else if (section === 'uc')  self.viewUC(id);
        else                        self.viewTr(id);
    }, 280);
};
