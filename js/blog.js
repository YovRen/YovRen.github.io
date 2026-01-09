// AV.init 已在 HTML 中初始化，这里不再重复初始化
// 直接使用 AV.Query 和 AV.User，不声明常量避免重复声明错误

let blogTitle, blogContent, blogTags, blogCategory, blogSubmit, blogCancel, blogOverlay;
let newBlogBtn, blogList, searchInput, blogEditingId;
let allBlogs = []
let blogContentEditor = null
let currentFilter = 'all'
let currentCategory = null
let currentArchive = null

function initBlogElements() {
    blogTitle = document.querySelector("#blog-title")
    blogContent = document.querySelector("#blog-content")
    blogTags = document.querySelector("#blog-tags")
    blogCategory = document.querySelector("#blog-category")
    blogSubmit = document.querySelector("#blog-submit")
    blogCancel = document.querySelector("#blog-cancel")
    blogOverlay = document.querySelector("#blog-overlay")
    newBlogBtn = document.querySelector("#new-blog")
    blogList = document.querySelector("#blog-list")
    searchInput = document.querySelector("#search-blog")
    blogEditingId = document.querySelector("#blog-editing-id")

    console.log('初始化博客元素:', {
        newBlogBtn: !!newBlogBtn,
        blogOverlay: !!blogOverlay,
        blogSubmit: !!blogSubmit
    });

    return newBlogBtn && blogOverlay && blogSubmit;
}

// 初始化Markdown编辑器
function initBlogMarkdownEditor() {
    if (typeof EasyMDE === 'undefined') {
        console.warn('EasyMDE not loaded yet, retrying...');
        setTimeout(initBlogMarkdownEditor, 100);
        return;
    }
    if (blogContent && !blogContentEditor) {
        try {
            blogContentEditor = new EasyMDE({
                element: blogContent,
                placeholder: "开始写作吧...支持Markdown格式，可直接粘贴图片",
                spellChecker: false,
                autosave: {
                    enabled: false
                },
                toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview", "side-by-side", "fullscreen", "|", "guide"]
            });

            // 设置图片上传功能
            if (typeof setupImagePaste === 'function') {
                setupImagePaste(blogContentEditor);
            }
            if (typeof setupCustomImageUpload === 'function') {
                setupCustomImageUpload(blogContentEditor);
            }
        } catch (e) {
            console.error('Failed to initialize EasyMDE:', e);
        }
    }
}

// 绑定事件监听器
function setupBlogEventListeners() {
    if (newBlogBtn) {
        newBlogBtn.addEventListener("click", () => {
            console.log('点击写博客按钮');
            if (typeof requireLogin === 'function' && !requireLogin()) {
                return;
            }
            if (blogOverlay) blogOverlay.hidden = false
            if (blogEditingId) blogEditingId.value = ''
            if (blogTitle) blogTitle.value = ''
            if (blogContentEditor) {
                blogContentEditor.value('')
            } else if (blogContent) {
                blogContent.value = ''
            }
            if (blogTags) blogTags.value = ''
            if (blogCategory) blogCategory.value = ''
            // 重新初始化编辑器（如果还没初始化）
            if (!blogContentEditor && blogContent) {
                setTimeout(() => {
                    initBlogMarkdownEditor()
                }, 100)
            }
        })
    } else {
        console.error('newBlogBtn not found!');
    }

    if (blogCancel) {
        blogCancel.addEventListener("click", () => {
            if (blogOverlay) blogOverlay.hidden = true
            if (blogEditingId) blogEditingId.value = ''
            if (blogTitle) blogTitle.value = ''
            if (blogContent) blogContent.value = ''
            if (blogTags) blogTags.value = ''
            if (blogCategory) blogCategory.value = ''
        })
    }

    // 点击遮罩层关闭表单
    if (blogOverlay) {
        blogOverlay.addEventListener("click", (e) => {
            if (e.target === blogOverlay) {
                blogOverlay.hidden = true
                if (blogEditingId) blogEditingId.value = ''
                if (blogTitle) blogTitle.value = ''
                if (blogContent) blogContent.value = ''
                if (blogTags) blogTags.value = ''
            }
        })
    }

    // 搜索功能
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const keyword = e.target.value.toLowerCase()
            if (keyword === '') {
                if (currentFilter === 'category') {
                    filterByCategory(currentCategory)
                } else if (currentFilter === 'archive') {
                    filterByArchive(currentArchive)
                } else {
                    showAll()
                }
            } else {
                let baseBlogs = allBlogs
                if (currentFilter === 'category' && currentCategory) {
                    baseBlogs = allBlogs.filter(b => (b.attributes.category || '未分类') === currentCategory)
                } else if (currentFilter === 'archive' && currentArchive) {
                    const [year, month] = currentArchive.split('-')
                    baseBlogs = allBlogs.filter(b => {
                        const time = b.attributes.time || ''
                        if (time) {
                            const datePart = time.split(' ')[0]
                            const [blogYear, blogMonth] = datePart.split('-')
                            return blogYear === year && blogMonth === month
                        }
                        return false
                    })
                }
                
                const filtered = baseBlogs.filter(blog => {
                    const title = blog.attributes.title || ''
                    const content = blog.attributes.content || ''
                    const tags = blog.attributes.tags || ''
                    const category = blog.attributes.category || ''
                    return title.toLowerCase().includes(keyword) ||
                        content.toLowerCase().includes(keyword) ||
                        tags.toLowerCase().includes(keyword) ||
                        category.toLowerCase().includes(keyword)
                })
                renderBlogs(filtered)
                updateViewTitle('搜索结果', `找到 ${filtered.length} 篇文章`)
            }
        })
    }
    
    // 导航按钮事件
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter
            if (filter === 'all') {
                showAll()
            } else if (filter === 'category') {
                // 显示分类视图，但不筛选
                currentFilter = 'category'
                renderBlogs(allBlogs)
                updateViewTitle('全部博客', `共 ${allBlogs.length} 篇文章`)
                updateNavButtons('category')
            } else if (filter === 'archive') {
                // 显示归档视图，但不筛选
                currentFilter = 'archive'
                renderBlogs(allBlogs)
                updateViewTitle('全部博客', `共 ${allBlogs.length} 篇文章`)
                updateNavButtons('archive')
            }
        })
    })

    // 提交表单
    if (blogSubmit) {
        blogSubmit.addEventListener("click", async event => {
            if (typeof requireLogin === 'function' && !requireLogin()) {
                return;
            }
            const contentValue = blogContentEditor ? blogContentEditor.value() : (blogContent ? blogContent.value : '')
            if (contentValue !== '') {
                if (blogEditingId && blogEditingId.value) {
                    // 编辑模式
                    await updateBlog(blogEditingId.value, {
                        title: blogTitle ? blogTitle.value : '',
                        content: contentValue,
                        tags: blogTags ? blogTags.value : '',
                        category: blogCategory ? blogCategory.value : ''
                    })
                } else {
                    // 新建模式
                    saveBlog({
                        title: blogTitle ? blogTitle.value : '',
                        content: contentValue,
                        tags: blogTags ? blogTags.value : '',
                        category: blogCategory ? blogCategory.value : ''
                    })
                }
                if (blogTitle) blogTitle.value = ''
                if (blogContentEditor) {
                    blogContentEditor.value('')
                } else if (blogContent) {
                    blogContent.value = ''
                }
                if (blogTags) blogTags.value = ''
                if (blogCategory) blogCategory.value = ''
                if (blogEditingId) blogEditingId.value = ''
                if (blogOverlay) blogOverlay.hidden = true
                await load()
            }
        })
    } else {
        console.error('blogSubmit button not found!');
    }
}

