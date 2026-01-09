// AV.init 已在 HTML 中初始化，这里不再重复初始化
// 直接使用 AV.Query 和 AV.User，不声明常量避免重复声明错误

let title, content, submit, timeline, diaryEntries, searchInput;
let newDiaryBtn, cancelEditBtn, editingId, moodSelect, writeOverlay;
let allDiaries = []
let contentEditor = null;
let currentFilter = 'all';
let friends = [];
let friendsContainer;

function initDiaryElements() {
    title = document.querySelector("#title")
    content = document.querySelector("#content")
    submit = document.querySelector("#submit")
    // image 字段已移除，图片通过图床直接插入 Markdown 内容
    timeline = document.querySelector(".timeline")
    diaryEntries = document.querySelector("#diary-entries")
    searchInput = document.querySelector("#search-diary")
    newDiaryBtn = document.querySelector("#new-diary")
    cancelEditBtn = document.querySelector("#cancel-edit")
    editingId = document.querySelector("#editing-id")
    moodSelect = document.querySelector("#mood")
    writeOverlay = document.querySelector("#write-overlay")

    console.log('初始化日记元素:', {
        newDiaryBtn: !!newDiaryBtn,
        writeOverlay: !!writeOverlay,
        submit: !!submit
    });

    return newDiaryBtn && writeOverlay && submit;
}

// 初始化Markdown编辑器
function initMarkdownEditor() {
    if (typeof EasyMDE === 'undefined') {
        console.warn('EasyMDE not loaded yet, retrying...');
        setTimeout(initMarkdownEditor, 100);
        return;
    }
    if (content && !contentEditor) {
        try {
            contentEditor = new EasyMDE({
                element: content,
                placeholder: "写点儿什么呢？生活、工作、学习、恋爱、心情、吐槽、观察... 支持Markdown格式，可直接粘贴图片",
                spellChecker: false,
                autosave: {
                    enabled: false
                },
                toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview", "side-by-side", "fullscreen", "|", "guide"]
            });

            // 设置图片上传功能
            if (typeof setupImagePaste === 'function') {
                setupImagePaste(contentEditor);
            }
            if (typeof setupCustomImageUpload === 'function') {
                setupCustomImageUpload(contentEditor);
            }
        } catch (e) {
            console.error('Failed to initialize EasyMDE:', e);
        }
    }
}

// 绑定事件监听器
function setupDiaryEventListeners() {
    // 显示/隐藏写日记表单
    if (newDiaryBtn) {
        newDiaryBtn.addEventListener("click", (e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('点击写日记按钮');
            if (typeof requireLogin === 'function' && !requireLogin()) {
                return;
            }
            if (!writeOverlay) {
                console.error("writeOverlay not found")
                return
            }
            writeOverlay.hidden = false
            if (editingId) editingId.value = ''
            if (title) title.value = ''
            if (contentEditor) {
                contentEditor.value('')
            } else if (content) {
                content.value = ''
            }
            if (moodSelect) moodSelect.value = '😊'
            // 重新初始化编辑器（如果还没初始化）
            if (!contentEditor && content) {
                setTimeout(() => {
                    initMarkdownEditor()
                }, 100)
            }
        })
    } else {
        console.error('newDiaryBtn not found!');
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            if (writeOverlay) writeOverlay.hidden = true
            if (editingId) editingId.value = ''
            if (title) title.value = ''
            if (content) content.value = ''
        })
    }

    // 点击遮罩层关闭表单
    if (writeOverlay) {
        writeOverlay.addEventListener("click", (e) => {
            if (e.target === writeOverlay) {
                writeOverlay.hidden = true
                if (editingId) editingId.value = ''
                if (title) title.value = ''
                if (content) content.value = ''
            }
        })
    }

    // 搜索功能
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const keyword = e.target.value.toLowerCase()
            if (keyword === '') {
                renderDiaries(allDiaries)
            } else {
                const filtered = allDiaries.filter(diary => {
                    const title = diary.attributes.title || ''
                    const content = diary.attributes.content || ''
                    return title.toLowerCase().includes(keyword) || content.toLowerCase().includes(keyword)
                })
                renderDiaries(filtered)
            }
        })
    }

    // 图片上传已通过图床处理（image-upload.js），无需单独处理

    // 提交表单
    if (submit) {
        submit.addEventListener("click", async event => {
            if (typeof requireLogin === 'function' && !requireLogin()) {
                return;
            }
            const contentValue = contentEditor ? contentEditor.value() : (content ? content.value : '')
            if (contentValue !== '') {
                if (editingId && editingId.value) {
                    // 编辑模式
                    await updateData(editingId.value, {
                        title: title ? title.value : '',
                        content: contentValue,
                        mood: moodSelect ? moodSelect.value : '😊'
                    })
                } else {
                    // 新建模式
                    saveData({
                        title: title ? title.value : '',
                        content: contentValue,
                        mood: moodSelect ? moodSelect.value : '😊'
                    })
                }
                if (title) title.value = ''
                if (contentEditor) {
                    contentEditor.value('')
                } else if (content) {
                    content.value = ''
                }
                if (editingId) editingId.value = ''
                if (writeOverlay) writeOverlay.hidden = true
                await load()
            }
        })
    } else {
        console.error('submit button not found!');
    }
    
    // 导航按钮事件
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter
            if (filter === 'all') {
                showAllDiaries()
            } else if (filter === 'friends') {
                currentFilter = 'friends'
                renderDiaries(allDiaries)
                updateViewTitle('全部动态', `共 ${allDiaries.length} 条动态`)
                updateNavButtons('friends')
            }
        })
    })
    
    // 添加好友按钮 - 使用事件委托，确保动态添加的按钮也能响应
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'add-friend-btn') {
            e.preventDefault()
            e.stopPropagation()
            const friendUsername = prompt('请输入好友的用户名：')
            if (friendUsername && friendUsername.trim()) {
                addFriend(friendUsername.trim())
            }
        }
    })
}

