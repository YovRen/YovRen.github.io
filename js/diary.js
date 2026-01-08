// AV.init 已在 HTML 中初始化，这里不再重复初始化
// 使用全局 AV 对象
const Query = AV.Query;
const User = AV.User;

let title, content, submit, image, timeline, diaryEntries, searchInput;
let newDiaryBtn, cancelEditBtn, editingId, moodSelect, writeOverlay;
let allDiaries = []
let file;
let contentEditor = null;

function initDiaryElements() {
    title = document.querySelector("#title")
    content = document.querySelector("#content")
    submit = document.querySelector("#submit")
    image = document.querySelector("#image")
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
            file = null
            if (document.querySelector("#preview")) {
                document.querySelector("#preview").src = ''
            }
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
            file = null
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
                file = null
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

    // 图片上传
    if (image && typeof $ !== 'undefined') {
        $(image).on('change', async function () {
            const localFile = this.files[0];
            if (localFile) {
                file = new AV.File($(this).val(), localFile);
            }
        });
    }

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
                file = null
                await load()
            }
        })
    } else {
        console.error('submit button not found!');
    }
}

async function getData() {
    let data = []
    const queryAll = new AV.Query('Diary');
    await queryAll.find().then((rows) => {
        for (let row of rows) {
            data.push(row);
        }
    });
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
    const Diary = AV.Object.extend('Diary');
    const diary = new Diary();
    diary.set('title', data.title);
    diary.set('content', data.content);
    diary.set('mood', data.mood || '😊');
    diary.set('city', returnCitySN['cname']);
    diary.set('weather', weather());
    diary.set('time', time());
    if (file) {
        diary.set('image', file);
    }
    if (returnCitySN['cname'][0] === "天") {
        diary.set('author', "小燃");
    } else if (returnCitySN['cname'][0] === "云") {
        diary.set('author', "梦竹");
    }
    diary.save();
}

async function updateData(id, data) {
    const diary = AV.Object.createWithoutData('Diary', id);
    diary.set('title', data.title);
    diary.set('content', data.content);
    diary.set('mood', data.mood || '😊');
    if (file) {
        diary.set('image', file);
    }
    await diary.save();
}

async function deleteData(id) {
    if (typeof requireLogin === 'function' && !requireLogin()) {
        return;
    }
    if (confirm('确定要删除这篇日记吗？')) {
        const diary = AV.Object.createWithoutData('Diary', id);
        await diary.destroy();
        await load();
    }
}

async function load() {
    allDiaries = await getData()
    renderDiaries(allDiaries)
    updateStats(allDiaries)
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
    const imageHtml = diary.attributes.image
        ? `<div class="diary-image"><img src="${diary.attributes.image.attributes.url}" alt="日记图片"></div>`
        : ''

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
            ${imageHtml}
        </div>
        <div class="diary-entry-footer">
            <span class="diary-location">📍 ${city}</span>
            <span class="diary-weather">☀️ ${weather}</span>
        </div>
    `

    return entry
}

function createTimelineEntry(diary) {
    let avatar = 'img/users/avatar-1.jpg'
    if (diary.attributes.author === "小燃") {
        avatar = 'img/users/xiaoran.png';
    } else if (diary.attributes.author === "梦竹") {
        avatar = 'img/users/mengzhu.png';
    }

    const mood = diary.attributes.mood || '😊'
    const diaryId = diary.id
    const imageHtml = diary.attributes.image
        ? "<img src='" + diary.attributes.image.attributes.url + "' style='max-width:100%; margin-top:10px;'></img>"
        : ""
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
        imageHtml +
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