async function getBlogs() {
    let data = []
    const currentUser = AV.User.current()
    
    if (!currentUser) {
        // 未登录时返回空数组，或者可以显示公开博客
        return data
    }
    
    // 只查询当前用户的博客
    const queryAll = new AV.Query('blog');
    queryAll.equalTo('user', currentUser);
    await queryAll.find().then((rows) => {
        for (let row of rows) {
            data.push(row);
        }
    });
    return data
}

function time() {
    var d = new Date()
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes();
}

function saveBlog(data) {
    const Blog = AV.Object.extend('blog');
    const blog = new Blog();
    blog.set('title', data.title);
    blog.set('content', data.content);
    blog.set('tags', data.tags || '');
    blog.set('category', data.category || '未分类');
    blog.set('time', time());

    // 使用当前登录用户作为作者（必须登录）
    const currentUser = AV.User.current();
    if (!currentUser) {
        throw new Error('请先登录才能发布博客');
    }
    const username = currentUser.get('username') || currentUser.get('email') || '未知用户';
    blog.set('author', username);
    // 保存用户对象的引用
    blog.set('user', currentUser);

    blog.save();
}

async function updateBlog(id, data) {
    const blog = AV.Object.createWithoutData('blog', id);
    blog.set('title', data.title);
    blog.set('content', data.content);
    blog.set('tags', data.tags || '');
    blog.set('category', data.category || '未分类');
    await blog.save();
}

async function deleteBlog(id) {
    if (typeof requireLogin === 'function' && !requireLogin()) {
        return;
    }
    if (confirm('确定要删除这篇博客吗？')) {
        const blog = AV.Object.createWithoutData('blog', id);
        await blog.destroy();
        await load();
    }
}

// 加载标签云
async function loadTagsCloud() {
    try {
        const tagsCloudEl = document.querySelector('#blog-tags-cloud')
        if (!tagsCloudEl) return
        
        const tagCounts = {}
        allBlogs.forEach(blog => {
            const tags = blog.attributes.tags
            if (tags) {
                tags.split(',').forEach(tag => {
                    const trimmedTag = tag.trim()
                    if (trimmedTag) {
                        tagCounts[trimmedTag] = (tagCounts[trimmedTag] || 0) + 1
                    }
                })
            }
        })
        
        const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])
        
        if (sortedTags.length === 0) {
            tagsCloudEl.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 10px;">暂无标签</div>'
            return
        }
        
        tagsCloudEl.innerHTML = sortedTags.map(([tag, count]) => {
            const size = Math.min(14 + count * 2, 20)
            return `
                <span class="tag-cloud-item" data-tag="${tag}" style="font-size: ${size}px; margin: 5px; display: inline-block; padding: 4px 10px; background: linear-gradient(135deg, rgba(74, 144, 226, 0.15), rgba(118, 75, 162, 0.1)); border-radius: 12px; cursor: pointer; transition: all 0.3s; border: 2px solid rgba(74, 144, 226, 0.2);">
                    ${tag} <span style="font-size: 11px; opacity: 0.7;">(${count})</span>
                </span>
            `
        }).join('')
        
        // 绑定标签点击事件
        tagsCloudEl.querySelectorAll('.tag-cloud-item').forEach(item => {
            item.addEventListener('click', function() {
                const tag = this.dataset.tag
                filterByTag(tag)
            })
        })
    } catch (error) {
        console.error('加载标签云失败:', error)
    }
}

