const { Query, User } = AV;

// 移除重复的 AV.init，已在 HTML 中初始化

const todoInput = document.querySelector("#todo-input")
const importance = document.querySelector("#importance")
const urgency = document.querySelector("#urgency")
const deadline = document.querySelector("#deadline")
const addTodoBtn = document.querySelector("#add-todo-btn")
const searchInput = document.querySelector("#search-all")

// 根据重要性和紧急度确定象限
function getQuadrant(importance, urgency) {
    if (importance === 'high' && urgency === 'high') return 1; // 重要且紧急
    if (importance === 'high' && urgency === 'low') return 2; // 重要但不紧急
    if (importance === 'low' && urgency === 'high') return 3; // 紧急但不重要
    return 4; // 不重要也不紧急
}

// 加载数据
load()

// 添加待办事项
addTodoBtn.addEventListener("click", async () => {
    if (typeof requireLogin === 'function' && !requireLogin()) {
        return;
    }
    if (todoInput.value.trim() !== '') {
        const quadrant = getQuadrant(importance.value, urgency.value);
        await saveData({
            title: todoInput.value.trim(),
            done: false,
            importance: importance.value,
            urgency: urgency.value,
            quadrant: quadrant,
            deadline: deadline.value || null,
            archived: false,
            completedDate: null
        })
        todoInput.value = ''
        deadline.value = ''
        importance.value = 'high'
        urgency.value = 'high'
        await load()
    }
})

// Enter键添加
todoInput.addEventListener("keydown", async (event) => {
    if (event.keyCode === 13) {
        addTodoBtn.click()
    }
})

// 搜索功能
searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterTodos(searchTerm);
})

async function getData() {
    let data = []
    const queryAll = new AV.Query('Todolist');
    queryAll.equalTo('archived', false); // 只获取未存档的
    await queryAll.find().then((rows) => {
        for (let row of rows) {
            data.push(row);
        }
    });
    return data
}

async function getArchivedData() {
    let data = []
    const queryAll = new AV.Query('Todolist');
    queryAll.equalTo('archived', true);
    queryAll.descending('completedDate');
    await queryAll.find().then((rows) => {
        for (let row of rows) {
            data.push(row);
        }
    });
    return data
}

function saveData(data) {
    const Todo = AV.Object.extend('Todolist');
    const todo = new Todo();
    todo.set('title', data.title);
    todo.set('done', data.done || false);
    todo.set('importance', data.importance || 'high');
    todo.set('urgency', data.urgency || 'high');
    todo.set('quadrant', data.quadrant || 1);
    todo.set('archived', data.archived || false);
    if (data.deadline) {
        todo.set('deadline', data.deadline);
    }
    if (data.completedDate) {
        todo.set('completedDate', data.completedDate);
    }
    return todo.save()
}

function getDeadlineInfo(deadline) {
    if (!deadline) return ''
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadlineDate = new Date(deadline)
    deadlineDate.setHours(0, 0, 0, 0)
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
        return '<span class="deadline-overdue">⚠️ 已过期 ' + Math.abs(diffDays) + ' 天</span>'
    } else if (diffDays === 0) {
        return '<span class="deadline-today">⚠️ 今天截止</span>'
    } else if (diffDays <= 3) {
        return '<span class="deadline-soon">⏰ 还有 ' + diffDays + ' 天</span>'
    } else {
        return '<span class="deadline-normal">📅 ' + deadline + '</span>'
    }
}

async function load() {
    // 清空所有象限
    for (let i = 1; i <= 4; i++) {
        const quadrantEl = document.querySelector(`#quadrant-${i}`)
        quadrantEl.innerHTML = ''
    }

    let datas = await getData()
    const counts = [0, 0, 0, 0] // 四个象限的计数

    // 按截止日期排序
    datas.sort((a, b) => {
        if (a.attributes.deadline && b.attributes.deadline) {
            return new Date(a.attributes.deadline) - new Date(b.attributes.deadline)
        }
        if (a.attributes.deadline) return -1
        if (b.attributes.deadline) return 1
        return 0
    })

    for (let i = 0; i < datas.length; i++) {
        const todo = datas[i]
        const quadrant = todo.attributes.quadrant || 1
        const deadline = todo.attributes.deadline
        const deadlineInfo = getDeadlineInfo(deadline)

        if (!todo.attributes.done) {
            counts[quadrant - 1]++
            renderTodo(todo, quadrant, deadlineInfo)
        }
    }

    // 更新计数
    for (let i = 1; i <= 4; i++) {
        document.querySelector(`#q${i}-count`).textContent = counts[i - 1]
        const quadrantEl = document.querySelector(`#quadrant-${i}`)
        if (counts[i - 1] === 0) {
            quadrantEl.innerHTML = '<div class="empty-quadrant">暂无任务</div>'
        }
    }

    // 加载历史记录
    loadHistory()

    // 绑定事件
    bindEvents()
}

