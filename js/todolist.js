// AV.init 已在 HTML 中初始化，这里不再重复初始化
// 直接使用 AV.Query 和 AV.User，不声明常量避免重复声明错误

// 等待DOM加载完成
let todoInput, importance, urgency, deadline, addTodoBtn, searchInput;

function initElements() {
    todoInput = document.querySelector("#todo-input")
    importance = document.querySelector("#importance")
    urgency = document.querySelector("#urgency")
    deadline = document.querySelector("#deadline")
    addTodoBtn = document.querySelector("#add-todo-btn")
    searchInput = document.querySelector("#search-all")
    
    if (!todoInput || !importance || !urgency || !deadline || !addTodoBtn) {
        console.error('DOM元素未找到，请检查HTML结构');
        return false;
    }
    return true;
}

// 根据重要性和紧急度确定象限
function getQuadrant(importance, urgency) {
    if (importance === 'high' && urgency === 'high') return 1; // 重要且紧急
    if (importance === 'high' && urgency === 'low') return 2; // 重要但不紧急
    if (importance === 'low' && urgency === 'high') return 3; // 紧急但不重要
    return 4; // 不重要也不紧急
}

// 添加事件监听器
function setupEventListeners() {
    if (!addTodoBtn || !todoInput) {
        console.warn('部分DOM元素未找到，跳过事件绑定');
        return;
    }
    
    // 添加待办事项
    addTodoBtn.addEventListener("click", async () => {
        if (typeof requireLogin === 'function' && !requireLogin()) {
            return;
        }
        if (todoInput.value.trim() !== '') {
            try {
                addTodoBtn.disabled = true;
                addTodoBtn.textContent = '添加中...';
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
            } catch (error) {
                console.error('保存失败:', error);
                alert('保存失败: ' + (error.message || '未知错误') + '\n请检查浏览器控制台获取详细信息');
            } finally {
                addTodoBtn.disabled = false;
                addTodoBtn.textContent = '添加';
            }
        }
    })

    // Enter键添加
    todoInput.addEventListener("keydown", async (event) => {
        if (event.keyCode === 13) {
            addTodoBtn.click()
        }
    })

    // 搜索功能
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterTodos(searchTerm);
        })
    }
}

async function getData() {
    try {
        let data = []
        const currentUser = AV.User.current()
        
        if (!currentUser) {
            // 未登录时返回空数组
            return data
        }
        
        // 只查询当前用户的待办事项
        // 兼容旧数据：如果没有archived字段，也包含进来
        const query1 = new AV.Query('todolist');
        query1.equalTo('archived', false);
        query1.equalTo('user', currentUser);
        const query2 = new AV.Query('todolist');
        query2.doesNotExist('archived');
        query2.equalTo('user', currentUser);
        const queryAll = AV.Query.or(query1, query2);
        const rows = await queryAll.find();
        console.log('查询到待办事项数量:', rows.length);
        for (let row of rows) {
            data.push(row);
            console.log('待办事项:', {
                id: row.id,
                title: row.attributes.title,
                done: row.attributes.done,
                quadrant: row.attributes.quadrant,
                archived: row.attributes.archived
            });
        }
        return data
    } catch (error) {
        console.error('getData 错误:', error);
        return [];
    }
}

async function getArchivedData() {
    try {
        let data = []
        const currentUser = AV.User.current()
        
        if (!currentUser) {
            return data
        }
        
        const queryAll = new AV.Query('todolist');
        queryAll.equalTo('archived', true);
        queryAll.equalTo('user', currentUser);
        queryAll.descending('completedDate');
        const rows = await queryAll.find();
        for (let row of rows) {
            data.push(row);
        }
        return data
    } catch (error) {
        console.error('getArchivedData 错误:', error);
        return [];
    }
}

