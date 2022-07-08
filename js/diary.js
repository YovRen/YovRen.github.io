const {Query, User} = AV;

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

load()

let file;
$('#image').on('change', async function () {
    const localFile = this.files[0];
    file = new AV.File($(this).val(), localFile);
});


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

function weather() {
    let ret = "未知";
    jQuery.support.cors = true;
    $.ajax({
        url: "http://wthrcdn.etouch.cn/weather_mini",
        type: "GET",
        dataType: 'json',
        data: {city: (returnCitySN['cname'])},
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
    diary.set('city', returnCitySN['cname']);
    diary.set('weather', weather());
    diary.set('time', time());
    diary.set('image', file);
    if (returnCitySN['cname'][0] === "天") {
        diary.set('author', "小燃");
    } else if (returnCitySN['cname'][0] === "云") {
        diary.set('author', "梦竹");
    }
    diary.save();
}

async function load() {

    timeline.innerHTML = ''
    let datas = await getData()
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
        let lis = document.createElement("li")
        lis.innerHTML =
            "<img class=\"tl-circ\" src=" + avatar + "></img>\n" +
            "<div class=\"timeline-panel\">\n" +
            "<div class=\"tl-heading\">\n" +
            "<h4>" + datas[i].attributes.title + "</h4>\n" +
            "</div>\n" +
            "<div class=\"tl-body\">\n" +
            "<span style='font-size:19px'>" + datas[i].attributes.content[0] + "</span>" + datas[i].attributes.content.substr(1) +
            "</div>" +
            "<div class=\"small text-muted\">\n" +
            "<i class=\"glyphicon glyphicon-globe\"></i> [" + datas[i].attributes.city + "] • " + datas[i].attributes.weather +
            "</div>\n" +
            "</div>";
        if (datas[i].attributes.image) {
            lis.innerHTML =
                "<img class=\"tl-circ\" src=" + avatar + "></img>\n" +
                "<div class=\"timeline-panel\">\n" +
                "<div class=\"tl-heading\">\n" +
                "<h4>" + datas[i].attributes.title + "</h4>\n" +
                "<div class=\"small text-muted\">\n" +
                "<i class=\"glyphicon glyphicon-globe\"></i> [" + datas[i].attributes.city + "] • " + datas[i].attributes.weather +
                "</div>\n" +
                "</div>\n" +
                "<div class=\"tl-body\">\n" +
                "<span style='font-size:19px'>" + datas[i].attributes.content[0] + "</span>" + datas[i].attributes.content.substr(1) +
                "</div>" +
                "<img src='" + datas[i].attributes.image.attributes.url + "'></img>" +
                "</div>";
        }
        console.log(lis)
        timeline.appendChild(lis);
    }

}