function renderTodo(todo, quadrant, deadlineInfo) {
    const quadrantEl = document.querySelector(`#quadrant-${quadrant}`)
    
    // 移除空状态提示
    const emptyEl = quadrantEl.querySelector('.empty-quadrant')
    if (emptyEl) {
        emptyEl.remove()
    }

    const todoItem = document.createElement('div')
    todoItem.className = 'todo-item'
    if (todo.attributes.done) {
        todoItem.classList.add('checked')
    }
    todoItem.dataset.id = todo.id
    todoItem.innerHTML = `
        <div class="todo-checkbox">
            <input type="checkbox" id="todo-${todo.id}" class="todo-check" ${todo.attributes.done ? 'checked' : ''}>
        </div>
        <div class="todo-content">
            <div class="todo-title">${escapeHtml(todo.attributes.title)}</div>
            ${deadlineInfo ? `<div class="todo-deadline">${deadlineInfo}</div>` : ''}
        </div>
        <div class="todo-actions">
            <button class="btn-archive" title="存档">📦</button>
            <button class="btn-delete" title="删除">🗑️</button>
        </div>
    `
    quadrantEl.appendChild(todoItem)
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}

function bindEvents() {
    // 完成/取消完成
    document.querySelectorAll('.todo-check').forEach(checkbox => {
        checkbox.addEventListener('change', async function() {
            if (typeof requireLogin === 'function' && !requireLogin()) {
                this.checked = !this.checked
                return
            }
            const todoId = this.id.replace('todo-', '')
            const todoItem = this.closest('.todo-item')
            const todo = AV.Object.createWithoutData('Todolist', todoId)
            todo.set('done', this.checked)
            if (this.checked) {
                todo.set('completedDate', new Date().toISOString().split('T')[0])
                todoItem.classList.add('checked')
            } else {
                todo.set('completedDate', null)
                todoItem.classList.remove('checked')
            }
            await todo.save()
            await load()
        })
    })

    // 删除
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (typeof requireLogin === 'function' && !requireLogin()) {
                return
            }
            if (!confirm('确定要删除这个任务吗？')) {
                return
            }
            const todoId = this.closest('.todo-item').dataset.id
            const todo = AV.Object.createWithoutData('Todolist', todoId)
            await todo.destroy()
            await load()
        })
    })

    // 存档
    document.querySelectorAll('.btn-archive').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (typeof requireLogin === 'function' && !requireLogin()) {
                return
            }
            const todoId = this.closest('.todo-item').dataset.id
            const todo = AV.Object.createWithoutData('Todolist', todoId)
            todo.set('archived', true)
            todo.set('done', true)
            todo.set('completedDate', new Date().toISOString().split('T')[0])
            await todo.save()
            await load()
        })
    })
}

// 过滤待办事项
function filterTodos(searchTerm) {
    document.querySelectorAll('.todo-item').forEach(item => {
        const title = item.querySelector('.todo-title').textContent.toLowerCase()
        if (title.includes(searchTerm)) {
            item.style.display = ''
        } else {
            item.style.display = 'none'
        }
    })
}

// 加载历史记录
async function loadHistory() {
    const historyList = document.querySelector('#history-list')
    const archivedData = await getArchivedData()
    
    if (archivedData.length === 0) {
        historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>'
        return
    }

    // 按日期分组
    const groupedByDate = {}
    archivedData.forEach(todo => {
        const date = todo.attributes.completedDate || '未知日期'
        if (!groupedByDate[date]) {
            groupedByDate[date] = []
        }
        groupedByDate[date].push(todo)
    })

    // 按日期排序（最新的在前）
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
        if (a === '未知日期') return 1
        if (b === '未知日期') return -1
        return new Date(b) - new Date(a)
    })

    historyList.innerHTML = sortedDates.map(date => {
        const todos = groupedByDate[date]
        const dateStr = date === '未知日期' ? date : formatDate(date)
        return `
            <div class="history-date-group">
                <div class="history-date-header">${dateStr} (${todos.length})</div>
                <div class="history-todos">
                    ${todos.map(todo => `
                        <div class="history-todo-item">
                            <span class="history-todo-title">${escapeHtml(todo.attributes.title)}</span>
                            <span class="history-todo-quadrant">Q${todo.attributes.quadrant || 1}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `
    }).join('')
}

function formatDate(dateStr) {
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)
    
    const diffTime = today - dateOnly
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays === 2) return '前天'
    if (diffDays < 7) return `${diffDays}天前`
    
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
}
