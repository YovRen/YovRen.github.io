const { Query, User } = AV;
AV.init({
    appId: "szRqJxj4rGr47DBsfiYqh9qA-gzGzoHsz",
    appKey: "UCGehmC6gOKYHSKpoMLeaRFJ",
    serverURL: "https://szrqjxj4.lc-cn-n1-shared.com"
});

const sear = document.querySelector("#sear")
const priority = document.querySelector("#priority")
const deadline = document.querySelector("#deadline")
const dothings = document.querySelector(".dothings")
const donethings = document.querySelector(".donethings")
const donumber = document.querySelector(".donumber")
const donenumber = document.querySelector(".donenumber")

load()

sear.addEventListener("keydown", async event => {
    if (event.keyCode === 13) {
        if (sear.value !== '') {
            saveData({
                title: sear.value,
                done: false,
                priority: priority.value,
                deadline: deadline.value || null
            })
            sear.value = ''
            deadline.value = ''
            priority.value = 'medium'
            await load()
        }
    }
})

async function getData() {
    let data = []
    const queryAll = new AV.Query('Todolist');
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
    todo.set('done', data.done);
    todo.set('priority', data.priority || 'medium');
    if (data.deadline) {
        todo.set('deadline', data.deadline);
    }
    todo.save()
}


function getPriorityBadge(priority) {
    const badges = {
        'high': '<span style="color: red; font-weight: bold;">🔴 高</span>',
        'medium': '<span style="color: orange; font-weight: bold;">🟡 中</span>',
        'low': '<span style="color: green; font-weight: bold;">🟢 低</span>'
    }
    return badges[priority] || badges['medium']
}

function getDeadlineInfo(deadline) {
    if (!deadline) return ''
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
        return '<span style="color: red;">⚠️ 已过期 ' + Math.abs(diffDays) + ' 天</span>'
    } else if (diffDays === 0) {
        return '<span style="color: red;">⚠️ 今天截止</span>'
    } else if (diffDays <= 3) {
        return '<span style="color: orange;">⏰ 还有 ' + diffDays + ' 天</span>'
    } else {
        return '<span style="color: #666;">📅 ' + deadline + '</span>'
    }
}

async function load() {
    dothings.innerHTML = ''
    donethings.innerHTML = ''
    let docount = 0
    let donecount = 0
    let datas = await getData()

    // 按优先级和截止日期排序
    datas.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 }
        const aPriority = priorityOrder[a.attributes.priority] || 2
        const bPriority = priorityOrder[b.attributes.priority] || 2
        if (aPriority !== bPriority) {
            return bPriority - aPriority
        }
        if (a.attributes.deadline && b.attributes.deadline) {
            return new Date(a.attributes.deadline) - new Date(b.attributes.deadline)
        }
        if (a.attributes.deadline) return -1
        if (b.attributes.deadline) return 1
        return 0
    })

    for (let i = 0; i < datas.length; i++) {
        const priority = datas[i].attributes.priority || 'medium'
        const deadline = datas[i].attributes.deadline
        const priorityBadge = getPriorityBadge(priority)
        const deadlineInfo = getDeadlineInfo(deadline)

        if (datas[i].attributes.done) {
            let lis = document.createElement("li")
<<<<<<< HEAD
            lis.innerHTML = "<span class='front'></span><input type='checkbox' checked='checked' class='rightbox'  id=" + datas[i].id + "><p class='word' id=" + datas[i].id + ">" + datas[i].attributes.title + " <span style='margin-left:8px;'>" + priorityBadge + "</span></p><span class='close' id=" + datas[i].id + "></span>"
=======
            lis.innerHTML = "<span class='front'></span><input type='checkbox' checked='checked' class='rightbox'  id=" + datas[i].id + "><p class='word' id=" + datas[i].id + ">" + datas[i].attributes.title + " " + priorityBadge + "</p><span class='close' id=" + datas[i].id + "></span>"
>>>>>>> e9ea9ed4479df0727cbfae2a8b81327a8bbae34e
            donethings.appendChild(lis)
            donecount++
        } else {
            let lis = document.createElement("li")
<<<<<<< HEAD
            lis.innerHTML = "<span class='front'></span><input type='checkbox' id=" + datas[i].id + " class='rightbox'><p class='word' id=" + datas[i].id + ">" + datas[i].attributes.title + " <span style='margin-left:8px;'>" + priorityBadge + "</span>" + (deadlineInfo ? " <span style='margin-left:8px;'>" + deadlineInfo + "</span>" : "") + "</p><span class='close' id=" + datas[i].id + " ></span>"
=======
            lis.innerHTML = "<span class='front'></span><input type='checkbox' id=" + datas[i].id + " class='rightbox'><p class='word' id=" + datas[i].id + ">" + datas[i].attributes.title + " " + priorityBadge + (deadlineInfo ? " " + deadlineInfo : "") + "</p><span class='close' id=" + datas[i].id + " ></span>"
>>>>>>> e9ea9ed4479df0727cbfae2a8b81327a8bbae34e
            dothings.appendChild(lis)
            docount++
        }
    }

    let closes = document.querySelectorAll(".close")
    for (let i = 0; i < closes.length; i++) {
        closes[i].addEventListener("click", async function () {
            const todo = AV.Object.createWithoutData('Todolist', this.id);
            await todo.destroy()
            await load()
        })
    }

    let inputs = document.querySelectorAll(".rightbox")
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener("click", async function () {
            const todo = AV.Object.createWithoutData('Todolist', this.id);
            todo.set('done', inputs[i].checked)
            await todo.save()
            await load()
        })
    }

    donumber.innerHTML = docount
    donenumber.innerHTML = donecount
}