async function getData() {
    let data = []
    const currentUser = AV.User.current()
    
    if (!currentUser) {
        // 未登录时只显示公开的日记（如果有公开字段的话）
        const queryAll = new AV.Query('journal');
        await queryAll.find().then((rows) => {
            for (let row of rows) {
                data.push(row);
            }
        });
        return data
    }
    
    // 获取好友ID列表
    const friendIds = [currentUser.id] // 包含自己
    try {
        const Friend = AV.Object.extend('friend')
        const friendQuery = new AV.Query(Friend)
        friendQuery.equalTo('user', currentUser)
        const friendResults = await friendQuery.find()
        
        for (let friend of friendResults) {
            const friendId = friend.get('friendId')
            if (friendId) {
                friendIds.push(friendId)
            }
        }
    } catch (error) {
        console.error('获取好友列表失败:', error)
    }
    
    // 查询自己和好友的日记
    const queries = friendIds.map(friendId => {
        const query = new AV.Query('journal')
        const friendUser = AV.Object.createWithoutData('_User', friendId)
        query.equalTo('user', friendUser)
        return query
    })
    
    if (queries.length > 0) {
        const queryAll = AV.Query.or(...queries)
        await queryAll.find().then((rows) => {
            for (let row of rows) {
                data.push(row);
            }
        });
    }
    
    return data
}

function weather() {
    let ret = "未知";
    jQuery.support.cors = true;
    $.ajax({
        url: "https://api.seniverse.com/v3/weather/now.json?key=S8qLqLqLqLqLqLqL&location=ip&language=zh-Hans&unit=c",
        type: "GET",
        dataType: "jsonp",
        success: function (data) {
            ret = data.results[0].now.text;
        },
        error: function (err) {
            ret = "未知";
        }
    });
    console.log(ret);
    return ret;
}

function time() {
    var d = new Date()
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes();
}

function saveData(data) {
    const Diary = AV.Object.extend('journal');
    const diary = new Diary();
    diary.set('title', data.title);
    diary.set('content', data.content);
    diary.set('mood', data.mood || '😊');
    diary.set('city', returnCitySN && returnCitySN['cname'] ? returnCitySN['cname'] : '未知');
    diary.set('weather', weather());
    diary.set('time', time());
    // 图片已通过图床直接插入 Markdown 内容，无需单独的 image 字段
    
    // 使用当前登录用户作为作者（必须登录）
    const currentUser = AV.User.current();
    if (!currentUser) {
        throw new Error('请先登录才能写日记');
    }
    const username = currentUser.get('username') || currentUser.get('email') || '未知用户';
    diary.set('author', username);
    // 保存用户对象的引用
    diary.set('user', currentUser);
    
    diary.save();
}