// 按标签筛选
function filterByTag(tag) {
    const filtered = allBlogs.filter(blog => {
        const tags = blog.attributes.tags || ''
        return tags.split(',').map(t => t.trim()).includes(tag)
    })
    renderBlogs(filtered, `标签: ${tag}`, `共 ${filtered.length} 篇文章`)
}

// 加载热门文章
async function loadPopularBlogs() {
    try {
        const popularEl = document.querySelector('#blog-popular')
        if (!popularEl) return
        
        // 按内容长度排序（假设长的文章更受欢迎）
        const popular = [...allBlogs].sort((a, b) => {
            const lenA = (a.attributes.content || '').length
            const lenB = (b.attributes.content || '').length
            return lenB - lenA
        }).slice(0, 5)
        
        if (popular.length === 0) {
            popularEl.innerHTML = '<div style="color: var(--muted); font-size: 13px; padding: 10px;">暂无文章</div>'
            return
        }
        
        popularEl.innerHTML = popular.map((blog, index) => {
            const title = blog.attributes.title || '无标题'
            const time = blog.attributes.time || ''
            return `
                <div class="popular-blog-item" data-id="${blog.id}" style="padding: 12px; margin-bottom: 10px; background: linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(118, 75, 162, 0.05)); border-radius: 15px; cursor: pointer; transition: all 0.3s; border: 2px solid rgba(74, 144, 226, 0.15);">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: var(--text-color);">${title}</div>
                    <div style="font-size: 12px; color: var(--muted);">${time}</div>
                </div>
            `
        }).join('')
        
        // 绑定点击事件
        popularEl.querySelectorAll('.popular-blog-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = this.dataset.id
                const blog = allBlogs.find(b => b.id === id)
                if (blog) {
                    viewBlog(blog)
                }
            })
        })
    } catch (error) {
        console.error('加载热门文章失败:', error)
    }
}

async function load() {
    allBlogs = await getBlogs()
    // 按时间倒序排列
    allBlogs.sort((a, b) => {
        const timeA = a.attributes.time || '';
        const timeB = b.attributes.time || '';
        return timeB.localeCompare(timeA);
    })
    renderBlogs(allBlogs)
    updateBlogStats(allBlogs)
    renderCategories(allBlogs)
    renderArchives(allBlogs)
    loadNotes()
    updateViewTitle('全部博客', `共 ${allBlogs.length} 篇文章`)
}

function renderBlogs(blogs) {
    if (!blogList) {
        console.error('blogList not found!');
        return;
    }

    blogList.innerHTML = ''

    if (blogs.length === 0) {
        blogList.innerHTML = '<div class="blog-empty">还没有博客，开始写第一篇吧！</div>'
        return
    }

    blogs.forEach(blog => {
        const blogCard = createBlogCard(blog)
        blogList.appendChild(blogCard)
    })

    // 渲染后绑定事件
    bindBlogEvents();
}

function createBlogCard(blog) {
    const blogId = blog.id
    const title = blog.attributes.title || '无标题'
    const contentText = blog.attributes.content || ''
    const time = blog.attributes.time || ''
    const category = blog.attributes.category || '未分类'
    const tags = blog.attributes.tags || ''
    const tagArray = tags.split(',').filter(t => t.trim())
    
    // 生成摘要（前200个字符，去除markdown标记）
    let summary = contentText
        .replace(/[#*_`\[\]()]/g, '') // 移除markdown标记
        .replace(/\n/g, ' ') // 替换换行为空格
        .trim()
    
    if (summary.length > 200) {
        summary = summary.substring(0, 200) + '...'
    }
    
    // 完整内容的HTML（用于详情页）
    const contentHtml = typeof marked !== 'undefined' ? marked.parse(contentText) : contentText.replace(/\n/g, '<br>')

    const card = document.createElement("div")
    card.className = "blog-card"
    card.dataset.blogId = blogId
    card.innerHTML = `
        <div class="blog-card-header">
            <h3 class="blog-card-title">${title}</h3>
            <div class="blog-card-meta">
                <span class="blog-time">${time}</span>
                ${canEdit() ? `
                    <button class="blog-edit-btn" data-id="${blogId}">✏️ 编辑</button>
                    <button class="blog-delete-btn" data-id="${blogId}">🗑️ 删除</button>
                ` : ''}
            </div>
        </div>
        <div class="blog-card-summary">
            ${summary || '暂无内容'}
        </div>
        <div class="blog-card-full-content" style="display: none;">
            ${contentHtml}
        </div>
        <div class="blog-card-footer">
            ${category ? `<span class="blog-category">📁 ${category}</span>` : ''}
            ${tagArray.length > 0 ? `
                <div class="blog-tags">
                    ${tagArray.map(tag => `<span class="blog-tag">${tag.trim()}</span>`).join('')}
                </div>
            ` : ''}
            <button class="blog-read-more" data-id="${blogId}">阅读全文 →</button>
        </div>
    `

    return card
}

// 绑定编辑和删除按钮
function bindBlogEvents() {
    document.querySelectorAll('.blog-edit-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            if (typeof requireLogin === 'function' && !requireLogin()) {
                return;
            }
            const id = this.getAttribute('data-id')
            const blog = allBlogs.find(b => b.id === id)
            if (blog) {
                if (blogEditingId) blogEditingId.value = id
                if (blogTitle) blogTitle.value = blog.attributes.title || ''
                if (blogTags) blogTags.value = blog.attributes.tags || ''
                if (blogCategory) blogCategory.value = blog.attributes.category || ''
                
                // 确保编辑器已初始化
                if (!blogContentEditor && blogContent) {
                    initBlogMarkdownEditor()
                    // 等待编辑器初始化完成
                    setTimeout(() => {
                        if (blogContentEditor) {
                            blogContentEditor.value(blog.attributes.content || '')
                        }
                        if (blogOverlay) blogOverlay.hidden = false
                    }, 200)
                } else if (blogContentEditor) {
                    blogContentEditor.value(blog.attributes.content || '')
                    if (blogOverlay) blogOverlay.hidden = false
                } else if (blogContent) {
                    blogContent.value = blog.attributes.content || ''
                    if (blogOverlay) blogOverlay.hidden = false
                }
                
                if (blogCancel) blogCancel.style.display = 'inline-block'
            }
        })
    })

    document.querySelectorAll('.blog-delete-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.getAttribute('data-id')
            await deleteBlog(id)
        })
    })
    
    // 阅读全文按钮
    document.querySelectorAll('.blog-read-more').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation()
            const id = this.getAttribute('data-id')
            const card = this.closest('.blog-card')
            const summary = card.querySelector('.blog-card-summary')
            const fullContent = card.querySelector('.blog-card-full-content')
            const readMoreBtn = this
            
            if (!summary || !fullContent) return
            
            if (fullContent.style.display === 'none' || fullContent.style.display === '') {
                // 显示完整内容
                summary.style.display = 'none'
                fullContent.style.display = 'block'
                readMoreBtn.textContent = '收起 ↑'
            } else {
                // 收起内容
                summary.style.display = 'block'
                fullContent.style.display = 'none'
                readMoreBtn.textContent = '阅读全文 →'
            }
        })
    })
}

