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
    
    // 取消按钮（新建时）
    const cancelWriteBtn = document.querySelector("#cancel-write")
    if (cancelWriteBtn) {
        cancelWriteBtn.addEventListener("click", () => {
            if (writeOverlay) writeOverlay.hidden = true
            if (editingId) editingId.value = ''
            if (title) title.value = ''
            if (contentEditor) {
                contentEditor.value('')
            } else if (content) {
                content.value = ''
            }
            if (moodSelect) moodSelect.value = '😊'
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
                    await saveData({
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
        // 未登录时不显示任何日记，需要登录才能查看
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

async function saveData(data) {
    const Diary = AV.Object.extend('journal');
    const diary = new Diary();
    diary.set('title', data.title);
    diary.set('content', data.content);
    diary.set('mood', data.mood || '😊');
    
    // 获取城市和天气信息（异步）
    try {
        const locationWeather = await getLocationAndWeather();
        diary.set('city', locationWeather.city || '');
        diary.set('weather', locationWeather.weather || '');
    } catch (error) {
        console.error('获取位置和天气失败:', error);
        diary.set('city', '');
        diary.set('weather', '');
    }
    
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
    
    await diary.save();
}

// 异步获取位置和天气信息（使用免费API）
async function getLocationAndWeather() {
    try {
        // 方法1: 使用IP定位获取城市（免费，无需key）
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        const city = ipData.city || ipData.region || '未知';
        
        // 方法2: 使用OpenWeatherMap免费API获取天气（需要注册获取免费key，这里使用备用方案）
        // 如果OpenWeatherMap不可用，使用简单的天气描述
        let weather = '';
        try {
            // 使用免费的天气API（wttr.in）
            const weatherResponse = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C&lang=zh`);
            if (weatherResponse.ok) {
                weather = await weatherResponse.text();
                weather = weather.trim();
            }
        } catch (e) {
            console.log('天气API备用方案失败，使用默认值');
        }
        
        // 如果天气获取失败，使用城市信息推断
        if (!weather || weather === '') {
            weather = '未知';
        }
        
        return { city, weather };
    } catch (error) {
        console.error('获取位置和天气失败:', error);
        // 备用方案：使用浏览器地理位置API
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            // 使用反向地理编码获取城市（使用免费的nominatim API）
                            const lat = position.coords.latitude;
                            const lon = position.coords.longitude;
                            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);
                            const geoData = await geoResponse.json();
                            const city = geoData.address?.city || geoData.address?.town || geoData.address?.county || '未知';
                            
                            // 获取天气
                            const weatherResponse = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%C&lang=zh`);
                            let weather = '未知';
                            if (weatherResponse.ok) {
                                weather = await weatherResponse.text();
                                weather = weather.trim();
                            }
                            
                            resolve({ city, weather });
                        } catch (e) {
                            resolve({ city: '未知', weather: '未知' });
                        }
                    },
                    () => {
                        resolve({ city: '未知', weather: '未知' });
                    }
                );
            } else {
                resolve({ city: '未知', weather: '未知' });
            }
        });
    }
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

// 轮播图相关变量
let carouselImages = [];
let currentCarouselIndex = 0;
let carouselInterval = null;

// 加载轮播图
async function loadCarousel() {
    try {
        const carouselWrapper = document.querySelector('#carousel-wrapper')
        if (!carouselWrapper) return
        
        const currentUser = AV.User.current()
        if (!currentUser) {
            carouselWrapper.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 20px; text-align: center;">请先登录</div>'
            return
        }
        
        // 从LeanCloud加载轮播图数据
        const CarouselImage = AV.Object.extend('carouselImage')
        const query = new AV.Query(CarouselImage)
        query.equalTo('user', currentUser)
        query.descending('createdAt')
        const results = await query.find()
        
        carouselImages = results.map(item => ({
            id: item.id,
            url: item.get('url') || '',
            title: item.get('title') || '',
            link: item.get('link') || ''
        }))
        
        if (carouselImages.length === 0) {
            carouselWrapper.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 20px; text-align: center;">暂无图片<br><small>点击右上角"添加"按钮添加图片</small></div>'
            renderCarouselIndicators()
            return
        }
        
        renderCarousel()
        renderCarouselIndicators()
        startCarouselAutoPlay()
    } catch (error) {
        console.error('加载轮播图失败:', error)
        const carouselWrapper = document.querySelector('#carousel-wrapper')
        if (carouselWrapper) {
            carouselWrapper.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 20px; text-align: center;">加载失败</div>'
        }
    }
}