async function updateData(id, data) {
    const diary = AV.Object.createWithoutData('journal', id);
    diary.set('title', data.title);
    diary.set('content', data.content);
    diary.set('mood', data.mood || '😊');
    // 图片已通过图床直接插入 Markdown 内容，无需单独的 image 字段
    await diary.save();
}

async function deleteData(id) {
    if (typeof requireLogin === 'function' && !requireLogin()) {
        return;
    }
    if (confirm('确定要删除这篇日记吗？')) {
        const diary = AV.Object.createWithoutData('journal', id);
        await diary.destroy();
        await load();
    }
}

async function load() {
    allDiaries = await getData()
    await loadFriends()
    renderDiaries(allDiaries)
    updateStats(allDiaries)
    renderFriends()
    updateViewTitle('全部动态', `共 ${allDiaries.length} 条动态`)
}

// 加载好友列表
async function loadFriends() {
    try {
        const currentUser = AV.User.current()
        if (!currentUser) {
            friends = []
            return
        }
        
        const Friend = AV.Object.extend('friend')
        const query = new AV.Query(Friend)
        query.equalTo('user', currentUser)
        const results = await query.find()
        
        friends = results.map(f => ({
            id: f.id,
            username: f.get('friendUsername') || '',
            friendId: f.get('friendId') || ''
        }))
    } catch (error) {
        console.error('加载好友失败:', error)
        friends = []
    }
}

// 渲染好友列表
function renderFriends() {
    friendsContainer = document.querySelector("#friends-container")
    if (!friendsContainer) return
    
    if (friends.length === 0) {
        friendsContainer.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 10px;">暂无好友</div>'
        return
    }
    
    friendsContainer.innerHTML = friends.map(friend => `
        <div class="friend-item" data-friend="${friend.username}">
            <span class="friend-name">${friend.username}</span>
            <button class="friend-remove-btn" data-id="${friend.id}" style="background: transparent; border: none; color: #ff6b6b; cursor: pointer; font-size: 12px;">删除</button>
        </div>
    `).join('')
    
    // 绑定好友点击事件
    friendsContainer.querySelectorAll('.friend-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.classList.contains('friend-remove-btn')) return
            const friendName = this.dataset.friend
            filterByFriend(friendName)
        })
    })
    
    // 绑定删除好友事件
    friendsContainer.querySelectorAll('.friend-remove-btn').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation()
            if (confirm('确定要删除这个好友吗？')) {
                const id = this.dataset.id
                await removeFriend(id)
            }
        })
    })
    
    // 更新好友数统计
    const friendCountEl = document.querySelector("#friend-count")
    if (friendCountEl) friendCountEl.textContent = friends.length
}

// 添加好友
async function addFriend(friendUsername) {
    try {
        const currentUser = AV.User.current()
        if (!currentUser) {
            alert('请先登录')
            return
        }
        
        // 查找好友用户
        const friendQuery = new AV.Query(AV.User)
        friendQuery.equalTo('username', friendUsername)
        const friendUsers = await friendQuery.find()
        
        if (friendUsers.length === 0) {
            alert('未找到该用户')
            return
        }
        
        const friendUser = friendUsers[0]
        
        // 检查是否已经是好友
        const Friend = AV.Object.extend('friend')
        const checkQuery = new AV.Query(Friend)
        checkQuery.equalTo('user', currentUser)
        checkQuery.equalTo('friendId', friendUser.id)
        const existing = await checkQuery.find()
        
        if (existing.length > 0) {
            alert('该用户已经是您的好友')
            return
        }
        
        // 添加好友
        const friend = new Friend()
        friend.set('user', currentUser)
        friend.set('friendId', friendUser.id)
        friend.set('friendUsername', friendUsername)
        await friend.save()
        
        await loadFriends()
        alert('添加好友成功！')
    } catch (error) {
        console.error('添加好友失败:', error)
        alert('添加好友失败: ' + (error.message || '未知错误'))
    }
}

