const { Query, User } = AV;

AV.init({
    appId: "szRqJxj4rGr47DBsfiYqh9qA-gzGzoHsz",
    appKey: "UCGehmC6gOKYHSKpoMLeaRFJ",
    serverURL: "https://szrqjxj4.lc-cn-n1-shared.com"
});

const blogTitle = document.querySelector("#blog-title")
const blogContent = document.querySelector("#blog-content")
const blogTags = document.querySelector("#blog-tags")
const blogSubmit = document.querySelector("#blog-submit")
const blogCancel = document.querySelector("#blog-cancel")
const blogOverlay = document.querySelector("#blog-overlay")
const newBlogBtn = document.querySelector("#new-blog")
const blogList = document.querySelector("#blog-list")
const searchInput = document.querySelector("#search-blog")
const blogEditingId = document.querySelector("#blog-editing-id")

let allBlogs = []

load()

if (newBlogBtn) {
    newBlogBtn.addEventListener("click", () => {
        blogOverlay.hidden = false
        blogEditingId.value = ''
        blogTitle.value = ''
        blogContent.value = ''
        blogTags.value = ''
    })
}

if (blogCancel) {
    blogCancel.addEventListener("click", () => {
        blogOverlay.hidden = true
        blogEditingId.value = ''
        blogTitle.value = ''
        blogContent.value = ''
        blogTags.value = ''
    })
}

if (blogOverlay) {
    blogOverlay.addEventListener("click", (e) => {
        if (e.target === blogOverlay) {
            blogOverlay.hidden = true
            blogEditingId.value = ''
            blogTitle.value = ''
            blogContent.value = ''
            blogTags.value = ''
        }
    })
}

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

blogSubmit.addEventListener("click", async event => {
    if (blogTitle.value && blogContent.value) {
        if (blogEditingId.value) {
            await updateBlog(blogEditingId.value, {
                title: blogTitle.value,
                content: blogContent.value,
                tags: blogTags.value
            })
        } else {
            saveBlog({
                title: blogTitle.value,
                content: blogContent.value,
                tags: blogTags.value
            })
        }
        blogTitle.value = ''
        blogContent.value = ''
        blogTags.value = ''
        blogEditingId.value = ''
        blogOverlay.hidden = true
        await load()
    } else {
        alert('请填写标题和内容')
    }
})

async function getBlogs() {
    let data = []
    const queryAll = new AV.Query('Blog');
    queryAll.descending('createdAt');
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
    blogList.innerHTML = ''

    if (blogs.length === 0) {
        blogList.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">还没有博客，开始写第一篇吧！</div>'
        return
    }

    blogs.forEach(blog => {
        const blogCard = document.createElement("div")
        blogCard.className = "blog-card"

        const tags = blog.attributes.tags ? blog.attributes.tags.split(',').map(t => t.trim()).filter(t => t) : []
        const tagsHtml = tags.length > 0
            ? '<div class="blog-tags">' + tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('') + '</div>'
            : ''

        const contentPreview = (blog.attributes.content || '').substring(0, 200) + ((blog.attributes.content || '').length > 200 ? '...' : '')

        blogCard.innerHTML = `
            <div class="blog-card-header">
                <h3>${blog.attributes.title || '无标题'}</h3>
                <div class="blog-actions">
                    <button class="edit-blog-btn" data-id="${blog.id}">编辑</button>
                    <button class="delete-blog-btn" data-id="${blog.id}">删除</button>
                </div>
            </div>
            ${tagsHtml}
            <div class="blog-card-content">${contentPreview.replace(/\n/g, '<br>')}</div>
            <div class="blog-card-footer">
                <span class="blog-time">📅 ${blog.attributes.time || ''}</span>
                <span class="blog-author">👤 ${blog.attributes.author || ''}</span>
            </div>
        `

        blogList.appendChild(blogCard)
    })

    // 绑定编辑和删除按钮
    document.querySelectorAll('.edit-blog-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.getAttribute('data-id')
            const blog = allBlogs.find(b => b.id === id)
            if (blog) {
                blogEditingId.value = id
                blogTitle.value = blog.attributes.title || ''
                blogContent.value = blog.attributes.content || ''
                blogTags.value = blog.attributes.tags || ''
                blogOverlay.hidden = false
            }
        })
    })

    document.querySelectorAll('.delete-blog-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.getAttribute('data-id')
            await deleteBlog(id)
        })
    })
}

function updateBlogStats(blogs) {
    const totalCount = blogs.length
    let totalWords = 0

    blogs.forEach(blog => {
        totalWords += (blog.attributes.content || '').length
    })

    document.querySelector("#blog-total-count").textContent = totalCount
    document.querySelector("#blog-total-words").textContent = totalWords
}