async function saveData(data) {
    try {
        const currentUser = AV.User.current();
        if (!currentUser) {
            throw new Error('请先登录');
        }
        
        const Todo = AV.Object.extend('todolist');
        const todo = new Todo();
        todo.set('title', data.title);
        todo.set('done', data.done || false);
        todo.set('importance', data.importance || 'high');
        todo.set('urgency', data.urgency || 'high');
        todo.set('quadrant', data.quadrant || 1);
        todo.set('archived', data.archived || false);
        todo.set('user', currentUser);
        if (data.deadline) {
            // 将字符串日期转换为 Date 对象
            const deadlineDate = new Date(data.deadline);
            todo.set('deadline', deadlineDate);
        }
        if (data.completedDate) {
            // 确保保存为字符串格式
            let dateStr;
            if (typeof data.completedDate === 'string') {
                dateStr = data.completedDate;
            } else if (data.completedDate instanceof Date) {
                const d = new Date(data.completedDate);
                d.setHours(0, 0, 0, 0);
                dateStr = d.getFullYear() + '-' + 
                         String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(d.getDate()).padStart(2, '0');
            } else {
                dateStr = String(data.completedDate);
            }
            todo.set('completedDate', dateStr);
        }
        
        // 设置ACL为所有人可读写（如果需要权限控制，可以后续修改）
        const acl = new AV.ACL();
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);
        todo.setACL(acl);
        
        const result = await todo.save();
        console.log('保存成功:', result);
        return result;
    } catch (error) {
        console.error('saveData 错误:', error);
        throw error;
    }
}

function getDeadlineInfo(deadline) {
    if (!deadline) return ''
    
    // 处理 Date 对象或字符串
    let deadlineDate;
    if (deadline instanceof Date) {
        deadlineDate = deadline;
    } else if (typeof deadline === 'string') {
        deadlineDate = new Date(deadline);
    } else if (deadline.iso) {
        // LeanCloud Date 对象
        deadlineDate = new Date(deadline.iso);
    } else {
        return '';
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    deadlineDate.setHours(0, 0, 0, 0)
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // 格式化日期显示
    const dateStr = deadlineDate.getFullYear() + '-' + 
                   String(deadlineDate.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(deadlineDate.getDate()).padStart(2, '0');

    if (diffDays < 0) {
        return '<span class="deadline-overdue">⚠️ 已过期 ' + Math.abs(diffDays) + ' 天</span>'
    } else if (diffDays === 0) {
        return '<span class="deadline-today">⚠️ 今天截止</span>'
    } else if (diffDays <= 3) {
        return '<span class="deadline-soon">⏰ 还有 ' + diffDays + ' 天</span>'
    } else {
        return '<span class="deadline-normal">📅 ' + dateStr + '</span>'
    }
}

// 加载重要日
async function loadImportantDays() {
    try {
        const importantDaysList = document.querySelector('#important-days-list')
        if (!importantDaysList) return
        
        const currentUser = AV.User.current()
        if (!currentUser) {
            importantDaysList.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 10px;">请先登录</div>'
            return
        }
        
        const ImportantDay = AV.Object.extend('importantDay')
        const query = new AV.Query(ImportantDay)
        query.equalTo('user', currentUser)
        query.ascending('date')
        const results = await query.find()
        
        if (results.length === 0) {
            importantDaysList.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 10px;">暂无重要日</div>'
            return
        }
        
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        importantDaysList.innerHTML = results.map(day => {
            const date = new Date(day.get('date'))
            const dateStr = date.toISOString().split('T')[0]
            const title = day.get('title') || '未命名'
            const description = day.get('description') || ''
            const id = day.id
            
            // 计算距离今天的天数
            const dayDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
            const diffTime = dayDate - today
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            let dayText = ''
            if (diffDays === 0) {
                dayText = '<span style="color: #ff6b6b; font-weight: bold;">今天</span>'
            } else if (diffDays === 1) {
                dayText = '<span style="color: #ffa500; font-weight: bold;">明天</span>'
            } else if (diffDays > 0) {
                dayText = `<span style="color: #51cf66;">还有 ${diffDays} 天</span>`
            } else {
                dayText = `<span style="color: #868e96;">已过 ${Math.abs(diffDays)} 天</span>`
            }
            
            return `
                <div class="important-day-item" data-id="${id}">
                    <div class="important-day-header">
                        <span class="important-day-date">${dateStr}</span>
                        <button class="important-day-delete" data-id="${id}" style="background: transparent; border: none; color: #ff6b6b; cursor: pointer; font-size: 12px; padding: 2px 6px;">删除</button>
                    </div>
                    <div class="important-day-title">${title}</div>
                    ${description ? `<div class="important-day-description">${description}</div>` : ''}
                    <div class="important-day-countdown">${dayText}</div>
                </div>
            `
        }).join('')
        
        // 绑定删除事件
        importantDaysList.querySelectorAll('.important-day-delete').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation()
                if (confirm('确定要删除这个重要日吗？')) {
                    const id = this.dataset.id
                    await deleteImportantDay(id)
                }
            })
        })
        
        // 绑定编辑事件
        importantDaysList.querySelectorAll('.important-day-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (e.target.classList.contains('important-day-delete')) return
                const id = this.dataset.id
                editImportantDay(id)
            })
        })
    } catch (error) {
        console.error('加载重要日失败:', error)
        const importantDaysList = document.querySelector('#important-days-list')
        if (importantDaysList) {
            importantDaysList.innerHTML = '<div style="color: #ff6b6b; font-size: 13px; padding: 10px;">加载失败</div>'
        }
    }
}