// 渲染轮播图（上下叠加的扑克牌样式，像蜘蛛纸牌）
let carouselSpeed = 2000 // 默认速度（毫秒）
let carouselHovered = false
let carouselAutoPlayInterval = null
let carouselStartY = 0
let carouselCurrentY = 0
let carouselIsDragging = false

function renderCarousel() {
    const carouselWrapper = document.querySelector('#carousel-wrapper')
    if (!carouselWrapper || carouselImages.length === 0) return
    
    // 真正的蜘蛛纸牌堆叠效果：底层图片的底部比上一层图片的底部低固定像素
    const stackHeight = 300
    const bottomOffset = 25 // 每层底部比上一层低25px
    carouselWrapper.innerHTML = `
        <div class="carousel-stack" style="position: relative; width: 100%; height: ${stackHeight + (carouselImages.length - 1) * bottomOffset}px; overflow: hidden; cursor: grab;">
            ${carouselImages.map((img, index) => {
                const zIndex = carouselImages.length - index
                // 计算每张图片的位置：底层图片的底部比上一层低bottomOffset像素
                // 第一张图片在顶部，第二张图片的底部比第一张低bottomOffset，以此类推
                const topPosition = index * bottomOffset
                const cardHeight = stackHeight
                return `
                    <div class="carousel-card" 
                         data-index="${index}"
                         style="position: absolute; 
                                top: ${topPosition}px; 
                                left: 0;
                                right: 0;
                                width: 100%;
                                height: ${cardHeight}px;
                                z-index: ${zIndex};
                                border-radius: 8px;
                                overflow: hidden;
                                cursor: grab;
                                transition: transform 0.3s ease-out, top 0.3s ease-out;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                                border: 1px solid rgba(0,0,0,0.1);
                                user-select: none;
                                touch-action: pan-y;
                                background: white;
                                transform: translateY(0);">
                        <img src="${img.url}" alt="${img.title || ''}" style="width: 100%; height: 100%; object-fit: contain; background: #f5f5f5; display: block; pointer-events: none;">
                        ${img.title ? `<div class="carousel-item-title" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); color: white; padding: 8px; font-size: 11px;">${img.title}</div>` : ''}
                        ${canEdit() ? `<button class="carousel-delete-btn" data-id="${img.id}" style="position: absolute; top: 5px; right: 5px; background: rgba(255, 77, 77, 0.9); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; cursor: pointer; font-size: 12px; line-height: 1; display: flex; align-items: center; justify-content: center; z-index: 100; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">×</button>` : ''}
                    </div>
                `
            }).join('')}
        </div>
        ${carouselImages.length > 1 ? `
            <div class="carousel-speed-control" style="position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 4px 10px; border-radius: 15px; font-size: 10px; display: flex; align-items: center; gap: 6px; z-index: 1000;">
                <span>速度:</span>
                <input type="range" id="carousel-speed-slider" min="500" max="5000" step="500" value="${carouselSpeed}" style="width: 60px; height: 4px;">
                <span id="carousel-speed-value" style="min-width: 30px;">${carouselSpeed/1000}秒</span>
            </div>
        ` : ''}
    `
    
    const stack = carouselWrapper.querySelector('.carousel-stack')
    
    // 绑定删除按钮和点击事件
    carouselWrapper.querySelectorAll('.carousel-card').forEach((item, index) => {
        const img = carouselImages[index]
        const deleteBtn = item.querySelector('.carousel-delete-btn')
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation()
                if (confirm('确定要删除这张图片吗？')) {
                    await deleteCarouselImage(img.id)
                }
            })
        }
        
        if (img.link) {
            item.addEventListener('click', (e) => {
                if (!carouselIsDragging) {
                    window.open(img.link, '_blank')
                }
            })
        }
        
        // 拖拽滑动功能（蜘蛛纸牌效果）
        let startY = 0
        let currentY = 0
        let isDragging = false
        let dragCard = null
        
        item.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('carousel-delete-btn')) return
            // 只允许拖拽最上面的卡片
            if (parseInt(item.dataset.index) !== 0) return
            
            isDragging = true
            carouselIsDragging = true
            dragCard = item
            startY = e.clientY
            item.style.cursor = 'grabbing'
            item.style.transition = 'none'
            item.style.zIndex = 10000
        })
        
        const handleMouseMove = (e) => {
            if (!isDragging || !dragCard) return
            currentY = e.clientY - startY
            // 允许向上拖拽（显示下一张）或向下拖拽（回弹）
            const maxOffset = 300
            const clampedY = Math.max(-maxOffset, Math.min(50, currentY))
            dragCard.style.transform = `translateY(${clampedY}px)`
        }
        
        const handleMouseUp = () => {
            if (!isDragging || !dragCard) return
            isDragging = false
            carouselIsDragging = false
            dragCard.style.cursor = 'grab'
            dragCard.style.transition = 'transform 0.3s ease-out'
            
            // 如果向上拖拽超过阈值，切换到下一张
            if (currentY < -80) {
                // 向上拖拽，将第一张移到最后
                dragCard.style.transform = 'translateY(-100%)'
                setTimeout(() => {
                    carouselImages.push(carouselImages.shift())
                    renderCarousel()
                }, 300)
            } else {
                // 回弹
                dragCard.style.transform = 'translateY(0)'
            }
            currentY = 0
            dragCard = null
        }
        
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        
        // 移除hover效果，保持堆叠状态
    })
    
    // 速度控制
    const speedSlider = carouselWrapper.querySelector('#carousel-speed-slider')
    const speedValue = carouselWrapper.querySelector('#carousel-speed-value')
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
            carouselSpeed = parseInt(e.target.value)
            speedValue.textContent = (carouselSpeed / 1000) + '秒'
            if (carouselAutoPlayInterval) {
                startCarouselAutoPlay()
            }
        })
    }
    
    // 自动轮播（hover时暂停）
    if (stack) {
        stack.addEventListener('mouseenter', () => {
            carouselHovered = true
            stopCarouselAutoPlay()
        })
        stack.addEventListener('mouseleave', () => {
            carouselHovered = false
            startCarouselAutoPlay()
        })
    }
    
    startCarouselAutoPlay()
}

