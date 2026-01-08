const {Query, User} = AV;

AV.init({
    appId: "szRqJxj4rGr47DBsfiYqh9qA-gzGzoHsz",
    appKey: "UCGehmC6gOKYHSKpoMLeaRFJ",
    serverURL: "https://szrqjxj4.lc-cn-n1-shared.com"
});

let currentDate = new Date()
let events = []
let eventContentEditor = null

// 初始化Markdown编辑器
function initEventMarkdownEditor() {
    if (typeof EasyMDE === 'undefined') {
        console.warn('EasyMDE not loaded yet, retrying...');
        setTimeout(initEventMarkdownEditor, 100);
        return;
    }
    if (document.querySelector("#event-content") && !eventContentEditor) {
        try {
            eventContentEditor = new EasyMDE({
                element: document.querySelector("#event-content"),
                placeholder: "事项详情...支持Markdown格式，可直接粘贴图片",
                spellChecker: false,
                autosave: {
                    enabled: false
                },
                toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview", "side-by-side", "fullscreen", "|", "guide"]
            });
            
            // 设置图片上传功能
            if (typeof setupImagePaste === 'function') {
                setupImagePaste(eventContentEditor);
            }
            if (typeof setupCustomImageUpload === 'function') {
                setupCustomImageUpload(eventContentEditor);
            }
        } catch (e) {
            console.error('Failed to initialize EasyMDE:', e);
        }
    }
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEventMarkdownEditor);
} else {
    initEventMarkdownEditor();
}

const calendarGrid = document.querySelector("#calendar-grid")
const currentMonthYear = document.querySelector("#current-month-year")
const prevMonthBtn = document.querySelector("#prev-month")
const nextMonthBtn = document.querySelector("#next-month")
const todayBtn = document.querySelector("#today-btn")
const eventOverlay = document.querySelector("#event-overlay")
const eventTitle = document.querySelector("#event-title")
const eventContent = document.querySelector("#event-content")
const eventDate = document.querySelector("#event-date")
const eventPriority = document.querySelector("#event-priority")
const eventSubmit = document.querySelector("#event-submit")
const eventCancel = document.querySelector("#event-cancel")
const eventDelete = document.querySelector("#event-delete")
const eventEditingId = document.querySelector("#event-editing-id")
const eventFormTitle = document.querySelector("#event-form-title")

loadEvents()
renderCalendar()

prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1)
    renderCalendar()
})

nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1)
    renderCalendar()
})

todayBtn.addEventListener("click", () => {
    currentDate = new Date()
    renderCalendar()
})

eventCancel.addEventListener("click", () => {
    eventOverlay.hidden = true
    resetEventForm()
})

eventOverlay.addEventListener("click", (e) => {
    if (e.target === eventOverlay) {
        eventOverlay.hidden = true
        resetEventForm()
    }
})

eventSubmit.addEventListener("click", async () => {
    if (!eventTitle.value || !eventDate.value) {
        alert('请填写标题和日期')
        return
    }
    
    const contentValue = eventContentEditor ? eventContentEditor.value() : eventContent.value
    
    if (eventEditingId.value) {
        await updateEvent(eventEditingId.value, {
            title: eventTitle.value,
            content: contentValue,
            date: eventDate.value,
            priority: eventPriority.value
        })
    } else {
        await saveEvent({
            title: eventTitle.value,
            content: contentValue,
            date: eventDate.value,
            priority: eventPriority.value
        })
    }
    
    eventOverlay.hidden = true
    resetEventForm()
    await loadEvents()
    renderCalendar()
})

eventDelete.addEventListener("click", async () => {
    if (confirm('确定要删除这个事项吗？')) {
        await deleteEvent(eventEditingId.value)
        eventOverlay.hidden = true
        resetEventForm()
        await loadEvents()
        renderCalendar()
    }
})

function resetEventForm() {
    eventTitle.value = ''
    if (eventContentEditor) {
        eventContentEditor.value('')
    } else {
        eventContent.value = ''
    }
    eventDate.value = ''
    eventPriority.value = 'medium'
    eventEditingId.value = ''
    eventDelete.style.display = 'none'
    eventFormTitle.textContent = '添加事项'
}