// 保存重要日
async function saveImportantDay(data) {
    try {
        const currentUser = AV.User.current()
        if (!currentUser) {
            throw new Error('请先登录')
        }
        
        const ImportantDay = AV.Object.extend('importantDay')
        let importantDay
        
        if (data.id) {
            // 更新
            importantDay = AV.Object.createWithoutData('importantDay', data.id)
        } else {
            // 新建
            importantDay = new ImportantDay()
        }
        
        importantDay.set('user', currentUser)
        importantDay.set('date', new Date(data.date))
        importantDay.set('title', data.title)
        if (data.description) {
            importantDay.set('description', data.description)
        }
        
        await importantDay.save()
        await loadImportantDays()
        return importantDay
    } catch (error) {
        console.error('保存重要日失败:', error)
        throw error
    }
}

// 删除重要日
async function deleteImportantDay(id) {
    try {
        const importantDay = AV.Object.createWithoutData('importantDay', id)
        await importantDay.destroy()
        await loadImportantDays()
    } catch (error) {
        console.error('删除重要日失败:', error)
        alert('删除失败: ' + (error.message || '未知错误'))
    }
}

// 编辑重要日
async function editImportantDay(id) {
    try {
        const importantDay = AV.Object.createWithoutData('importantDay', id)
        await importantDay.fetch()
        
        const date = importantDay.get('date')
        const dateStr = date ? new Date(date).toISOString().split('T')[0] : ''
        
        document.querySelector('#important-day-date').value = dateStr
        document.querySelector('#important-day-title').value = importantDay.get('title') || ''
        document.querySelector('#important-day-description').value = importantDay.get('description') || ''
        document.querySelector('#editing-important-day-id').value = id
        
        document.querySelector('#important-day-modal').style.display = 'flex'
    } catch (error) {
        console.error('编辑重要日失败:', error)
        alert('加载失败: ' + (error.message || '未知错误'))
    }
}

