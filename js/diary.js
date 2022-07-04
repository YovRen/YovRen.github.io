const {Query, User} = AV;
AV.init({
    appId: "szRqJxj4rGr47DBsfiYqh9qA-gzGzoHsz",
    appKey: "UCGehmC6gOKYHSKpoMLeaRFJ",
    serverURL: "https://szrqjxj4.lc-cn-n1-shared.com"
});

const title = document.querySelector("#title")
const content = document.querySelector("#content")
const submit = document.querySelector("#submit")
const diarythings = document.querySelector(".diarythings")
load()

submit.addEventListener("click", async event => {
    if (content.value !== '') {
        saveData({title: title.value, content: content.value})
        title.value = ''
        content.value = ''
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

function saveData(data) {
    const Diary = AV.Object.extend('Diary');
    const diary = new Diary();
    diary.set('title', data.title);
    diary.set('content', data.content);
    diary.save()
}

async function load() {

    diarythings.innerHTML = ''
    let datas = await getData()
    for (let i = 0; i < datas.length; i++) {
        let lis = document.createElement("li")
        lis.innerHTML = "<span id="+datas[i].id+">"+datas[i].attributes.title+"</span>"+"<span id="+datas[i].id+">"+datas[i].attributes.content+"</span>"
        diarythings.appendChild(lis)
    }

}