function startCarouselAutoPlay() {
    if (carouselImages.length <= 1 || carouselHovered) return
    stopCarouselAutoPlay()
    
    carouselAutoPlayInterval = setInterval(() => {
        if (carouselHovered) return
        
        // 将第一张图片移到最后（向上滑出）
        const firstCard = document.querySelector('.carousel-card[data-index="0"]')
        if (firstCard) {
            firstCard.style.transition = 'all 0.5s'
            firstCard.style.transform = 'translateY(-100%)'
            firstCard.style.opacity = '0'
            
            setTimeout(() => {
                // 重新排列
                carouselImages.push(carouselImages.shift())
                renderCarousel()
            }, 500)
        }
    }, carouselSpeed)
}

function stopCarouselAutoPlay() {
    if (carouselAutoPlayInterval) {
        clearInterval(carouselAutoPlayInterval)
        carouselAutoPlayInterval = null
    }
}

// 渲染指示器（网格布局不需要指示器）
function renderCarouselIndicators() {
    const indicators = document.querySelector('#carousel-indicators')
    if (!indicators) return
    // 网格布局不需要指示器
    indicators.innerHTML = ''
}

// 这些函数已在renderCarousel中重新定义

// 删除轮播图
async function deleteCarouselImage(id) {
    try {
        const image = AV.Object.createWithoutData('carouselImage', id)
        await image.destroy()
        await loadCarousel()
    } catch (error) {
        console.error('删除轮播图失败:', error)
        alert('删除失败: ' + (error.message || '未知错误'))
    }
}