async function load() {
    try {
        console.log('开始加载数据...');
        // 清空所有象限
        for (let i = 1; i <= 4; i++) {
            const quadrantEl = document.querySelector(`#quadrant-${i}`)
            if (quadrantEl) {
                quadrantEl.innerHTML = ''
            } else {
                console.warn(`象限 ${i} 的元素未找到`);
            }
        }

        let datas = await getData()
        console.log('获取到的数据总数:', datas.length);
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

        console.log('开始处理数据，总数:', datas.length);
        for (let i = 0; i < datas.length; i++) {
            const todo = datas[i]
            // 兼容旧数据：如果没有quadrant字段，根据importance和urgency计算
            let quadrant = todo.attributes.quadrant
            if (!quadrant) {
                const importance = todo.attributes.importance || 'high'
                const urgency = todo.attributes.urgency || 'high'
                quadrant = getQuadrant(importance, urgency)
                // 更新旧数据
                try {
                    const todoObj = AV.Object.createWithoutData('todolist', todo.id)
                    todoObj.set('quadrant', quadrant)
                    if (!todo.attributes.importance) todoObj.set('importance', importance)
                    if (!todo.attributes.urgency) todoObj.set('urgency', urgency)
                    if (todo.attributes.archived === undefined) todoObj.set('archived', false)
                    await todoObj.save()
                } catch (e) {
                    console.warn('更新旧数据失败:', e)
                }
            }
            const deadline = todo.attributes.deadline
            const deadlineInfo = getDeadlineInfo(deadline)

            // 只显示未完成且未存档的任务
            if (!todo.attributes.done && !todo.attributes.archived) {
                counts[quadrant - 1]++
                renderTodo(todo, quadrant, deadlineInfo)
                console.log('渲染任务:', todo.attributes.title, '象限:', quadrant);
            } else {
                console.log('跳过任务:', todo.attributes.title, 'done:', todo.attributes.done, 'archived:', todo.attributes.archived);
            }
        }

        // 更新计数
        for (let i = 1; i <= 4; i++) {
            const countEl = document.querySelector(`#q${i}-count`)
            const quadrantEl = document.querySelector(`#quadrant-${i}`)
            if (countEl) {
                countEl.textContent = counts[i - 1]
            }
            if (quadrantEl && counts[i - 1] === 0) {
                quadrantEl.innerHTML = '<div class="empty-quadrant">暂无任务</div>'
            }
        }

        // 加载历史记录
        await loadHistory()

        // 绑定事件
        bindEvents()
    } catch (error) {
        console.error('load 错误:', error);
        alert('加载数据失败: ' + (error.message || '未知错误'));
    }
}

function renderTodo(todo, quadrant, deadlineInfo) {
    const quadrantEl = document.querySelector(`#quadrant-${quadrant}`)
    if (!quadrantEl) return;
    
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
            try {
                const todoId = this.id.replace('todo-', '')
                const todoItem = this.closest('.todo-item')
                const todo = AV.Object.createWithoutData('todolist', todoId)
                todo.set('done', this.checked)
                if (this.checked) {
                    // 保存为字符串格式 YYYY-MM-DD
                    const completedDate = new Date();
                    completedDate.setHours(0, 0, 0, 0);
                    const dateStr = completedDate.getFullYear() + '-' + 
                                   String(completedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                   String(completedDate.getDate()).padStart(2, '0');
                    todo.set('completedDate', dateStr)
                    todoItem.classList.add('checked')
                } else {
                    todo.set('completedDate', null)
                    todoItem.classList.remove('checked')
                }
                await todo.save()
                await load()
            } catch (error) {
                console.error('更新失败:', error);
                alert('更新失败: ' + (error.message || '未知错误'));
                this.checked = !this.checked; // 恢复状态
            }
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
            try {
                const todoId = this.closest('.todo-item').dataset.id
                const todo = AV.Object.createWithoutData('todolist', todoId)
                await todo.destroy()
                await load()
            } catch (error) {
                console.error('删除失败:', error);
                alert('删除失败: ' + (error.message || '未知错误'));
            }
        })
    })

    // 存档
    document.querySelectorAll('.btn-archive').forEach(btn => {
        btn.addEventListener('click', async function() {
            if (typeof requireLogin === 'function' && !requireLogin()) {
                return
            }
            try {
                const todoId = this.closest('.todo-item').dataset.id
                const todo = AV.Object.createWithoutData('todolist', todoId)
                todo.set('archived', true)
                todo.set('done', true)
                // 保存为字符串格式 YYYY-MM-DD
                const completedDate = new Date();
                completedDate.setHours(0, 0, 0, 0);
                const dateStr = completedDate.getFullYear() + '-' + 
                               String(completedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                               String(completedDate.getDate()).padStart(2, '0');
                todo.set('completedDate', dateStr)
                await todo.save()
                await load()
            } catch (error) {
                console.error('存档失败:', error);
                alert('存档失败: ' + (error.message || '未知错误'));
            }
        })
    })
}

