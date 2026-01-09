// 雪花效果
(function() {
    const snowflakesContainer = document.getElementById('snowflakes');
    if (!snowflakesContainer) return;
    
    const snowflakeSymbols = ['❄', '❅', '❆', '✻', '✼', '✽', '✾', '✿', '❀'];
    const maxSnowflakes = 50;
    
    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakeSymbols[Math.floor(Math.random() * snowflakeSymbols.length)];
        
        // 随机位置和动画时间
        const startX = Math.random() * 100;
        const duration = 10 + Math.random() * 20; // 10-30秒
        const delay = Math.random() * 5;
        const size = 0.8 + Math.random() * 0.7; // 0.8-1.5em
        
        snowflake.style.left = startX + '%';
        snowflake.style.fontSize = size + 'em';
        snowflake.style.animationDuration = duration + 's';
        snowflake.style.animationDelay = delay + 's';
        snowflake.style.opacity = 0.3 + Math.random() * 0.4; // 0.3-0.7
        
        snowflakesContainer.appendChild(snowflake);
        
        // 动画结束后移除
        setTimeout(() => {
            if (snowflake.parentNode) {
                snowflake.parentNode.removeChild(snowflake);
            }
        }, (duration + delay) * 1000);
    }
    
    // 创建初始雪花
    for (let i = 0; i < maxSnowflakes; i++) {
        setTimeout(() => createSnowflake(), i * 200);
    }
    
    // 定期创建新雪花以保持数量
    setInterval(() => {
        const currentCount = snowflakesContainer.children.length;
        if (currentCount < maxSnowflakes) {
            createSnowflake();
        }
    }, 1000);
})();
