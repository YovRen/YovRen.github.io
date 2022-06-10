//获取元素
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
            // 获取getData()函数里的返回值 一开始返回[] 后面数组里有对象之后 返回对象 JSON.parse
            let local = getData()
            //信息以对象的形式储存
            local.push({ title: sear.value, done: false })
            //保存数据
            saveData(local)
            //清空搜索框里的东西
            sear.value = ''
            //渲染页面
            load()
        }
    }
})

function getData() {
    //获取key为todolist里的字符串 存储在本地里的都是以字符串形式存储的 所以返回的时候要用JSON把data转换为对象形式
    let data = localStorage.getItem("todolist")
    if (data != null) {
        return JSON.parse(data)
    } else {
        return []
    }
}

function saveData(data) {
    //保存data到todolist里 转换为字符串形式
    return localStorage.setItem("todolist", JSON.stringify(data))
}


function load() {
    //渲染页面 因为添加了之后 ul里会一直有li 所以每次再渲染页面的时候 要清空li
    dothings.innerHTML = ''
    donethings.innerHTML = ''
    //每次也都要把任务数量设为0 不然每次叠加
    let docount = 0
    let donecount = 0
    //获取本地储存里的内容 现在是对象形式
    let data = getData()
    for (let i = 0; i < data.length; i++) {
        if (data[i].done) {
            //如果里面的done属性的值是true 创建li
            let lis = document.createElement("li")
            lis.innerHTML = "<span class='front'></span><input type='checkbox' checked='checked' class='rightbox'  id=" + i + "><p class='word' id=" + i + ">" + data[i].title + "</p><span class='close' id=" + i + "></span>"
            donethings.appendChild(lis)
            //数量++
            donecount++

        } else {
            let lis = document.createElement("li")
            lis.innerHTML = "<span class='front'></span><input type='checkbox' id=" + i + " class='rightbox'><p class='word' id=" + i + ">" + data[i].title + "</p><span class='close' id=" + i + " ></span>"
            dothings.appendChild(lis)
            docount++
        }
    }
    //每次点击关闭 或者 点击box 和修改p里面的内容都要重新保存数据 和渲染页面
    //因为每次li里面的各个内容都是动态生成的 所以在load外面没法获取 只能在load里面 每次渲染添加之后在=再重新获取元素
    let closes = document.querySelectorAll(".close")
    for (let i = 0; i < closes.length; i++) {
        closes[i].addEventListener("click", function () {
            let index = this.id
            data.splice(index, 1)
            saveData(data)
            load()
        })
    }

    //点击之后checked变成checked 保存数据 再渲染页面 修改任务出现的位置
    let inputs = document.querySelectorAll(".rightbox")
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener("click", function () {
            let index = this.id
            data[index].done = this.checked
            saveData(data)
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
                data[index].title = this.value
                saveData(data)
                load()
            })
            // pinputs.addEventListener("keydown", event => {
            //     if (event.keyCode === 13) {
            //         let index = ps[i].id
            //         data[index].title = pinputs.value
            //         saveData(data)
            //         load()
            //     }
            // })
        })
    }
    //修改任务数量
    donumber.innerHTML = docount
    donenumber.innerHTML = donecount
}