// 过滤待办事项
function filterTodos(searchTerm) {
    document.querySelectorAll('.todo-item').forEach(item => {
        const title = item.querySelector('.todo-title')?.textContent.toLowerCase() || ''
        if (title.includes(searchTerm)) {
            item.style.display = ''
        } else {
            item.style.display = 'none'
        }
    })
}

// 加载历史记录
async function loadHistory() {
    try {
        const historyList = document.querySelector('#history-list')
        if (!historyList) return;
        
        const archivedData = await getArchivedData()
        
        if (archivedData.length === 0) {
            historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>'
            return
        }

        // 按日期分组
        const groupedByDate = {}
        archivedData.forEach(todo => {
            let date = '未知日期';
            const completedDate = todo.attributes.completedDate;
            if (completedDate) {
                // 处理 Date 对象或字符串
                if (completedDate instanceof Date) {
                    date = completedDate.toISOString().split('T')[0];
                } else if (typeof completedDate === 'string') {
                    date = completedDate.split('T')[0];
                } else if (completedDate.iso) {
                    date = completedDate.iso.split('T')[0];
                }
            }
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
    } catch (error) {
        console.error('loadHistory 错误:', error);
    }
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

// 初始化
// 初始化重要日功能
function initImportantDays() {
    // 添加重要日按钮
    document.querySelector('#add-important-day-btn')?.addEventListener('click', function() {
        document.querySelector('#important-day-date').value = ''
        document.querySelector('#important-day-title').value = ''
        document.querySelector('#important-day-description').value = ''
        document.querySelector('#editing-important-day-id').value = ''
        document.querySelector('#important-day-modal').style.display = 'flex'
    })
    
    // 保存重要日
    document.querySelector('#save-important-day-btn')?.addEventListener('click', async function() {
        const date = document.querySelector('#important-day-date').value
        const title = document.querySelector('#important-day-title').value
        const description = document.querySelector('#important-day-description').value
        const id = document.querySelector('#editing-important-day-id').value
        
        if (!date || !title.trim()) {
            alert('请填写日期和标题')
            return
        }
        
        try {
            this.disabled = true
            this.textContent = '保存中...'
            await saveImportantDay({
                id: id || null,
                date: date,
                title: title.trim(),
                description: description.trim()
            })
            document.querySelector('#important-day-modal').style.display = 'none'
            alert('保存成功！')
        } catch (error) {
            alert('保存失败: ' + (error.message || '未知错误'))
        } finally {
            this.disabled = false
            this.textContent = '保存'
        }
    })
    
    // 取消按钮
    document.querySelector('#cancel-important-day-btn')?.addEventListener('click', function() {
        document.querySelector('#important-day-modal').style.display = 'none'
    })
    
    // 点击遮罩层关闭
    document.querySelector('#important-day-modal')?.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none'
        }
    })
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (initElements()) {
            setupEventListeners();
            load();
            loadHistory();
            loadImportantDays();
            initImportantDays();
        }
    });
} else {
    if (initElements()) {
        setupEventListeners();
        load();
        loadHistory();
        loadImportantDays();
        initImportantDays();
    }
}