// 删除好友
async function removeFriend(friendId) {
    try {
        const friend = AV.Object.createWithoutData('friend', friendId)
        await friend.destroy()
        await loadFriends()
    } catch (error) {
        console.error('删除好友失败:', error)
        alert('删除好友失败: ' + (error.message || '未知错误'))
    }
}

// 按好友筛选
function filterByFriend(friendUsername) {
    currentFilter = 'friend'
    const filtered = allDiaries.filter(diary => {
        const author = diary.attributes.author || ''
        return author === friendUsername
    })
    renderDiaries(filtered)
    updateViewTitle(`好友: ${friendUsername}`, `共 ${filtered.length} 条动态`)
    updateNavButtons('friends')
}

// 显示全部
function showAllDiaries() {
    currentFilter = 'all'
    renderDiaries(allDiaries)
    updateViewTitle('全部动态', `共 ${allDiaries.length} 条动态`)
    updateNavButtons('all')
}

// 更新视图标题
function updateViewTitle(title, subtitle) {
    const titleEl = document.querySelector("#view-title")
    const subtitleEl = document.querySelector("#view-subtitle")
    if (titleEl) titleEl.textContent = title
    if (subtitleEl) subtitleEl.textContent = subtitle
}

// 更新导航按钮状态
function updateNavButtons(active) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active')
        if (btn.dataset.filter === active) {
            btn.classList.add('active')
        }
    })
}

function renderDiaries(datas) {
    // 如果存在新的日记容器，使用新样式；否则使用时间线样式
    if (diaryEntries) {
        renderDiaryEntries(datas);
    } else if (timeline) {
        renderTimeline(datas);
    }
    // 渲染后绑定事件
    bindDiaryEvents();
}

function renderDiaryEntries(datas) {
    diaryEntries.innerHTML = ''

    if (datas.length === 0) {
        diaryEntries.innerHTML = '<div class="diary-empty">还没有日记，开始写第一篇吧！</div>'
        return
    }

    // 按日期分组
    const groupedByDate = {}
    datas.forEach(diary => {
        const date = diary.attributes.time ? diary.attributes.time.split(" ")[0] : '未知日期'
        if (!groupedByDate[date]) {
            groupedByDate[date] = []
        }
        groupedByDate[date].push(diary)
    })

    // 按日期倒序排列
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a))

    sortedDates.forEach(date => {
        // 日期标题
        const dateSection = document.createElement("div")
        dateSection.className = "diary-date-section"
        dateSection.innerHTML = `<div class="diary-date-label">${date}</div>`
        diaryEntries.appendChild(dateSection)

        // 该日期的所有日记
        groupedByDate[date].forEach(diary => {
            const entry = createDiaryEntry(diary)
            diaryEntries.appendChild(entry)
        })
    })
}

function renderTimeline(datas) {
    timeline.innerHTML = ''
    let olddate = ""
    for (let i = datas.length - 1; i >= 0; i--) {
        let newdate = datas[i].attributes.time.split(" ")[0];
        if (newdate !== olddate) {
            let date = document.createElement("li");
            date.innerHTML = "<div class='tldate'>" + newdate + "</div>";
            timeline.appendChild(date);
            olddate = newdate;
        }

        const entry = createTimelineEntry(datas[i])
        timeline.appendChild(entry);
    }
}

function createDiaryEntry(diary) {
    const mood = diary.attributes.mood || '😊'
    const diaryId = diary.id
    const title = diary.attributes.title || ''
    const contentText = diary.attributes.content || ''
    const contentHtml = typeof marked !== 'undefined' ? marked.parse(contentText) : contentText.replace(/\n/g, '<br>')
    const time = diary.attributes.time || ''
    const city = diary.attributes.city || '未知'
    const weather = diary.attributes.weather || '未知'
    // 图片已通过图床直接插入 Markdown 内容，无需单独的 image 字段
    
    const entry = document.createElement("div")
    entry.className = "diary-entry"
    entry.innerHTML = `
        <div class="diary-entry-header">
            <span class="diary-mood">${mood}</span>
            <span class="diary-title">${title || '无标题'}</span>
            <span class="diary-time">${time.split(' ')[1] || ''}</span>
            ${canEdit() ? `
                <button class="diary-edit-btn" data-id="${diaryId}">✏️</button>
                <button class="diary-delete-btn" data-id="${diaryId}">🗑️</button>
            ` : ''}
        </div>
        <div class="diary-entry-content">
            ${contentHtml}
        </div>
        <div class="diary-entry-footer">
            <span class="diary-location">📍 ${city}</span>
            <span class="diary-weather">☀️ ${weather}</span>
        </div>
    `

    return entry
}

