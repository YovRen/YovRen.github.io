// 图片上传工具函数
async function uploadImageToLeanCloud(file) {
    return new Promise((resolve, reject) => {
        const avFile = new AV.File(file.name, file);
        avFile.save().then((savedFile) => {
            resolve(savedFile.attributes.url);
        }).catch((error) => {
            reject(error);
        });
    });
}

// 处理粘贴图片
function setupImagePaste(editor) {
    if (!editor || !editor.codemirror) return;
    
    const cm = editor.codemirror;
    
    // 监听粘贴事件
    cm.on('paste', (cm, e) => {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;
        
        const items = clipboardData.items;
        if (!items) return;
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            // 检查是否是图片
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault();
                
                const file = item.getAsFile();
                if (!file) continue;
                
                // 显示上传提示
                const cursor = cm.getCursor();
                const placeholder = `![上传中...]()`;
                cm.replaceRange(placeholder, cursor);
                
                // 上传图片
                uploadImageToLeanCloud(file).then(url => {
                    // 替换占位符为实际图片链接
                    const markdown = `![${file.name}](${url})`;
                    const content = cm.getValue();
                    const newContent = content.replace(placeholder, markdown);
                    cm.setValue(newContent);
                }).catch(error => {
                    console.error('图片上传失败:', error);
                    // 移除占位符
                    const content = cm.getValue();
                    const newContent = content.replace(placeholder, '');
                    cm.setValue(newContent);
                    alert('图片上传失败，请重试');
                });
                
                break;
            }
        }
    });
    
    // 监听拖拽事件
    const wrapper = cm.getWrapperElement();
    wrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    wrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.indexOf('image') === -1) continue;
            
            const cursor = cm.getCursor();
            const placeholder = `![上传中...]()`;
            cm.replaceRange(placeholder, cursor);
            
            uploadImageToLeanCloud(file).then(url => {
                const markdown = `![${file.name}](${url})`;
                const content = cm.getValue();
                const newContent = content.replace(placeholder, markdown);
                cm.setValue(newContent);
            }).catch(error => {
                console.error('图片上传失败:', error);
                const content = cm.getValue();
                const newContent = content.replace(placeholder, '');
                cm.setValue(newContent);
                alert('图片上传失败，请重试');
            });
        }
    });
}

// 自定义图片上传按钮
function setupCustomImageUpload(editor) {
    if (!editor || !editor.toolbar) return;
    
    // 找到图片按钮并替换
    const toolbar = editor.toolbar;
    const imageButton = toolbar.find(btn => btn && btn.name === 'image');
    
    if (imageButton) {
        // 创建文件输入
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // 替换图片按钮的点击事件
        const originalAction = imageButton.action;
        imageButton.action = function(editor) {
            fileInput.click();
        };
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const cursor = editor.codemirror.getCursor();
            const placeholder = `![上传中...]()`;
            editor.codemirror.replaceRange(placeholder, cursor);
            
            uploadImageToLeanCloud(file).then(url => {
                const markdown = `![${file.name}](${url})`;
                const content = editor.codemirror.getValue();
                const newContent = content.replace(placeholder, markdown);
                editor.codemirror.setValue(newContent);
            }).catch(error => {
                console.error('图片上传失败:', error);
                const content = editor.codemirror.getValue();
                const newContent = content.replace(placeholder, '');
                editor.codemirror.setValue(newContent);
                alert('图片上传失败，请重试');
            });
            
            fileInput.value = '';
        });
    }
}
