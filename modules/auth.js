/* ═══════════════════════════════════════════════════════════════
   AUTH — Login/Register UI + API helper
   ═══════════════════════════════════════════════════════════════ */
(function(){
  const TOKEN_KEY = 'study_token';
  let currentUser = null;
  let modalEl = null;

  /* ═══ API HELPER ═══ */
  window.api = {
    getToken: function(){ return localStorage.getItem(TOKEN_KEY) },

    isLoggedIn: function(){ return !!this.getToken() },

    getUser: function(){ return currentUser },

    request: async function(method, path, body){
      const headers = {'Content-Type':'application/json'};
      const token = this.getToken();
      if(token) headers['Authorization'] = 'Bearer '+token;
      const opts = {method, headers};
      if(body) opts.body = JSON.stringify(body);
      const res = await fetch('/api'+path, opts);
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || '请求失败');
      return data;
    },

    login: async function(username, password){
      const data = await this.request('POST', '/login', {username, password});
      localStorage.setItem(TOKEN_KEY, data.token);
      currentUser = data.user;
      return data;
    },

    register: async function(username, password){
      const data = await this.request('POST', '/register', {username, password});
      localStorage.setItem(TOKEN_KEY, data.token);
      currentUser = data.user;
      return data;
    },

    logout: async function(){
      try{ await this.request('POST', '/logout') }catch(e){}
      localStorage.removeItem(TOKEN_KEY);
      currentUser = null;
    },

    restore: async function(){
      const token = this.getToken();
      if(!token) return null;
      try {
        const data = await this.request('GET', '/me');
        currentUser = data.user;
        return currentUser;
      } catch(e){
        localStorage.removeItem(TOKEN_KEY);
        currentUser = null;
        return null;
      }
    },

    // Data APIs
    saveDiagnosis: function(results){
      return this.request('POST', '/diagnosis', {results});
    },
    loadDiagnosis: function(){
      return this.request('GET', '/diagnosis');
    },
    clearDiagnosis: function(){
      return this.request('DELETE', '/diagnosis');
    },
    logListening: function(category, item){
      return this.request('POST', '/listening', {category, item});
    },
    saveDictation: function(data){
      return this.request('POST', '/dictation', data);
    },
    getStats: function(){
      return this.request('GET', '/stats');
    }
  };

  /* ═══ LOGIN/REGISTER MODAL ═══ */
  function buildModal(){
    if(document.getElementById('authModal')) return;
    const div = document.createElement('div');
    div.id = 'authModal';
    div.innerHTML = `
      <style>
        .auth-overlay{
          display:none;position:fixed;inset:0;z-index:9999;
          background:rgba(0,0,0,.4);backdrop-filter:blur(6px);
          align-items:center;justify-content:center;padding:16px
        }
        .auth-overlay.show{display:flex}
        .auth-box{
          background:#fff;border-radius:20px;padding:32px 24px 24px;
          max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.15);
          animation:ap2 .3s ease;text-align:center
        }
        @keyframes ap2{0%{opacity:0;transform:scale(.85) translateY(16px)}100%{opacity:1;transform:scale(1) translateY(0)}}
        .auth-title{font-size:22px;font-weight:800;color:#1e293b;margin-bottom:20px}
        .auth-input{
          width:100%;padding:12px 14px;border:2px solid #e2e8f0;border-radius:10px;
          font-size:15px;outline:none;transition:border-color .2s;margin-bottom:10px;
          box-sizing:border-box
        }
        .auth-input:focus{border-color:#6366f1}
        .auth-btn{
          width:100%;padding:12px;border:none;border-radius:10px;
          font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
          box-shadow:0 4px 16px rgba(99,102,241,.3);margin-bottom:8px
        }
        .auth-btn:active{transform:scale(.97)}
        .auth-switch{font-size:13px;color:#6366f1;cursor:pointer;text-decoration:underline;background:none;border:none}
        .auth-err{color:#ef4444;font-size:13px;margin-bottom:8px;display:none}
        .auth-user{display:flex;align-items:center;gap:8px}
        .auth-user-name{font-size:14px;font-weight:600;color:#1e293b}
        .auth-logout{font-size:12px;color:#94a3b8;cursor:pointer;text-decoration:underline;background:none;border:none}
      </style>
      <div class="auth-overlay" id="authOverlay">
        <div class="auth-box" id="authBox">
          <div class="auth-title" id="authTitle">登录</div>
          <div class="auth-err" id="authErr"></div>
          <input class="auth-input" id="authUser" placeholder="用户名" autocomplete="username">
          <input class="auth-input" id="authPass" type="password" placeholder="密码" autocomplete="current-password">
          <button class="auth-btn" id="authSubmit">登录</button>
          <button class="auth-switch" id="authSwitch">没有账号？去注册</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    modalEl = div;

    // State
    let isRegister = false;

    const overlay = div.querySelector('#authOverlay');
    const title = div.querySelector('#authTitle');
    const userInput = div.querySelector('#authUser');
    const passInput = div.querySelector('#authPass');
    const submitBtn = div.querySelector('#authSubmit');
    const switchBtn = div.querySelector('#authSwitch');
    const errEl = div.querySelector('#authErr');

    function setMode(reg){
      isRegister = reg;
      title.textContent = reg ? '注册' : '登录';
      submitBtn.textContent = reg ? '注册' : '登录';
      switchBtn.textContent = reg ? '已有账号？去登录' : '没有账号？去注册';
      errEl.style.display = 'none';
    }

    async function handleSubmit(){
      const username = userInput.value.trim();
      const password = passInput.value;
      if(!username || password.length < 4){
        errEl.textContent = '用户名不能为空，密码至少4位';
        errEl.style.display = 'block';
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = '请稍候...';
      try {
        if(isRegister){
          await window.api.register(username, password);
        } else {
          await window.api.login(username, password);
        }
        overlay.classList.remove('show');
        updateAuthUI();
      } catch(e){
        errEl.textContent = e.message;
        errEl.style.display = 'block';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = isRegister ? '注册' : '登录';
    }

    submitBtn.addEventListener('click', handleSubmit);
    switchBtn.addEventListener('click', () => setMode(!isRegister));
    userInput.addEventListener('keydown', e => { if(e.key==='Enter') passInput.focus() });
    passInput.addEventListener('keydown', e => { if(e.key==='Enter') handleSubmit() });

    // Close on overlay click
    overlay.addEventListener('click', e => { if(e.target === overlay) overlay.classList.remove('show') });

    window.showAuth = function(){ overlay.classList.add('show'); setMode(false); userInput.focus() };
  }

  /* ═══ AUTH UI UPDATE ═══ */
  function updateAuthUI(){
    const sidebar = document.querySelector('.sidebar-brand');
    if(!sidebar) return;
    // Remove old auth UI
    const old = sidebar.parentNode.querySelector('.auth-user');
    if(old) old.remove();

    if(window.api.isLoggedIn()){
      const u = window.api.getUser();
      const el = document.createElement('div');
      el.className = 'auth-user';
      el.style.cssText = 'padding:8px 16px 0;border-top:1px solid rgba(255,255,255,.15);margin-top:8px';
      el.innerHTML = `
        <span class="auth-user-name">👤 ${u.display_name || u.username}</span>
        <button class="auth-logout">退出</button>
      `;
      el.querySelector('.auth-logout').addEventListener('click', async function(){
        await window.api.logout();
        updateAuthUI();
      });
      sidebar.parentNode.appendChild(el);
    } else {
      const el = document.createElement('div');
      el.className = 'auth-user';
      el.style.cssText = 'padding:8px 16px 0;border-top:1px solid rgba(255,255,255,.15);margin-top:8px';
      el.innerHTML = `<button class="auth-login-btn" style="background:none;border:1.5px solid rgba(255,255,255,.35);border-radius:6px;color:#fff;font-size:13px;font-weight:600;padding:6px 16px;cursor:pointer;width:100%">🔑 登录 / 注册</button>`;
      el.querySelector('.auth-login-btn').addEventListener('click', () => { if(window.showAuth) window.showAuth() });
      sidebar.parentNode.appendChild(el);
    }
  }

  /* ═══ INIT ═══ */
  document.addEventListener('DOMContentLoaded', function(){
    buildModal();
    // Restore session
    window.api.restore().then(() => {
      updateAuthUI();
    });
  });
})();