function createTimelineEntry(diary) {
    // 使用默认头像，兼容旧数据
    let avatar = 'img/users/avatar-1.jpg'
    const author = diary.attributes.author;
    // 兼容旧数据：如果作者是"小燃"或"梦竹"，使用对应头像
    if (author === "小燃") {
        avatar = 'img/users/xiaoran.png';
    } else if (author === "梦竹") {
        avatar = 'img/users/mengzhu.png';
    }
    // 新数据使用用户名，统一使用默认头像（可以根据需要扩展）

    const mood = diary.attributes.mood || '😊'
    const diaryId = diary.id
    // 图片已通过图床直接插入 Markdown 内容，无需单独的 image 字段
    const contentText = diary.attributes.content || ''
    const contentHtml = typeof marked !== 'undefined' ? marked.parse(contentText) : contentText.replace(/\n/g, '<br>')
    
    const lis = document.createElement("li")
    lis.innerHTML =
        "<img class=\"tl-circ\" src=" + avatar + "></img>\n" +
        "<div class=\"timeline-panel\">\n" +
        "<div class=\"tl-heading\">\n" +
        "<h4>" + mood + " " + (diary.attributes.title || '无标题') +
        (canEdit() ? ` <button class='edit-btn' data-id='${diaryId}' style='font-size:12px; padding:2px 5px;'>编辑</button>` : '') +
        (canEdit() ? ` <button class='delete-btn' data-id='${diaryId}' style='font-size:12px; padding:2px 5px;'>删除</button>` : '') +
        "</h4>\n" +
        "</div>\n" +
        "<div class=\"tl-body\">\n" +
        contentHtml +
        "</div>" +
        "<div class=\"small text-muted\">\n" +
        "<i class=\"glyphicon glyphicon-globe\"></i> [" + diary.attributes.city + "] • " + diary.attributes.weather +
        "</div>\n" +
        "</div>";

    return lis
}

// 绑定编辑和删除按钮
function bindDiaryEvents() {
    // 绑定编辑和删除按钮（新样式）
    document.querySelectorAll('.diary-edit-btn, .edit-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            if (typeof requireLogin === 'function' && !requireLogin()) {
                return;
            }
            const id = this.getAttribute('data-id')
            const diary = allDiaries.find(d => d.id === id)
            if (diary) {
                if (editingId) editingId.value = id
                if (title) title.value = diary.attributes.title || ''
                if (contentEditor) {
                    contentEditor.value(diary.attributes.content || '')
                } else if (content) {
                    content.value = diary.attributes.content || ''
                }
                if (moodSelect) moodSelect.value = diary.attributes.mood || '😊'
                if (writeOverlay) writeOverlay.hidden = false
                if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block'
            }
        })
    })

    document.querySelectorAll('.diary-delete-btn, .delete-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.getAttribute('data-id')
            await deleteData(id)
        })
    })
}

function updateStats(datas) {
    const totalCount = datas.length
    let totalWords = 0
    const dates = new Set()

    datas.forEach(diary => {
        totalWords += (diary.attributes.content || '').length
        if (diary.attributes.time) {
            dates.add(diary.attributes.time.split(" ")[0])
        }
    })

    const totalCountEl = document.querySelector("#total-count")
    const totalWordsEl = document.querySelector("#total-words")
    const totalDaysEl = document.querySelector("#total-days")
    if (totalCountEl) totalCountEl.textContent = totalCount
    if (totalWordsEl) totalWordsEl.textContent = totalWords
    if (totalDaysEl) totalDaysEl.textContent = dates.size
}

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (initDiaryElements()) {
            setupDiaryEventListeners();
            setTimeout(initMarkdownEditor, 100);
            load();
        } else {
            console.error('日记页面元素初始化失败');
        }
    });
} else {
    if (initDiaryElements()) {
        setupDiaryEventListeners();
        setTimeout(initMarkdownEditor, 100);
        load();
    } else {
        console.error('日记页面元素初始化失败');
    }
}