function updateBlogStats(blogs) {
    const totalCount = blogs.length
    let totalWords = 0
    const categories = new Set()

    blogs.forEach(blog => {
        totalWords += (blog.attributes.content || '').length
        const category = blog.attributes.category || '未分类'
        categories.add(category)
    })

    const totalCountEl = document.querySelector("#blog-total-count")
    const totalWordsEl = document.querySelector("#blog-total-words")
    const categoryCountEl = document.querySelector("#blog-category-count")
    if (totalCountEl) totalCountEl.textContent = totalCount
    if (totalWordsEl) totalWordsEl.textContent = totalWords
    if (categoryCountEl) categoryCountEl.textContent = categories.size
}

// 渲染分类列表
function renderCategories(blogs) {
    const categoryList = document.querySelector("#category-list")
    if (!categoryList) return
    
    const categoryMap = new Map()
    blogs.forEach(blog => {
        const category = blog.attributes.category || '未分类'
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })
    
    const sortedCategories = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1])
    
    categoryList.innerHTML = sortedCategories.map(([category, count]) => 
        `<div class="category-item" data-category="${category}">
            <span class="category-name">${category}</span>
            <span class="category-count">${count}</span>
        </div>`
    ).join('')
    
    // 绑定分类点击事件
    categoryList.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category
            filterByCategory(category)
        })
    })
    
    // 更新分类建议
    const suggestions = document.querySelector("#category-suggestions")
    if (suggestions) {
        suggestions.innerHTML = sortedCategories.map(([category]) => 
            `<option value="${category}">`
        ).join('')
    }
}

