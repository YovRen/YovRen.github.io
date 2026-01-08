const { Query, User } = AV;

AV.init({
    appId: "szRqJxj4rGr47DBsfiYqh9qA-gzGzoHsz",
    appKey: "UCGehmC6gOKYHSKpoMLeaRFJ",
    serverURL: "https://szrqjxj4.lc-cn-n1-shared.com"
});

const title = document.querySelector("#title")
const content = document.querySelector("#content")
const submit = document.querySelector("#submit")
const write = document.querySelector("#write")
const image = document.querySelector("#image")
const timeline = document.querySelector(".timeline")
const searchInput = document.querySelector("#search-diary")
const newDiaryBtn = document.querySelector("#new-diary")
const cancelEditBtn = document.querySelector("#cancel-edit")
const editingId = document.querySelector("#editing-id")
const moodSelect = document.querySelector("#mood")

let allDiaries = []
let file;

load()

<<<<<<< HEAD
const writeOverlay = document.querySelector("#write-overlay")

// 显示/隐藏写日记表单
if (newDiaryBtn) {
    newDiaryBtn.addEventListener("click", () => {
        writeOverlay.hidden = false
=======
// 显示/隐藏写日记表单
if (newDiaryBtn) {
    newDiaryBtn.addEventListener("click", () => {
        write.hidden = false
        newDiaryBtn.style.display = 'none'
>>>>>>> e9ea9ed4479df0727cbfae2a8b81327a8bbae34e
        editingId.value = ''
        title.value = ''
        content.value = ''
        moodSelect.value = '😊'
        file = null
        if (document.querySelector("#preview")) {
            document.querySelector("#preview").src = ''
        }
    })
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
<<<<<<< HEAD
        writeOverlay.hidden = true
=======
        write.hidden = true
        newDiaryBtn.style.display = 'block'
>>>>>>> e9ea9ed4479df0727cbfae2a8b81327a8bbae34e
        editingId.value = ''
        title.value = ''
        content.value = ''
        file = null
    })
}

<<<<<<< HEAD
// 点击遮罩层关闭表单
if (writeOverlay) {
    writeOverlay.addEventListener("click", (e) => {
        if (e.target === writeOverlay) {
            writeOverlay.hidden = true
            editingId.value = ''
            title.value = ''
            content.value = ''
            file = null
        }
    })
}

=======
>>>>>>> e9ea9ed4479df0727cbfae2a8b81327a8bbae34e
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

$('#image').on('change', async function () {
    const localFile = this.files[0];
    if (localFile) {
        file = new AV.File($(this).val(), localFile);
    }
});

submit.addEventListener("click", async event => {
    if (content.value !== '') {
        if (editingId.value) {
            // 编辑模式
            await updateData(editingId.value, {
                title: title.value,
                content: content.value,
                mood: moodSelect.value
            })
        } else {
            // 新建模式
            saveData({
                title: title.value,
                content: content.value,
                mood: moodSelect.value
            })
        }
        title.value = ''
        content.value = ''
        editingId.value = ''
<<<<<<< HEAD
        writeOverlay.hidden = true
=======
        write.hidden = true
        if (newDiaryBtn) newDiaryBtn.style.display = 'block'
>>>>>>> e9ea9ed4479df0727cbfae2a8b81327a8bbae34e
        file = null
        await load()
    }
})

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
        url: "http://wthrcdn.etouch.cn/weather_mini",
        type: "GET",
        dataType: 'json',
        data: { city: (returnCitySN['cname']) },
        async: false,
        success: function (res) {
            var maxTemperature = res.data.forecast[0].high;//最高温度
            var minTemperature = res.data.forecast[0].low;//最低温度
            var weather = minTemperature.split(' ')[1] + '~' + maxTemperature.split(' ')[1];
            var type = res.data.forecast[0].type;//天气状态
            ret = weather + ' ' + type;
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
        let avatar = 'img/users/avatar-1.jpg'
        if (datas[i].attributes.author === "小燃") {
            avatar = 'img/users/xiaoran.png';
        } else if (datas[i].attributes.author === "梦竹") {
            avatar = 'img/users/mengzhu.png';
        }

        const mood = datas[i].attributes.mood || '😊'
        const diaryId = datas[i].id

        let lis = document.createElement("li")
        let imageHtml = datas[i].attributes.image
            ? "<img src='" + datas[i].attributes.image.attributes.url + "' style='max-width:100%; margin-top:10px;'></img>"
            : ""

        lis.innerHTML =
            "<img class=\"tl-circ\" src=" + avatar + "></img>\n" +
            "<div class=\"timeline-panel\">\n" +
            "<div class=\"tl-heading\">\n" +
            "<h4>" + mood + " " + (datas[i].attributes.title || '无标题') +
            " <button class='edit-btn' data-id='" + diaryId + "' style='font-size:12px; padding:2px 5px;'>编辑</button>" +
            " <button class='delete-btn' data-id='" + diaryId + "' style='font-size:12px; padding:2px 5px;'>删除</button>" +
            "</h4>\n" +
            "</div>\n" +
            "<div class=\"tl-body\">\n" +
            "<span style='font-size:19px'>" + datas[i].attributes.content[0] + "</span>" + datas[i].attributes.content.substr(1) +
            "</div>" +
            imageHtml +
            "<div class=\"small text-muted\">\n" +
            "<i class=\"glyphicon glyphicon-globe\"></i> [" + datas[i].attributes.city + "] • " + datas[i].attributes.weather +
            "</div>\n" +
            "</div>";

        timeline.appendChild(lis);
    }

    // 绑定编辑和删除按钮
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.getAttribute('data-id')
            const diary = allDiaries.find(d => d.id === id)
            if (diary) {
                editingId.value = id
                title.value = diary.attributes.title || ''
                content.value = diary.attributes.content || ''
                moodSelect.value = diary.attributes.mood || '😊'
<<<<<<< HEAD
                writeOverlay.hidden = false
                if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block'
=======
                write.hidden = false
                if (newDiaryBtn) newDiaryBtn.style.display = 'none'
                if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block'
                write.scrollIntoView({ behavior: 'smooth' })
>>>>>>> e9ea9ed4479df0727cbfae2a8b81327a8bbae34e
            }
        })
    })

    document.querySelectorAll('.delete-btn').forEach(btn => {
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

    document.querySelector("#total-count").textContent = totalCount
    document.querySelector("#total-words").textContent = totalWords
    document.querySelector("#total-days").textContent = dates.size
}