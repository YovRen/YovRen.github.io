const {Query, User} = AV;

AV.init({
    appId: "szRqJxj4rGr47DBsfiYqh9qA-gzGzoHsz",
    appKey: "UCGehmC6gOKYHSKpoMLeaRFJ",
    serverURL: "https://szrqjxj4.lc-cn-n1-shared.com"
});

const title = document.querySelector("#title")
const content = document.querySelector("#content")
const submit = document.querySelector("#submit")
const toggle = document.querySelector("#toggle")
const write = document.querySelector("#write")
const image = document.querySelector("#image")
const timeline = document.querySelector(".timeline")
load()

let file;
$('#image').on('change', async function () {
    const localFile = this.files[0];
    file = new AV.File($(this).val(), localFile);
});


/**
 * 图像转Base64
 */
function getBase64Image(img) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, img.width, img.height);
    var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
    return canvas.toDataURL("image/" + ext);
}


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
    // diary.set('weather', weather());
    diary.set('time', time());
    console.log(file)
    diary.set('image', file);
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
        let lis = document.createElement("li")
        lis.innerHTML =
            "<img class=\"tl-circ\" src='img/users/xiaoran.png'></img>\n" +
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
            "</div>";
        if (datas[i].attributes.image) {
            lis.innerHTML =
                "<img class=\"tl-circ\" src='img/users/xiaoran.png'></img>\n" +
                "<div class=\"timeline-panel\">\n" +
                "<div class=\"tl-heading\">\n" +
                "<h4>" + datas[i].attributes.title + "</h4>\n" +
                "<div class=\"small text-muted\">\n" +
                "<i class=\"glyphicon glyphicon-globe\"></i> [" + datas[i].attributes.city + "] • " + datas[i].attributes.weather +
                "</div>\n" +
                "</div>\n" +
                "<div class=\"tl-body\">\n" +
                "<span style='font-size:19px'>" + datas[i].attributes.content[0] + "</span>" + datas[i].attributes.content.substr(1) +
                "<img src='" + datas[i].attributes.image.attributes.url + "'></img>" +
                "</div>" +
                "</div>";
        }
        console.log(lis)
        timeline.appendChild(lis);
    }

}


//点击添加图片
$('body').on('click', '.addImg', function () {
    $(this).parent().find('.upload_input').click();
});
//点击
$('body').on('click', '.delete', function () {
    $(this).parent().find('input').val('');
    $(this).parent().find('img.preview').attr("src", "");
    //IE9以下
    $(this).parent().find('img.preview').css("filter", "");
    $(this).hide();
    $(this).parent().find('.addImg').show();
});

//选择图片
function change(file) {
    //预览
    var pic = $(file).parent().find(".preview");
    //添加按钮
    var addImg = $(file).parent().find(".addImg");
    //删除按钮
    var deleteImg = $(file).parent().find(".delete");

    var ext = file.value.substring(file.value.lastIndexOf(".") + 1).toLowerCase();

    // gif在IE浏览器暂时无法显示
    if (ext != 'png' && ext != 'jpg' && ext != 'jpeg') {
        if (ext != '') {
            alert("图片的格式必须为png或者jpg或者jpeg格式！");
        }
        return;
    }
    //判断IE版本
    var isIE = navigator.userAgent.match(/MSIE/) != null,
        isIE6 = navigator.userAgent.match(/MSIE 6.0/) != null;
    isIE10 = navigator.userAgent.match(/MSIE 10.0/) != null;
    if (isIE && !isIE10) {
        file.select();

        //ie8,9,10拒绝访问 updated by fli at 20180730
        $(file).blur();

        var reallocalpath = document.selection.createRange().text;
        // IE6浏览器设置img的src为本地路径可以直接显示图片
        if (isIE6) {
            pic.attr("src", reallocalpath);
        } else {
            // 非IE6版本的IE由于安全问题直接设置img的src无法显示本地图片，但是可以通过滤镜来实现
            pic.css("filter", "progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod='scale',src=\"" + reallocalpath + "\")");
            // 设置img的src为base64编码的透明图片 取消显示浏览器默认图片
            pic.attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');
        }
        addImg.hide();
        deleteImg.show();
    } else {
        html5Reader(file, pic, addImg, deleteImg);
    }
}

//H5渲染
function html5Reader(file, pic, addImg, deleteImg) {
    var file = file.files[0];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
        pic.attr("src", this.result);
    }
    addImg.hide();
    deleteImg.show();
}