// 渲染归档列表
function renderArchives(blogs) {
    const archiveList = document.querySelector("#archive-list")
    if (!archiveList) return
    
    const archiveMap = new Map()
    blogs.forEach(blog => {
        const time = blog.attributes.time || ''
        if (time) {
            const datePart = time.split(' ')[0] // 获取日期部分
            const [year, month] = datePart.split('-')
            if (year && month) {
                const archiveKey = `${year}-${month}`
                const archiveLabel = `${year}年${parseInt(month)}月`
                archiveMap.set(archiveKey, {
                    label: archiveLabel,
                    count: (archiveMap.get(archiveKey)?.count || 0) + 1
                })
            }
        }
    })
    
    const sortedArchives = Array.from(archiveMap.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
    
    archiveList.innerHTML = sortedArchives.map(([key, {label, count}]) => 
        `<div class="archive-item" data-archive="${key}">
            <span class="archive-label">${label}</span>
            <span class="archive-count">${count}</span>
        </div>`
    ).join('')
    
    // 绑定归档点击事件
    archiveList.querySelectorAll('.archive-item').forEach(item => {
        item.addEventListener('click', () => {
            const archive = item.dataset.archive
            filterByArchive(archive)
        })
    })
}

// 按分类筛选
function filterByCategory(category) {
    currentFilter = 'category'
    currentCategory = category
    currentArchive = null
    
    const filtered = allBlogs.filter(blog => {
        const blogCategory = blog.attributes.category || '未分类'
        return blogCategory === category
    })
    
    renderBlogs(filtered)
    updateViewTitle(`分类: ${category}`, `共 ${filtered.length} 篇文章`)
    updateNavButtons('category')
}

// 按归档筛选
function filterByArchive(archive) {
    currentFilter = 'archive'
    currentArchive = archive
    currentCategory = null
    
    const [year, month] = archive.split('-')
    const filtered = allBlogs.filter(blog => {
        const time = blog.attributes.time || ''
        if (time) {
            const datePart = time.split(' ')[0]
            const [blogYear, blogMonth] = datePart.split('-')
            return blogYear === year && blogMonth === month
        }
        return false
    })
    
    renderBlogs(filtered)
    const label = `${year}年${parseInt(month)}月`
    updateViewTitle(`归档: ${label}`, `共 ${filtered.length} 篇文章`)
    updateNavButtons('archive')
}

// 显示全部
function showAll() {
    currentFilter = 'all'
    currentCategory = null
    currentArchive = null
    renderBlogs(allBlogs)
    updateViewTitle('全部博客', `共 ${allBlogs.length} 篇文章`)
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

// 加载作者信息
async function loadAuthorInfo() {
    try {
        const currentUser = AV.User.current()
        if (!currentUser) {
            // 未登录时隐藏编辑按钮
            const editBtn = document.querySelector('#edit-author-btn')
            if (editBtn) editBtn.style.display = 'none'
            return
        }
        
        // 显示编辑按钮
        const editBtn = document.querySelector('#edit-author-btn')
        if (editBtn) editBtn.style.display = 'block'
        
        // 从LeanCloud加载作者信息
        const UserProfile = AV.Object.extend('userProfile')
        const query = new AV.Query(UserProfile)
        query.equalTo('user', currentUser)
        const result = await query.first()
        
        if (result) {
            const avatar = document.querySelector('#author-avatar')
            const name = document.querySelector('#author-name')
            const bio = document.querySelector('#author-bio')
            const meta = document.querySelector('#author-meta')
            const location = document.querySelector('#author-location')
            const occupation = document.querySelector('#author-occupation')
            const github = document.querySelector('#author-github')
            const email = document.querySelector('#author-email')
            const website = document.querySelector('#author-website')
            const rss = document.querySelector('#author-rss')
            const twitter = document.querySelector('#author-twitter')
            
            if (avatar && result.get('avatar')) avatar.src = result.get('avatar')
            if (name && result.get('name')) name.textContent = result.get('name')
            if (bio && result.get('bio')) bio.textContent = result.get('bio')
            
            // 显示元信息
            if (meta) {
                if (result.get('location') || result.get('occupation')) {
                    meta.style.display = 'flex'
                    if (location && result.get('location')) {
                        location.innerHTML = `📍 ${result.get('location')}`
                    }
                    if (occupation && result.get('occupation')) {
                        occupation.innerHTML = `💼 ${result.get('occupation')}`
                    }
                }
            }
            
            // 显示链接图标
            if (github && result.get('github')) {
                github.href = result.get('github')
                github.style.display = 'flex'
            }
            if (email && result.get('email')) {
                email.href = 'mailto:' + result.get('email')
                email.style.display = 'flex'
            }
            if (website && result.get('website')) {
                website.href = result.get('website')
                website.style.display = 'flex'
            }
            if (rss && result.get('rss')) {
                rss.href = result.get('rss')
                rss.style.display = 'flex'
            }
            if (twitter && result.get('twitter')) {
                twitter.href = result.get('twitter')
                twitter.style.display = 'flex'
            }
        }
    } catch (error) {
        console.error('加载作者信息失败:', error)
    }
}

// 保存作者信息
async function saveAuthorInfo(data) {
    try {
        const currentUser = AV.User.current()
        if (!currentUser) {
            alert('请先登录')
            return
        }
        
        const UserProfile = AV.Object.extend('userProfile')
        let profile = null
        
        // 查找是否已存在
        const query = new AV.Query(UserProfile)
        query.equalTo('user', currentUser)
        profile = await query.first()
        
        if (!profile) {
            profile = new UserProfile()
            profile.set('user', currentUser)
        }
        
        if (data.avatar) profile.set('avatar', data.avatar)
        if (data.name) profile.set('name', data.name)
        if (data.bio) profile.set('bio', data.bio)
        if (data.location) profile.set('location', data.location)
        if (data.occupation) profile.set('occupation', data.occupation)
        if (data.github) profile.set('github', data.github)
        if (data.email) profile.set('email', data.email)
        if (data.website) profile.set('website', data.website)
        if (data.rss) profile.set('rss', data.rss)
        if (data.twitter) profile.set('twitter', data.twitter)
        
        const acl = new AV.ACL()
        acl.setPublicReadAccess(true)
        acl.setPublicWriteAccess(true)
        profile.setACL(acl)
        
        await profile.save()
        await loadAuthorInfo()
        alert('保存成功！')
    } catch (error) {
        console.error('保存作者信息失败:', error)
        alert('保存失败: ' + (error.message || '未知错误'))
    }
}

// 显示编辑作者信息弹窗
async function showEditAuthorModal() {
    const currentUser = AV.User.current()
    if (!currentUser) {
        alert('请先登录')
        return
    }
    
    // 先加载现有数据
    let existingData = {}
    try {
        const UserProfile = AV.Object.extend('userProfile')
        const query = new AV.Query(UserProfile)
        query.equalTo('user', currentUser)
        const result = await query.first()
        if (result) {
            existingData = {
                avatar: result.get('avatar') || document.querySelector('#author-avatar')?.src || '',
                name: result.get('name') || document.querySelector('#author-name')?.textContent || '',
                bio: result.get('bio') || document.querySelector('#author-bio')?.textContent || '',
                location: result.get('location') || '',
                occupation: result.get('occupation') || '',
                github: result.get('github') || document.querySelector('#author-github')?.href || '',
                email: result.get('email') || document.querySelector('#author-email')?.href?.replace('mailto:', '') || '',
                website: result.get('website') || document.querySelector('#author-website')?.href || '',
                rss: result.get('rss') || '',
                twitter: result.get('twitter') || ''
            }
        } else {
            existingData = {
                avatar: document.querySelector('#author-avatar')?.src || '',
                name: document.querySelector('#author-name')?.textContent || '',
                bio: document.querySelector('#author-bio')?.textContent || '',
                location: '',
                occupation: '',
                github: document.querySelector('#author-github')?.href || '',
                email: document.querySelector('#author-email')?.href?.replace('mailto:', '') || '',
                website: document.querySelector('#author-website')?.href || '',
                rss: '',
                twitter: ''
            }
        }
    } catch (error) {
        console.error('加载作者信息失败:', error)
        existingData = {
            avatar: document.querySelector('#author-avatar')?.src || '',
            name: document.querySelector('#author-name')?.textContent || '',
            bio: document.querySelector('#author-bio')?.textContent || '',
            location: '',
            occupation: '',
            github: '',
            email: '',
            website: '',
            rss: '',
            twitter: ''
        }
    }
    
    const modal = document.createElement('div')
    modal.className = 'add-important-day-modal-overlay'
    modal.style.display = 'flex'
    modal.innerHTML = `
        <div class="add-important-day-modal" style="max-width: 500px;">
            <h3>编辑作者信息</h3>
            <div class="modal-form">
                <label>头像URL：</label>
                <input type="text" id="edit-avatar" class="form-control" value="${existingData.avatar}" placeholder="图片URL">
                <label>姓名：</label>
                <input type="text" id="edit-name" class="form-control" value="${existingData.name}" placeholder="姓名">
                <label>简介：</label>
                <textarea id="edit-bio" class="form-control" rows="3" placeholder="简介">${existingData.bio}</textarea>
                <label>位置：</label>
                <input type="text" id="edit-location" class="form-control" value="${existingData.location}" placeholder="例如：北京">
                <label>职业：</label>
                <input type="text" id="edit-occupation" class="form-control" value="${existingData.occupation}" placeholder="例如：前端工程师">
                <label>GitHub：</label>
                <input type="text" id="edit-github" class="form-control" value="${existingData.github}" placeholder="GitHub链接">
                <label>Email：</label>
                <input type="email" id="edit-email" class="form-control" value="${existingData.email}" placeholder="Email">
                <label>Website：</label>
                <input type="text" id="edit-website" class="form-control" value="${existingData.website}" placeholder="Website链接">
                <label>RSS订阅：</label>
                <input type="text" id="edit-rss" class="form-control" value="${existingData.rss}" placeholder="RSS链接">
                <label>Twitter：</label>
                <input type="text" id="edit-twitter" class="form-control" value="${existingData.twitter}" placeholder="Twitter链接">
            </div>
            <div class="modal-buttons">
                <button id="save-author-btn" class="btn-add">保存</button>
                <button id="cancel-author-btn" class="btn" style="background: #ccc; margin-left: 10px;">取消</button>
            </div>
        </div>
    `
    document.body.appendChild(modal)
    
    // 保存按钮
    modal.querySelector('#save-author-btn').addEventListener('click', async () => {
        await saveAuthorInfo({
            avatar: modal.querySelector('#edit-avatar').value,
            name: modal.querySelector('#edit-name').value,
            bio: modal.querySelector('#edit-bio').value,
            location: modal.querySelector('#edit-location').value,
            occupation: modal.querySelector('#edit-occupation').value,
            github: modal.querySelector('#edit-github').value,
            email: modal.querySelector('#edit-email').value,
            website: modal.querySelector('#edit-website').value,
            rss: modal.querySelector('#edit-rss').value,
            twitter: modal.querySelector('#edit-twitter').value
        })
        document.body.removeChild(modal)
    })
    
    // 取消按钮
    modal.querySelector('#cancel-author-btn').addEventListener('click', () => {
        document.body.removeChild(modal)
    })
    
    // 点击遮罩关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal)
        }
    })
}

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (initBlogElements()) {
            setupBlogEventListeners();
            setTimeout(initBlogMarkdownEditor, 100);
            load();
            loadAuthorInfo();
            
            // 绑定编辑按钮
            document.querySelector('#edit-author-btn')?.addEventListener('click', () => {
                if (typeof requireLogin === 'function' && !requireLogin()) return
                showEditAuthorModal()
            })
        } else {
            console.error('博客页面元素初始化失败');
        }
    });
} else {
    if (initBlogElements()) {
        setupBlogEventListeners();
        setTimeout(initBlogMarkdownEditor, 100);
        load();
        
        // 绑定添加便签按钮（使用事件委托，确保按钮存在）
        setTimeout(() => {
            const newNoteBtn = document.querySelector('#new-note')
            if (newNoteBtn) {
                // 移除旧的事件监听器
                const newBtn = newNoteBtn.cloneNode(true)
                newNoteBtn.parentNode.replaceChild(newBtn, newNoteBtn)
                
                newBtn.addEventListener('click', function(e) {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('点击添加便签按钮')
                    if (typeof requireLogin === 'function' && !requireLogin()) return
                    showAddNoteModal()
                })
                console.log('便签按钮事件已绑定')
            } else {
                console.error('new-note按钮未找到')
            }
        }, 100)
        
        // 加载便签
        loadNotes()
    } else {
        console.error('博客页面元素初始化失败');
    }
}

