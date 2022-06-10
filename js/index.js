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
sear.addEventListener("keydown", event => {
    if (event.keyCode === 13) {
        if (sear.value !== '') {
            saveData({title: sear.value, done: false})
            sear.value = ''
            load()
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
    todo.save().then((todo) => {
        console.log(`保存成功。objectId：${todo.id}`);
    }, (error) => {
        console.log(`保存失败。objectId：${todo.id}`);
    });
}


async function load() {
    //渲染页面 因为添加了之后 ul里会一直有li 所以每次再渲染页面的时候 要清空li
    dothings.innerHTML = ''
    donethings.innerHTML = ''
    //每次也都要把任务数量设为0 不然每次叠加
    let docount = 0
    let donecount = 0
    //获取本地储存里的内容 现在是对象形式
    let datas = await getData()
    console.log(datas)
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
            load()
        })
    }

    //点击之后checked变成checked 保存数据 再渲染页面 修改任务出现的位置
    let inputs = document.querySelectorAll(".rightbox")
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener("click", async function () {
            console.log(inputs[i].id)
            const todo = AV.Object.createWithoutData('Todolist', inputs[i].id);
            await todo.set('done', inputs[i].checked)
            todo.save()
            load()
        })
    }

    //获取p标签
    let ps = document.querySelectorAll(".word")
    for (let i = 0; i < ps.length; i++) {
        //把一开始的innerHTML存到变量里 给input添加内容
        let content = ps[i].innerHTML
        ps[i].addEventListener("dblclick", function () {
            //this.select() 获取焦点的时候 全选
            this.innerHTML = '<input type="text"  value=' + content + ' class="pinput"  onfocus="this.select();"> '
            //获取全部input元素
            let pinputs = document.querySelector(".pinput")
            console.log(ps[i].id);
            pinputs.focus()
            pinputs.addEventListener("blur", function () {
                let index = ps[i].id
                //修改data对应数据的内容 再重新渲染页面 input自动消失 创建的p里面没有input
                datas[index].title = this.value
                saveData(datas)
                load()
            })
        })
    }
    //修改任务数量
    donumber.innerHTML = docount
    donenumber.innerHTML = donecount
}