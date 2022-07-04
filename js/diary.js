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
const toggle = document.querySelector("#toggle")
const write = document.querySelector("#write")
load()

function Weather() {
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

Weather()

toggle.addEventListener("click", async event => {
    $("#write").fadeToggle("slow");
    if (write.getAttribute('style').length === 11) {
        toggle.innerHTML = "写日记";
    } else {
        toggle.innerHTML = "看日记";
    }
    await load()
})

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
    diary.set('city', returnCitySN['cname'])
    diary.set('weather', Weather())
    diary.save()
}

async function load() {

    diarythings.innerHTML = ''
    let datas = await getData()
    for (let i = datas.length - 1; i >= 0; i--) {
        let lis = document.createElement("li")
        if (datas[i].attributes.city[0]==='天'){
            lis.innerHTML = "<div class=avatar><img class = avatar src='img/users/xiaoran.png' ></div>"
        }else if (datas[i].attributes.city[0]==='云'){
            lis.innerHTML = "<div class=avatar><img class = avatar src='img/users/mengzhu.png' ></div>"
        }
        let time = datas[i].getCreatedAt().getFullYear() + "-" + datas[i].getCreatedAt().getMonth() + 1 + "-" + datas[i].getCreatedAt().getDate() + " " + datas[i].getCreatedAt().getHours() + ":" + datas[i].getCreatedAt().getMinutes()
        lis.innerHTML +=
            "<div class='cell'>\n" +
            "<div class='diary-content'><span style='font-size:19px'>" + datas[i].attributes.content[0] + "</span>" + datas[i].attributes.content.substr(1) + "</div>" +
            "<div class='diary-meta'>" +
            "<i class='glyphicon glyphicon-user'></i>" +
            " • <i class='glyphicon glyphicon-time'></i>" + time +
            " • 《" + datas[i].attributes.title + "》" +
            " • <i class='glyphicon glyphicon-globe'></i> [" + datas[i].attributes.city + "]" +
            " • <i class='glyphicon glyphicon-new-window'></i>" + datas[i].attributes.weather +
            "</div>" +
            "</div>"
        diarythings.appendChild(lis)
    }

}