// 便签功能
async function loadNotes() {
    try {
        const notesList = document.querySelector('#blog-notes-list')
        if (!notesList) return
        
        const currentUser = AV.User.current()
        if (!currentUser) {
            notesList.innerHTML = '<div style="color: var(--muted); font-size: 12px; padding: 10px;">请先登录</div>'
            return
        }
        
        // 尝试查询note类，如果不存在则静默处理
        try {
            const Note = AV.Object.extend('note')
            const query = new AV.Query(Note)
            query.equalTo('user', currentUser)
            query.descending('createdAt')
            const results = await query.find()
            
            if (results.length === 0) {
                notesList.innerHTML = '<div style="color: var(--muted); font-size: 12px; padding: 10px;">暂无便签</div>'
                return
            }
            
            notesList.innerHTML = results.map(note => {
                const id = note.id
                const content = note.get('content') || ''
                const color = note.get('color') || '#fff9c4'
                const createdAt = note.get('createdAt')
                const dateStr = createdAt ? new Date(createdAt).toLocaleDateString('zh-CN') : ''
                
                return `
                    <div class="note-item" data-id="${id}" style="background: ${color}; border-radius: 8px; padding: 8px; margin-bottom: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); cursor: pointer; position: relative; min-height: 50px;">
                        <div style="font-size: 11px; color: #666; margin-bottom: 4px;">${dateStr}</div>
                        <div style="font-size: 12px; line-height: 1.4; word-break: break-word;">${escapeHtml(content)}</div>
                        <button class="note-delete-btn" data-id="${id}" style="position: absolute; top: 5px; right: 5px; background: rgba(255, 77, 77, 0.8); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; cursor: pointer; font-size: 11px; line-height: 1; display: none; align-items: center; justify-content: center;">×</button>
                    </div>
                `
            }).join('')
            
            // 绑定删除和编辑事件
            notesList.querySelectorAll('.note-item').forEach(item => {
                const deleteBtn = item.querySelector('.note-delete-btn')
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', async (e) => {
                        e.stopPropagation()
                        if (confirm('确定要删除这个便签吗？')) {
                            await deleteNote(item.dataset.id)
                        }
                    })
                    
                    item.addEventListener('mouseenter', () => {
                        deleteBtn.style.display = 'flex'
                    })
                    item.addEventListener('mouseleave', () => {
                        deleteBtn.style.display = 'none'
                    })
                }
                
                item.addEventListener('click', function(e) {
                    if (e.target.classList.contains('note-delete-btn')) return
                    editNote(this.dataset.id)
                })
            })
        } catch (queryError) {
            // 如果note类不存在，静默处理，显示空状态
            if (queryError.code === 101 || queryError.message && queryError.message.includes("doesn't exists")) {
                notesList.innerHTML = '<div style="color: var(--muted); font-size: 12px; padding: 10px;">暂无便签</div>'
            } else {
                throw queryError
            }
        }
    } catch (error) {
        console.error('加载便签失败:', error)
        const notesList = document.querySelector('#blog-notes-list')
        if (notesList) {
            // 如果是类不存在的错误，静默处理
            if (error.code === 101 || (error.message && error.message.includes("doesn't exists"))) {
                notesList.innerHTML = '<div style="color: var(--muted); font-size: 12px; padding: 10px;">暂无便签</div>'
            } else {
                notesList.innerHTML = '<div style="color: #ff6b6b; font-size: 12px; padding: 10px;">加载失败</div>'
            }
        }
    }
}

