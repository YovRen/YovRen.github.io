// AV.init 已在 HTML 中初始化，这里不再重复初始化
// 直接使用 AV.Query 和 AV.User，不声明常量避免重复声明错误

let blogTitle, blogContent, blogTags, blogSubmit, blogCancel, blogOverlay;
let newBlogBtn, blogList, searchInput, blogEditingId;
let allBlogs = []
let blogContentEditor = null

function initBlogElements() {
    blogTitle = document.querySelector("#blog-title")
    blogContent = document.querySelector("#blog-content")
    blogTags = document.querySelector("#blog-tags")
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
                renderBlogs(allBlogs)
            } else {
                const filtered = allBlogs.filter(blog => {
                    const title = blog.attributes.title || ''
                    const content = blog.attributes.content || ''
                    const tags = blog.attributes.tags || ''
                    return title.toLowerCase().includes(keyword) ||
                        content.toLowerCase().includes(keyword) ||
                        tags.toLowerCase().includes(keyword)
                })
                renderBlogs(filtered)
            }
        })
    }

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
                        tags: blogTags ? blogTags.value : ''
                    })
                } else {
                    // 新建模式
                    saveBlog({
                        title: blogTitle ? blogTitle.value : '',
                        content: contentValue,
                        tags: blogTags ? blogTags.value : ''
                    })
                }
                if (blogTitle) blogTitle.value = ''
                if (blogContentEditor) {
                    blogContentEditor.value('')
                } else if (blogContent) {
                    blogContent.value = ''
                }
                if (blogTags) blogTags.value = ''
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
    const queryAll = new AV.Query('Blog');
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
    const Blog = AV.Object.extend('Blog');
    const blog = new Blog();
    blog.set('title', data.title);
    blog.set('content', data.content);
    blog.set('tags', data.tags || '');
    blog.set('time', time());
    blog.set('author', returnCitySN['cname'][0] === "天" ? "小燃" : "梦竹");
    blog.save();
}

async function updateBlog(id, data) {
    const blog = AV.Object.createWithoutData('Blog', id);
    blog.set('title', data.title);
    blog.set('content', data.content);
    blog.set('tags', data.tags || '');
    await blog.save();
}

async function deleteBlog(id) {
    if (typeof requireLogin === 'function' && !requireLogin()) {
        return;
    }
    if (confirm('确定要删除这篇博客吗？')) {
        const blog = AV.Object.createWithoutData('Blog', id);
        await blog.destroy();
        await load();
    }
}

async function load() {
    allBlogs = await getBlogs()
    renderBlogs(allBlogs)
    updateBlogStats(allBlogs)
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
    const contentHtml = typeof marked !== 'undefined' ? marked.parse(contentText) : contentText.replace(/\n/g, '<br>')
    const time = blog.attributes.time || ''
    const tags = blog.attributes.tags || ''
    const tagArray = tags.split(',').filter(t => t.trim())

    const card = document.createElement("div")
    card.className = "blog-card"
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
        <div class="blog-card-content">
            ${contentHtml}
        </div>
        ${tagArray.length > 0 ? `
            <div class="blog-tags">
                ${tagArray.map(tag => `<span class="blog-tag">${tag.trim()}</span>`).join('')}
            </div>
        ` : ''}
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
                if (blogContentEditor) {
                    blogContentEditor.value(blog.attributes.content || '')
                } else if (blogContent) {
                    blogContent.value = blog.attributes.content || ''
                }
                if (blogTags) blogTags.value = blog.attributes.tags || ''
                if (blogOverlay) blogOverlay.hidden = false
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
}

function updateBlogStats(blogs) {
    const totalCount = blogs.length
    let totalWords = 0
    const dates = new Set()

    blogs.forEach(blog => {
        totalWords += (blog.attributes.content || '').length
        if (blog.attributes.time) {
            dates.add(blog.attributes.time.split(" ")[0])
        }
    })

    const totalCountEl = document.querySelector("#blog-total-count")
    const totalWordsEl = document.querySelector("#blog-total-words")
    const totalDaysEl = document.querySelector("#blog-total-days")
    if (totalCountEl) totalCountEl.textContent = totalCount
    if (totalWordsEl) totalWordsEl.textContent = totalWords
    if (totalDaysEl) totalDaysEl.textContent = dates.size
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
