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

    register: async function(username, password, captcha_id, captcha_answer){
      const data = await this.request('POST', '/register', {username, password, captcha_id, captcha_answer});
      localStorage.setItem(TOKEN_KEY, data.token);
      currentUser = data.user;
      return data;
    },

    getCaptcha: function(){
      return this.request('GET', '/captcha');
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
    // Convenience: log a listening event, silently skip when not logged in
    track: function(category, item){
      if(!this.isLoggedIn()) return Promise.resolve();
      return this.logListening(category, item).catch(()=>{});
    },
    saveDictation: function(data){
      return this.request('POST', '/dictation', data);
    },
    getStats: function(){
      return this.request('GET', '/stats');
    }
  };

  /* ═══ LOGIN-REMINDER BANNER (dismissible, never blocks) ═══ */
  const BANNER_KEY = 'study_banner_hidden';
  function maybeShowBanner(){
    if(localStorage.getItem(BANNER_KEY)) return;
    if(document.getElementById('authReminder')) return;
    const div = document.createElement('div');
    div.id = 'authReminder';
    div.style.cssText = 'position:fixed;left:12px;right:12px;bottom:14px;z-index:9990;background:#1e293b;color:#fff;border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,.25);font-size:13px;animation:ap2 .3s ease';
    div.innerHTML = `
      <span style="flex:1">🔑 登录后自动记录学习进度，随时查看自己的进步</span>
      <button id="reminderLogin" style="flex-shrink:0;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;color:#fff;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer">去登录</button>
      <button id="reminderClose" style="flex-shrink:0;background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:0 4px">✕</button>
    `;
    document.body.appendChild(div);
    div.querySelector('#reminderLogin').addEventListener('click', ()=>{
      div.remove();
      if(window.showAuth) window.showAuth();
    });
    div.querySelector('#reminderClose').addEventListener('click', ()=>{
      localStorage.setItem(BANNER_KEY, '1');
      div.remove();
    });
  }
  function maybeHideBanner(){
    const b = document.getElementById('authReminder');
    if(b) b.remove();
  }

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
          align-items:center;justify-content:center;padding:16px;overflow-y:auto
        }
        .auth-overlay.show{display:flex}
        .auth-box{
          background:#fff;border-radius:20px;padding:32px 24px 24px;
          max-width:360px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.15);
          animation:ap2 .3s ease;text-align:center;margin:auto
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
        .auth-btn:disabled{opacity:.6;cursor:not-allowed}
        .auth-switch{font-size:13px;color:#6366f1;cursor:pointer;text-decoration:underline;background:none;border:none;margin-top:4px}
        .auth-err{color:#ef4444;font-size:13px;margin-bottom:8px;display:none}
        .auth-captcha{display:flex;gap:8px;align-items:center;margin-bottom:10px}
        .auth-captcha .auth-input{margin-bottom:0;flex:1}
        .auth-captcha-q{
          flex-shrink:0;padding:0 14px;height:44px;display:flex;align-items:center;
          background:#eef2ff;border:2px solid #c7d2fe;border-radius:10px;
          font-size:16px;font-weight:800;color:#4338ca;cursor:pointer;user-select:none
        }
        .auth-hint{font-size:12px;color:#94a3b8;margin:-4px 0 12px;text-align:left}
        .auth-ok{color:#16a34a;font-size:13px;margin-bottom:8px;display:none}
        .auth-user{display:flex;align-items:center;gap:8px}
        .auth-user-name{font-size:14px;font-weight:600;color:#1e293b}
        .auth-logout{font-size:12px;color:#94a3b8;cursor:pointer;text-decoration:underline;background:none;border:none}
      </style>
      <div class="auth-overlay" id="authOverlay">
        <div class="auth-box" id="authBox">
          <div class="auth-title" id="authTitle">登录</div>
          <div class="auth-err" id="authErr"></div>
          <div class="auth-ok" id="authOk"></div>

          <!-- ═══ LOGIN VIEW ═══ -->
          <div id="viewLogin">
            <input class="auth-input" id="authUser" placeholder="用户名" autocomplete="username">
            <input class="auth-input" id="authPass" type="password" placeholder="密码" autocomplete="current-password">
            <button class="auth-btn" id="authSubmit">登录</button>
            <button class="auth-switch" id="authSwitch">没有账号？去注册</button>
          </div>

          <!-- ═══ REGISTER VIEW ═══ -->
          <div id="viewRegister" style="display:none">
            <input class="auth-input" id="regUser" placeholder="用户名（2位以上）" autocomplete="username">
            <input class="auth-input" id="regPass" type="password" placeholder="密码（至少4位）" autocomplete="new-password">
            <input class="auth-input" id="regPass2" type="password" placeholder="确认密码" autocomplete="new-password">
            <div class="auth-captcha">
              <input class="auth-input" id="regCaptcha" placeholder="验证码" autocomplete="off">
              <div class="auth-captcha-q" id="regCaptchaQ">加载中...</div>
            </div>
            <button class="auth-btn" id="regSubmit">注册</button>
            <button class="auth-switch" id="regSwitch">已有账号？去登录</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    modalEl = div;

    // State
    let isRegister = false;
    let captchaId = '';

    const overlay = div.querySelector('#authOverlay');
    const title = div.querySelector('#authTitle');
    const errEl = div.querySelector('#authErr');
    const okEl = div.querySelector('#authOk');
    const viewLogin = div.querySelector('#viewLogin');
    const viewRegister = div.querySelector('#viewRegister');

    const loginUser = div.querySelector('#authUser');
    const loginPass = div.querySelector('#authPass');
    const loginSubmit = div.querySelector('#authSubmit');
    const switchBtn = div.querySelector('#authSwitch');

    const regUser = div.querySelector('#regUser');
    const regPass = div.querySelector('#regPass');
    const regPass2 = div.querySelector('#regPass2');
    const regCaptcha = div.querySelector('#regCaptcha');
    const regCaptchaQ = div.querySelector('#regCaptchaQ');
    const regSubmit = div.querySelector('#regSubmit');
    const regSwitch = div.querySelector('#regSwitch');

    function showErr(msg){
      okEl.style.display = 'none';
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
    function showOk(msg){
      errEl.style.display = 'none';
      okEl.textContent = msg;
      okEl.style.display = 'block';
    }
    function clearMsg(){
      errEl.style.display = 'none';
      okEl.style.display = 'none';
    }

    // ─── Captcha ───
    function loadCaptcha(){
      regCaptchaQ.textContent = '加载中...';
      window.api.getCaptcha().then(d=>{
        captchaId = d.id;
        regCaptchaQ.textContent = d.question;
        regCaptcha.value = '';
      }).catch(()=>{
        regCaptchaQ.textContent = '点此刷新';
        captchaId = '';
      });
    }
    regCaptchaQ.addEventListener('click', loadCaptcha);

    function setMode(reg){
      isRegister = reg;
      clearMsg();
      if(reg){
        title.textContent = '注册';
        viewLogin.style.display = 'none';
        viewRegister.style.display = 'block';
        loadCaptcha();
        setTimeout(()=>regUser.focus(), 50);
      } else {
        title.textContent = '登录';
        viewLogin.style.display = 'block';
        viewRegister.style.display = 'none';
        setTimeout(()=>loginUser.focus(), 50);
      }
    }

    // ─── Login submit ───
    async function handleLogin(){
      const username = loginUser.value.trim();
      const password = loginPass.value;
      if(!username || !password){
        showErr('请输入用户名和密码');
        return;
      }
      loginSubmit.disabled = true;
      loginSubmit.textContent = '请稍候...';
      try {
        await window.api.login(username, password);
        overlay.classList.remove('show');
        updateAuthUI();
        maybeHideBanner();
      } catch(e){
        showErr(e.message);
      }
      loginSubmit.disabled = false;
      loginSubmit.textContent = '登录';
    }

    // ─── Register submit ───
    async function handleRegister(){
      const username = regUser.value.trim();
      const password = regPass.value;
      const password2 = regPass2.value;
      const answer = regCaptcha.value.trim();
      if(username.length < 2){
        showErr('用户名至少2位');
        return;
      }
      if(password.length < 4){
        showErr('密码至少4位');
        return;
      }
      if(password !== password2){
        showErr('两次输入的密码不一致');
        return;
      }
      if(!captchaId || !answer){
        showErr('请完成验证码');
        return;
      }
      regSubmit.disabled = true;
      regSubmit.textContent = '请稍候...';
      try {
        await window.api.register(username, password, captchaId, answer);
        overlay.classList.remove('show');
        updateAuthUI();
        maybeHideBanner();
      } catch(e){
        showErr(e.message);
        loadCaptcha(); // refresh captcha after a failed attempt
      }
      regSubmit.disabled = false;
      regSubmit.textContent = '注册';
    }

    // ─── Event bindings ───
    loginSubmit.addEventListener('click', handleLogin);
    switchBtn.addEventListener('click', () => setMode(true));
    regSubmit.addEventListener('click', handleRegister);
    regSwitch.addEventListener('click', () => setMode(false));
    loginUser.addEventListener('keydown', e => { if(e.key==='Enter') loginPass.focus() });
    loginPass.addEventListener('keydown', e => { if(e.key==='Enter') handleLogin() });
    regUser.addEventListener('keydown', e => { if(e.key==='Enter') regPass.focus() });
    regPass.addEventListener('keydown', e => { if(e.key==='Enter') regPass2.focus() });
    regPass2.addEventListener('keydown', e => { if(e.key==='Enter') regCaptcha.focus() });
    regCaptcha.addEventListener('keydown', e => { if(e.key==='Enter') handleRegister() });

    // Close on overlay click
    overlay.addEventListener('click', e => { if(e.target === overlay) overlay.classList.remove('show') });

    window.showAuth = function(){ overlay.classList.add('show'); setMode(false); };
  }

  /* ═══ AUTH UI UPDATE ═══ */
  function updateAuthUI(){
    const loggedIn = window.api.isLoggedIn();
    // Show/hide "my records" nav entry (desktop sidebar + mobile topbar)
    const navEntry = document.getElementById('navMyRecords');
    if(navEntry) navEntry.style.display = loggedIn ? '' : 'none';
    document.querySelectorAll('.top-leaf[data-page="my-records"]').forEach(el=>{
      el.style.display = loggedIn ? '' : 'none';
    });

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
      if(window.api.isLoggedIn()){
        maybeHideBanner();
      } else {
        setTimeout(maybeShowBanner, 1500);
      }
    });
  });
})();