function showAddNoteModal() {
    const modal = document.createElement('div')
    modal.className = 'add-important-day-modal-overlay'
    modal.style.display = 'flex'
    modal.innerHTML = `
        <div class="add-important-day-modal" style="max-width: 400px;">
            <h3>添加便签</h3>
            <div class="modal-form">
                <label>便签内容：</label>
                <textarea id="note-content-input" class="form-control" rows="6" placeholder="输入便签内容..."></textarea>
                <label>便签颜色：</label>
                <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                    <div class="note-color-option" data-color="#fff9c4" style="width: 30px; height: 30px; border-radius: 4px; background: #fff9c4; border: 2px solid #ddd; cursor: pointer;"></div>
                    <div class="note-color-option" data-color="#c5e1a5" style="width: 30px; height: 30px; border-radius: 4px; background: #c5e1a5; border: 2px solid #ddd; cursor: pointer;"></div>
                    <div class="note-color-option" data-color="#b3e5fc" style="width: 30px; height: 30px; border-radius: 4px; background: #b3e5fc; border: 2px solid #ddd; cursor: pointer;"></div>
                    <div class="note-color-option" data-color="#f8bbd0" style="width: 30px; height: 30px; border-radius: 4px; background: #f8bbd0; border: 2px solid #ddd; cursor: pointer;"></div>
                    <div class="note-color-option" data-color="#d1c4e9" style="width: 30px; height: 30px; border-radius: 4px; background: #d1c4e9; border: 2px solid #ddd; cursor: pointer;"></div>
                </div>
            </div>
            <div class="modal-buttons">
                <button id="save-note-btn" class="btn-add">保存</button>
                <button id="cancel-note-btn" class="btn" style="background: #ccc; margin-left: 10px;">取消</button>
            </div>
        </div>
    `
    document.body.appendChild(modal)
    
    let selectedColor = '#fff9c4'
    
    // 颜色选择
    modal.querySelectorAll('.note-color-option').forEach(option => {
        option.addEventListener('click', function() {
            modal.querySelectorAll('.note-color-option').forEach(opt => {
                opt.style.border = '2px solid #ddd'
            })
            this.style.border = '2px solid #4a90e2'
            selectedColor = this.dataset.color
        })
    })
    modal.querySelector('.note-color-option').style.border = '2px solid #4a90e2'
    
    // 保存
    modal.querySelector('#save-note-btn').addEventListener('click', async () => {
        const content = modal.querySelector('#note-content-input').value.trim()
        if (!content) {
            alert('请输入便签内容')
            return
        }
        try {
            await saveNote({ content, color: selectedColor })
            document.body.removeChild(modal)
            await loadNotes()
        } catch (error) {
            console.error('保存便签失败:', error)
            alert('保存失败: ' + (error.message || '未知错误'))
        }
    })
    
    // 取消
    modal.querySelector('#cancel-note-btn').addEventListener('click', () => {
        document.body.removeChild(modal)
    })
    
    // 点击遮罩关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal)
        }
    })
}