function openEventForm(dateStr = null, eventId = null) {
    if (dateStr) {
        eventDate.value = dateStr
    }
    
    // 重新初始化编辑器（如果还没初始化）
    if (!eventContentEditor && document.querySelector("#event-content")) {
        setTimeout(() => {
            initEventMarkdownEditor()
        }, 100)
    }
    
    if (eventId) {
        const event = events.find(e => e.id === eventId)
        if (event) {
            eventEditingId.value = eventId
            eventTitle.value = event.attributes.title || ''
            if (eventContentEditor) {
                eventContentEditor.value(event.attributes.content || '')
            } else {
                eventContent.value = event.attributes.content || ''
            }
            eventDate.value = event.attributes.date || ''
            eventPriority.value = event.attributes.priority || 'medium'
            eventDelete.style.display = 'inline-block'
            eventFormTitle.textContent = '编辑事项'
        }
    } else {
        resetEventForm()
        eventFormTitle.textContent = '添加事项'
    }
    
    eventOverlay.hidden = false
}

function renderCalendar() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    currentMonthYear.textContent = `${year}年 ${month + 1}月`
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    calendarGrid.innerHTML = ''
    
    // 星期标题
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    weekDays.forEach(day => {
        const dayHeader = document.createElement("div")
        dayHeader.className = "calendar-day-header"
        dayHeader.textContent = day
        calendarGrid.appendChild(dayHeader)
    })
    
    // 空白日期
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement("div")
        emptyDay.className = "calendar-day empty"
        calendarGrid.appendChild(emptyDay)
    }
    
    // 日期格子
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement("div")
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const isToday = dateStr === todayStr
        
        dayCell.className = `calendar-day ${isToday ? 'today' : ''}`
        
        const dayEvents = events.filter(e => {
            const eventDate = e.attributes.date
            if (!eventDate) return false
            // 处理日期格式，确保匹配
            const normalizedEventDate = eventDate.split('T')[0] // 处理ISO格式
            return normalizedEventDate === dateStr || eventDate === dateStr
        })
        
        dayCell.innerHTML = `
            <div class="day-number">${day}</div>
            <div class="day-events">
                ${dayEvents.map(e => {
                    const priority = e.attributes.priority || 'medium'
                    const priorityClass = priority === 'high' ? 'high' : priority === 'low' ? 'low' : 'medium'
                    return `<div class="event-dot ${priorityClass}" data-event-id="${e.id}" title="${e.attributes.title}"></div>`
                }).join('')}
            </div>
        `
        
        dayCell.addEventListener("click", () => {
            openEventForm(dateStr)
        })
        
        dayEvents.forEach(e => {
            const eventDot = dayCell.querySelector(`[data-event-id="${e.id}"]`)
            if (eventDot) {
                eventDot.addEventListener("click", (ev) => {
                    ev.stopPropagation()
                    openEventForm(null, e.id)
                })
            }
        })
        
        calendarGrid.appendChild(dayCell)
    }
}

async function getEvents() {
    let data = []
    const queryAll = new AV.Query('CalendarEvent');
    await queryAll.find().then((rows) => {
        for (let row of rows) {
            data.push(row);
        }
    });
    return data
}

async function loadEvents() {
    events = await getEvents()
    console.log('Loaded events:', events.length)
    events.forEach(e => {
        console.log('Event:', e.attributes.date, e.attributes.title)
    })
}

function saveEvent(data) {
    const Event = AV.Object.extend('CalendarEvent');
    const event = new Event();
    event.set('title', data.title);
    event.set('content', data.content || '');
    // 确保日期格式统一为 YYYY-MM-DD
    const dateStr = data.date.split('T')[0]; // 处理可能的ISO格式
    event.set('date', dateStr);
    event.set('priority', data.priority || 'medium');
    return event.save();
}

async function updateEvent(id, data) {
    const event = AV.Object.createWithoutData('CalendarEvent', id);
    event.set('title', data.title);
    event.set('content', data.content || '');
    // 确保日期格式统一为 YYYY-MM-DD
    const dateStr = data.date.split('T')[0]; // 处理可能的ISO格式
    event.set('date', dateStr);
    event.set('priority', data.priority || 'medium');
    await event.save();
}

async function deleteEvent(id) {
    const event = AV.Object.createWithoutData('CalendarEvent', id);
    await event.destroy();
}
