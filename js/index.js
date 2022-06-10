const {Query, User} = AV;
AV.init({
    appId: "szRqJxj4rGr47DBsfiYqh9qA-gzGzoHsz",
    appKey: "UCGehmC6gOKYHSKpoMLeaRFJ",
    serverURL: "https://szrqjxj4.lc-cn-n1-shared.com"
});

const sear = document.querySelector("#sear")
const dothings = document.querySelector(".dothings")
const donethings = document.querySelector(".donethings")
const donumber = document.querySelector(".donumber")
const donenumber = document.querySelector(".donenumber")
load()
//给搜索框添加键盘事件 如果敲击了回车键 并且搜索框里有东西 那么就储存到key：todolist 里
sear.addEventListener("keydown", async event => {
    if (event.keyCode === 13) {
        if (sear.value !== '') {
            saveData({title: sear.value, done: false})
            sear.value = ''
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
    todo.save()
}


async function load() {

    dothings.innerHTML = ''
    donethings.innerHTML = ''
    let docount = 0
    let donecount = 0
    let datas = await getData()
    for (let i = 0; i < datas.length; i++) {
        if (datas[i].attributes.done) {
            let lis = document.createElement("li")
            lis.innerHTML = "<span class='front'></span><input type='checkbox' checked='checked' class='rightbox'  id=" + datas[i].id + "><p class='word' id=" + datas[i].id + ">" + datas[i].attributes.title + "</p><span class='close' id=" + datas[i].id + "></span>"
            donethings.appendChild(lis)
            donecount++

        } else {
            let lis = document.createElement("li")
            lis.innerHTML = "<span class='front'></span><input type='checkbox' id=" + datas[i].id + " class='rightbox'><p class='word' id=" + datas[i].id + ">" + datas[i].attributes.title + "</p><span class='close' id=" + datas[i].id + " ></span>"
            dothings.appendChild(lis)
            docount++
        }
    }

    let closes = document.querySelectorAll(".close")
    for (let i = 0; i < closes.length; i++) {
        closes[i].addEventListener("click", async function () {
            const todo = AV.Object.createWithoutData('Todolist', this.id);
            await todo.destroy()
            console.log("deltet")
            await load()
        })
    }

    let inputs = document.querySelectorAll(".rightbox")
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener("click", async function () {
            console.log(inputs[i].id)
            const todo = AV.Object.createWithoutData('Todolist', this.id);
            todo.set('done', inputs[i].checked)
            await todo.save()
            console.log("checked")
            await load()
        })
    }

    //修改任务数量
    donumber.innerHTML = docount
    donenumber.innerHTML = donecount
}