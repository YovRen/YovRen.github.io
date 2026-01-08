// 认证系统
const { Query, User } = AV;

let currentUser = null;

// 检查登录状态
function checkLogin() {
    currentUser = AV.User.current();
    updateLoginUI();
    return currentUser !== null;
}

// 更新登录UI
function updateLoginUI() {
    const loginBtn = document.querySelector("#login-btn");
    const userInfo = document.querySelector("#user-info");
    
    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) {
            userInfo.style.display = 'flex';
            const username = currentUser.get('username') || currentUser.get('email') || '用户';
            userInfo.querySelector('.username').textContent = username;
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// 登录
async function login(username, password) {
    try {
        const user = await AV.User.logIn(username, password);
        currentUser = user;
        updateLoginUI();
        return true;
    } catch (error) {
        console.error('登录失败:', error);
        throw error;
    }
}

// 注册
async function signup(username, password, email = '') {
    try {
        const user = new AV.User();
        user.setUsername(username);
        user.setPassword(password);
        if (email) user.setEmail(email);
        await user.signUp();
        currentUser = user;
        updateLoginUI();
        return true;
    } catch (error) {
        console.error('注册失败:', error);
        throw error;
    }
}

// 登出
async function logout() {
    try {
        await AV.User.logOut();
        currentUser = null;
        updateLoginUI();
        return true;
    } catch (error) {
        console.error('登出失败:', error);
        throw error;
    }
}

// 检查是否有编辑权限
function canEdit() {
    return currentUser !== null;
}

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLogin);
} else {
    checkLogin();
}
