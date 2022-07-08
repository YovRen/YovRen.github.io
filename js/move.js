var oDiv = document.getElementById('write');
var span = document.getElementById('writer');

var a = 0;
//定义变量a，点击开启或关闭后a加一，用奇偶数的变换来判断是改开还是改关。
span.onclick = function () {
    if (a % 2 === 0) {
        open();
        a++;
    } else {
        close();
        a++;
    }
}
var timer = null;

function open() {
    oDiv.hidden = true
}

function close() {
    oDiv.hidden = false
}

span.addEventListener('mousedown', function (e) {
    var x = e.pageX - span.offsetLeft;
    var y = e.pageY - span.offsetTop;
    //鼠标移动，触发移动事件
    document.addEventListener('mousemove', move)

    function move(e) {
        span.style.left = e.pageX - x + 'px';
        span.style.top = e.pageY - y + 'px';
        if (e.pageX - x < 0) {
            span.style.left = '0px';
        }
        if (e.pageX - x > span.parentElement.offsetWidth - span.offsetWidth) {
            span.style.left = span.parentElement.offsetWidth - span.offsetWidth + 'px';
            console.log(span.parentElement.offsetWidth - span.offsetWidth)
        }
        if (e.pageY - y < 0) {
            span.style.top = '0px';
        }
        if (e.pageY - y > span.parentElement.offsetHeight - span.offsetHeight - 50) {
            span.style.top = span.parentElement.offsetHeight - span.offsetHeight - 50 + 'px';
            console.log(span.parentElement.offsetWidth - span.offsetWidth - 50)
        }
    }

    //鼠标抬起，销毁鼠标移动事件
    document.addEventListener('mouseup', function () {
        document.removeEventListener('mousemove', move);
    })
})

oDiv.addEventListener('mousedown', function (e) {
    var y = e.pageY - oDiv.offsetTop;
    //鼠标移动，触发移动事件
    document.addEventListener('mousemove', move)

    function move(e) {
        oDiv.style.top = e.pageY - y + 'px';
    }

    //鼠标抬起，销毁鼠标移动事件
    document.addEventListener('mouseup', function () {
        document.removeEventListener('mousemove', move);
    })
})