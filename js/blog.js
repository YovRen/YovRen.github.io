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
    const queryAll = new AV.Query('blog');
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
            
            if (fullContent.style.display === 'none') {
                // 显示完整内容
                const contentHtml = fullContent.getAttribute('data-content')
                summary.style.display = 'none'
                fullContent.style.display = 'block'
                fullContent.innerHTML = contentHtml
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

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (initBlogElements()) {
            setupBlogEventListeners();
            setTimeout(initBlogMarkdownEditor, 100);
            load();
        } else {
            console.error('博客页面元素初始化失败');
        }
    });
} else {
    if (initBlogElements()) {
        setupBlogEventListeners();
        setTimeout(initBlogMarkdownEditor, 100);
        load();
    } else {
        console.error('博客页面元素初始化失败');
    }
}
