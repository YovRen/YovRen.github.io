//要使用面向对象的思维来开发
//定义一个气球对象
function Balloon(pic) {
    //盒子
    this.div = document.createElement("div");
    this.div.setAttribute("class", "balloon");
    this.div.setAttribute("position", "fixed");

    this.bg=pic
    this.r = 80;
    this.speedX = randomRange(-0.6,0.6);
    this.speedY = randomRange(-1.5,-0.5);

}

//绘制气球 原型概念
Balloon.prototype.drawBalloon = function (parent) {
    this.parent = parent;
    var style = this.div.style;
    this.div.style.width = this.r + "px";
    this.div.style.height = this.r + "px";
    style.left = randomRange(0,this.parent.offsetWidth)+"px";
    style.bottom = "0";
    style.background = this.bg;
    parent.appendChild(this.div);
}
//让气球动起来
Balloon.prototype.run = function () {
    //获取父容器宽高
    var maxLeft = this.parent.offsetWidth - this.r * 2;
    var maxTop = this.parent.offsetHeight - this.r * 2;

    var ts = this;
    //定时器
    setInterval(function () {
        //获取左边移动的距离
        var left = ts.div.offsetLeft + ts.speedX;
        //获取上边移动的距离
        var top = ts.div.offsetTop + ts.speedY;

        //判断边界位置
        if (left <= 0) {
            left = 0;
            ts.speedX *= -1;
        }

        if (left >= maxLeft) {
            left = maxLeft;
            ts.speedX *= -1;
        }

        //开始移动
        ts.div.style.left = left + "px";
        ts.div.style.top = top + "px";
    }, 20);
}

//封装一个指定范围的随机函数
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}