// 添加轮播图
async function addCarouselImage(url, title, link) {
    try {
        const currentUser = AV.User.current()
        if (!currentUser) {
            alert('请先登录')
            return
        }
        
        const CarouselImage = AV.Object.extend('carouselImage')
        const image = new CarouselImage()
        image.set('url', url)
        image.set('title', title || '')
        image.set('link', link || '')
        image.set('user', currentUser)
        
        const acl = new AV.ACL()
        acl.setPublicReadAccess(true)
        acl.setPublicWriteAccess(true)
        image.setACL(acl)
        
        await image.save()
        await loadCarousel()
    } catch (error) {
        console.error('添加轮播图失败:', error)
        alert('添加失败: ' + (error.message || '未知错误'))
    }
}

// 上传轮播图片（使用LeanCloud）
async function uploadCarouselImage(file) {
    try {
        if (typeof uploadImageToLeanCloud === 'undefined') {
            // 如果没有uploadImageToLeanCloud，直接使用AV.File
            const avFile = new AV.File(file.name, file)
            const savedFile = await avFile.save()
            return savedFile.attributes.url
        } else {
            return await uploadImageToLeanCloud(file)
        }
    } catch (error) {
        console.error('上传轮播图失败:', error)
        throw error
    }
}

// 显示添加轮播图弹窗
function showAddCarouselImageModal() {
    const modal = document.createElement('div')
    modal.className = 'add-important-day-modal-overlay'
    modal.style.display = 'flex'
    modal.innerHTML = `
        <div class="add-important-day-modal" style="max-width: 500px;">
            <h3>添加轮播图</h3>
            <div class="modal-form">
                <label>方式选择：</label>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button id="upload-image-btn" class="btn" style="flex: 1;">📁 上传图片</button>
                    <button id="url-image-btn" class="btn" style="flex: 1;">🔗 使用URL</button>
                </div>
                <div id="upload-area" style="display: none; border: 2px dashed #ccc; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 15px;">
                    <p>拖拽图片到此处或点击选择</p>
                    <input type="file" id="image-file-input" accept="image/*" style="display: none;">
                    <button class="btn" onclick="document.getElementById('image-file-input').click()">选择文件</button>
                </div>
                <div id="url-area" style="display: none;">
                    <label>图片URL：</label>
                    <input type="text" id="image-url-input" class="form-control" placeholder="https://...">
                </div>
                <label>图片标题（可选）：</label>
                <input type="text" id="image-title-input" class="form-control" placeholder="图片标题">
                <label>点击跳转链接（可选）：</label>
                <input type="text" id="image-link-input" class="form-control" placeholder="https://...">
            </div>
            <div class="modal-buttons">
                <button id="save-carousel-btn" class="btn-add">保存</button>
                <button id="cancel-carousel-btn" class="btn" style="background: #ccc; margin-left: 10px;">取消</button>
            </div>
        </div>
    `
    document.body.appendChild(modal)
    
    let selectedFile = null
    let imageUrl = ''
    
    // 上传图片按钮
    modal.querySelector('#upload-image-btn').addEventListener('click', () => {
        modal.querySelector('#upload-area').style.display = 'block'
        modal.querySelector('#url-area').style.display = 'none'
    })
    
    // URL按钮
    modal.querySelector('#url-image-btn').addEventListener('click', () => {
        modal.querySelector('#upload-area').style.display = 'none'
        modal.querySelector('#url-area').style.display = 'block'
    })
    
    // 文件选择（支持多文件）
    const fileInput = modal.querySelector('#image-file-input')
    fileInput.setAttribute('multiple', 'multiple')
    
    // 单文件预览（用于保存按钮）
    fileInput.addEventListener('change', (e) => {
        selectedFile = e.target.files[0]
        if (selectedFile) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const preview = document.createElement('img')
                preview.src = e.target.result
                preview.style.maxWidth = '100%'
                preview.style.maxHeight = '200px'
                preview.style.borderRadius = '10px'
                preview.style.marginTop = '10px'
                const existingPreview = modal.querySelector('#upload-area img')
                if (existingPreview) existingPreview.remove()
                modal.querySelector('#upload-area').appendChild(preview)
                
                // 显示多文件提示
                if (e.target.files.length > 1) {
                    const count = document.createElement('div')
                    count.textContent = `已选择 ${e.target.files.length} 张图片，点击保存将全部上传`
                    count.style.marginTop = '10px'
                    count.style.fontSize = '12px'
                    count.style.color = 'var(--primary)'
                    const existingCount = modal.querySelector('#upload-area .file-count')
                    if (existingCount) existingCount.remove()
                    count.className = 'file-count'
                    modal.querySelector('#upload-area').appendChild(count)
                }
            }
            reader.readAsDataURL(selectedFile)
        }
    })
    
    // 保存按钮（支持单图和多图）
    modal.querySelector('#save-carousel-btn').addEventListener('click', async () => {
        const title = modal.querySelector('#image-title-input').value
        const link = modal.querySelector('#image-link-input').value
        const files = Array.from(fileInput.files)
        
        try {
            if (files.length > 0) {
                // 多图上传
                modal.querySelector('#save-carousel-btn').disabled = true
                modal.querySelector('#save-carousel-btn').textContent = `上传中... (0/${files.length})`
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    const url = await uploadCarouselImage(file)
                    await addCarouselImage(url, title, link)
                    modal.querySelector('#save-carousel-btn').textContent = `上传中... (${i + 1}/${files.length})`
                }
                
                document.body.removeChild(modal)
            } else if (modal.querySelector('#image-url-input').value) {
                // URL方式
                await addCarouselImage(modal.querySelector('#image-url-input').value, title, link)
                document.body.removeChild(modal)
            } else {
                alert('请选择图片或输入图片URL')
            }
        } catch (error) {
            console.error('保存失败:', error)
            alert('保存失败: ' + (error.message || '未知错误'))
            modal.querySelector('#save-carousel-btn').disabled = false
            modal.querySelector('#save-carousel-btn').textContent = '保存'
        }
    })
    
    // 取消按钮
    modal.querySelector('#cancel-carousel-btn').addEventListener('click', () => {
        document.body.removeChild(modal)
    })
    
    // 点击遮罩关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal)
        }
    })
}

