// 登录弹窗
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'login-modal-overlay';
    modal.innerHTML = `
        <div class="login-modal">
            <div class="login-modal-header">
                <h3>登录 / 注册</h3>
                <button class="close-modal">×</button>
            </div>
            <div class="login-modal-body">
                <div class="login-tabs">
                    <button class="tab-btn active" data-tab="login">登录</button>
                    <button class="tab-btn" data-tab="signup">注册</button>
                </div>
                
                <div id="login-form" class="login-form active">
                    <input type="text" id="login-username" placeholder="用户名" class="form-input">
                    <input type="password" id="login-password" placeholder="密码" class="form-input">
                    <button id="login-submit" class="submit-btn">登录</button>
                    <div class="error-msg" id="login-error"></div>
                </div>
                
                <div id="signup-form" class="login-form">
                    <input type="text" id="signup-username" placeholder="用户名" class="form-input">
                    <input type="password" id="signup-password" placeholder="密码" class="form-input">
                    <input type="email" id="signup-email" placeholder="邮箱（可选）" class="form-input">
                    <button id="signup-submit" class="submit-btn">注册</button>
                    <div class="error-msg" id="signup-error"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 标签切换
    modal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            modal.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            modal.querySelector(`#${tab}-form`).classList.add('active');
        });
    });
    
    // 关闭
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 登录
    modal.querySelector('#login-submit').addEventListener('click', async () => {
        const username = modal.querySelector('#login-username').value;
        const password = modal.querySelector('#login-password').value;
        const errorDiv = modal.querySelector('#login-error');
        
        if (!username || !password) {
            errorDiv.textContent = '请填写用户名和密码';
            return;
        }
        
        try {
            await login(username, password);
            document.body.removeChild(modal);
        } catch (error) {
            errorDiv.textContent = error.message || '登录失败，请检查用户名和密码';
        }
    });
    
    // 注册
    modal.querySelector('#signup-submit').addEventListener('click', async () => {
        const username = modal.querySelector('#signup-username').value;
        const password = modal.querySelector('#signup-password').value;
        const email = modal.querySelector('#signup-email').value;
        const errorDiv = modal.querySelector('#signup-error');
        
        if (!username || !password) {
            errorDiv.textContent = '请填写用户名和密码';
            return;
        }
        
        try {
            await signup(username, password, email);
            document.body.removeChild(modal);
        } catch (error) {
            errorDiv.textContent = error.message || '注册失败，用户名可能已存在';
        }
    });
    
    // Enter键提交
    modal.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeForm = modal.querySelector('.login-form.active');
                if (activeForm.id === 'login-form') {
                    modal.querySelector('#login-submit').click();
                } else {
                    modal.querySelector('#signup-submit').click();
                }
            }
        });
    });
}