async function editNote(id) {
    try {
        let note
        try {
            note = AV.Object.createWithoutData('note', id)
            await note.fetch()
        } catch (fetchError) {
            if (fetchError.code === 101 || (fetchError.message && fetchError.message.includes("doesn't exists"))) {
                alert('便签功能需要先在LeanCloud创建note类。请先在LeanCloud控制台创建note类。')
                return
            }
            throw fetchError
        }
        
        const modal = document.createElement('div')
        modal.className = 'add-important-day-modal-overlay'
        modal.style.display = 'flex'
        modal.innerHTML = `
            <div class="add-important-day-modal" style="max-width: 400px;">
                <h3>编辑便签</h3>
                <div class="modal-form">
                    <label>便签内容：</label>
                    <textarea id="note-content-input" class="form-control" rows="6" placeholder="输入便签内容...">${escapeHtml(note.get('content') || '')}</textarea>
                    <label>便签颜色：</label>
                    <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                        <div class="note-color-option" data-color="#fff9c4" style="width: 30px; height: 30px; border-radius: 4px; background: #fff9c4; border: 2px solid #ddd; cursor: pointer;"></div>
                        <div class="note-color-option" data-color="#c5e1a5" style="width: 30px; height: 30px; border-radius: 4px; background: #c5e1a5; border: 2px solid #ddd; cursor: pointer;"></div>
                        <div class="note-color-option" data-color="#b3e5fc" style="width: 30px; height: 30px; border-radius: 4px; background: #b3e5fc; border: 2px solid #ddd; cursor: pointer;"></div>
                        <div class="note-color-option" data-color="#f8bbd0" style="width: 30px; height: 30px; border-radius: 4px; background: #f8bbd0; border: 2px solid #ddd; cursor: pointer;"></div>
                        <div class="note-color-option" data-color="#d1c4e9" style="width: 30px; height: 30px; border-radius: 4px; background: #d1c4e9; border: 2px solid #ddd; cursor: pointer;"></div>
                    </div>
                </div>
                <div class="modal-buttons">
                    <button id="save-note-btn" class="btn-add">保存</button>
                    <button id="cancel-note-btn" class="btn" style="background: #ccc; margin-left: 10px;">取消</button>
                </div>
            </div>
        `
        document.body.appendChild(modal)
        
        let selectedColor = note.get('color') || '#fff9c4'
        
        // 颜色选择
        modal.querySelectorAll('.note-color-option').forEach(option => {
            if (option.dataset.color === selectedColor) {
                option.style.border = '2px solid #4a90e2'
            }
            option.addEventListener('click', function() {
                modal.querySelectorAll('.note-color-option').forEach(opt => {
                    opt.style.border = '2px solid #ddd'
                })
                this.style.border = '2px solid #4a90e2'
                selectedColor = this.dataset.color
            })
        })
        
        // 保存
        modal.querySelector('#save-note-btn').addEventListener('click', async () => {
            const content = modal.querySelector('#note-content-input').value.trim()
            if (!content) {
                alert('请输入便签内容')
                return
            }
            try {
                await saveNote({ id, content, color: selectedColor })
                document.body.removeChild(modal)
                await loadNotes()
            } catch (error) {
                console.error('保存便签失败:', error)
                alert('保存失败: ' + (error.message || '未知错误'))
            }
        })
        
        // 取消
        modal.querySelector('#cancel-note-btn').addEventListener('click', () => {
            document.body.removeChild(modal)
        })
        
        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal)
            }
        })
    } catch (error) {
        console.error('加载便签失败:', error)
        alert('加载失败: ' + (error.message || '未知错误'))
    }
}

async function saveNote(data) {
    try {
        const currentUser = AV.User.current()
        if (!currentUser) {
            throw new Error('请先登录')
        }
        
        const Note = AV.Object.extend('note')
        let note
        
        if (data.id) {
            // 更新
            note = AV.Object.createWithoutData('note', data.id)
        } else {
            // 新建
            note = new Note()
        }
        
        note.set('user', currentUser)
        note.set('content', data.content)
        note.set('color', data.color || '#fff9c4')
        
        const acl = new AV.ACL()
        acl.setPublicReadAccess(true)
        acl.setPublicWriteAccess(true)
        note.setACL(acl)
        
        await note.save()
        await loadNotes()
        return note
    } catch (error) {
        console.error('保存便签失败:', error)
        // 如果是类不存在的错误，提示用户
        if (error.code === 101 || (error.message && error.message.includes("doesn't exists"))) {
            alert('便签功能需要先在LeanCloud创建note类。请先在LeanCloud控制台创建note类。')
        }
        throw error
    }
}

async function deleteNote(id) {
    try {
        const note = AV.Object.createWithoutData('note', id)
        await note.destroy()
        await loadNotes()
    } catch (error) {
        console.error('删除便签失败:', error)
        // 如果是类不存在的错误，静默处理
        if (error.code === 101 || (error.message && error.message.includes("doesn't exists"))) {
            await loadNotes() // 重新加载，会显示空状态
        } else {
            alert('删除失败: ' + (error.message || '未知错误'))
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
}