async function load() {
    allDiaries = await getData()
    await loadFriends()
    renderDiaries(allDiaries)
    updateStats(allDiaries)
    renderFriends()
    loadCarousel()
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
        
        if (!friendUsername || friendUsername.trim() === '') {
            alert('请输入用户名')
            return
        }
        
        friendUsername = friendUsername.trim()
        
        // 检查是否是自己
        if (friendUsername === currentUser.get('username')) {
            alert('不能添加自己为好友')
            return
        }
        
        // 使用AV.User.query()查询用户（需要LeanCloud配置允许查询_User表）
        let friendUser = null
        let friendId = null
        
        try {
            // 方法1：直接查询_User表（如果权限允许）
            const userQuery = AV.User.query()
            userQuery.equalTo('username', friendUsername)
            const users = await userQuery.find()
            
            if (users.length > 0) {
                friendUser = users[0]
                friendId = friendUser.id
            }
        } catch (error) {
            console.log('直接查询用户失败，尝试通过日记查找:', error)
            // 方法2：如果直接查询失败，通过日记查找用户
            try {
                const journalQuery = new AV.Query('journal')
                journalQuery.equalTo('author', friendUsername)
                journalQuery.limit(1)
                const journals = await journalQuery.find()
                
                if (journals.length > 0) {
                    const journal = journals[0]
                    const userPointer = journal.get('user')
                    if (userPointer) {
                        friendId = userPointer.id || userPointer.objectId
                    }
                }
            } catch (e) {
                console.error('通过日记查找用户失败:', e)
            }
        }
        
        if (!friendId) {
            alert('未找到该用户，请确认用户名正确')
            return
        }
        
        // 检查是否已经是好友（先尝试查询，如果类不存在则跳过检查）
        let existing = []
        try {
            const Friend = AV.Object.extend('friend')
            const checkQuery = new AV.Query(Friend)
            checkQuery.equalTo('user', currentUser)
            checkQuery.equalTo('friendId', friendId)
            existing = await checkQuery.find()
        } catch (checkError) {
            console.log('检查好友关系失败（可能是类不存在）:', checkError)
            // 如果类不存在，继续创建
        }
        
        if (existing.length > 0) {
            alert('该用户已经是您的好友')
            return
        }
        
        // 检查是否是自己
        if (friendId === currentUser.id) {
            alert('不能添加自己为好友')
            return
        }
        
        // 添加好友（如果类不存在会自动创建）
        try {
            const Friend = AV.Object.extend('friend')
            const friend = new Friend()
            friend.set('user', currentUser)
            friend.set('friendId', friendId)
            friend.set('friendUsername', friendUsername)
            
            // 设置ACL权限
            const acl = new AV.ACL()
            acl.setPublicReadAccess(true)
            acl.setPublicWriteAccess(true)
            friend.setACL(acl)
            
            await friend.save()
        } catch (saveError) {
            console.error('保存好友失败:', saveError)
            // 如果保存失败，可能是类不存在，提示用户
            if (saveError.message && saveError.message.includes('404') || saveError.message.includes('doesn\'t exists')) {
                throw new Error('好友类不存在，请先在LeanCloud控制台创建"friend"类，或联系管理员')
            }
            throw saveError
        }
        
        await loadFriends()
        alert('添加好友成功！')
    } catch (error) {
        console.error('添加好友失败:', error)
        let errorMsg = error.message || '未知错误'
        if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
            errorMsg = '权限不足，无法查询用户表。请联系管理员配置LeanCloud权限，或使用云函数查询用户。'
        }
        alert('添加好友失败: ' + errorMsg)
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
    const city = diary.attributes.city || ''
    const weather = diary.attributes.weather || ''
    const author = diary.attributes.author || '未知用户'
    // 图片已通过图床直接插入 Markdown 内容，无需单独的 image 字段
    
    const entry = document.createElement("div")
    entry.className = "diary-entry"
    entry.dataset.diaryId = diaryId
    entry.innerHTML = `
        <div class="diary-entry-header">
            <div class="diary-header-left">
                <span class="diary-mood">${mood}</span>
                <span class="diary-title">${title || '无标题'}</span>
            </div>
            <div class="diary-header-right">
                <span class="diary-author">👤 ${author}</span>
                <span class="diary-time">${time || ''}</span>
                ${canEdit() ? `
                    <button class="diary-edit-btn" data-id="${diaryId}">✏️</button>
                    <button class="diary-delete-btn" data-id="${diaryId}">🗑️</button>
                ` : ''}
            </div>
        </div>
        <div class="diary-entry-content">
            ${contentHtml}
        </div>
        <div class="diary-entry-footer">
            ${city ? `<span class="diary-location">📍 ${city}</span>` : ''}
            ${weather ? `<span class="diary-weather">☀️ ${weather}</span>` : ''}
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
