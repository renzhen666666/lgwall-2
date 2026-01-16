// 模态框部分
let currentIndex = 0;
let currentVideoElement = null;
let galleryData = [];

const modal = document.getElementById('mediaModal');
const mediaContainer = document.getElementById('mediaContainer');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalCounter = document.getElementById('modalCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function openModal(filename, lst, title='', desc='') {
    if(!lst.includes(filename)) {
        return;
    }
    currentIndex = lst.indexOf(filename);
    galleryData = lst;
    updateModalContent(filename, lst, title, desc);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function updateModalContent(filename, lst, title, desc) {
    const fileSrc = `${staticUrl}/files/${filename}`;

    // 1. 如果当前正在播放视频，先暂停它
    if (currentVideoElement) {
        currentVideoElement.pause();
        currentVideoElement = null;
    }

    // 2. 清空容器
    mediaContainer.innerHTML = '';

    // 3. 根据类型渲染
    if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.gif')) {
        const img = document.createElement('img');
        img.src = fileSrc;
        if(title) img.alt = title;
        img.className = 'modal-image';
        mediaContainer.appendChild(img);
    } 
    else {
        const video = document.createElement('video');
        video.src = fileSrc;
        video.className = 'modal-video';
        video.controls = true; // 显示控制条
        video.autoplay = true;  // 打开即自动播放
        video.loop = true;      // 循环播放
        // muted = true; // 如果需要自动播放且不被浏览器拦截，通常需要静音，这里暂不强制静音
        mediaContainer.appendChild(video);
        
        // 保存引用以便下次切换时暂停
        currentVideoElement = video;
    }

    // 4. 更新文字和计数器
    if(title) modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalCounter.textContent = `${lst.indexOf(filename) + 1} / ${lst.length}`;

    // 5. 更新按钮状态
    updateNavButtons();
}



function changeMedia(direction) {
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < galleryData.length) {
        currentIndex = newIndex;
        updateModalContent();
    }
}

/**
 * 更新左右箭头的可用/禁用状态
 */
function updateNavButtons() {
    if (currentIndex === 0) {
        prevBtn.classList.add('disabled');
    } else {
        prevBtn.classList.remove('disabled');
    }

    if (currentIndex === galleryData.length - 1) {
        nextBtn.classList.add('disabled');
    } else {
        nextBtn.classList.remove('disabled');
    }
}

/**
 * 关闭模态框
 */
function closeModal() {
    // 关闭前暂停视频
    if (currentVideoElement) {
        currentVideoElement.pause();
        currentVideoElement = null;
    }
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // 延迟清空内容，避免动画时闪烁
    setTimeout(() => {
        mediaContainer.innerHTML = '';
    }, 300);
}

/**
 * 处理遮罩层点击事件
 */
function handleOverlayClick(event) {
    if (event.target === modal) {
        closeModal();
    }
}

/**
 * 键盘事件监听
 */
document.addEventListener('keydown', function(event) {
    if (!modal.classList.contains('active')) return;

    if (event.key === 'Escape') {
        closeModal();
    } else if (event.key === 'ArrowLeft') {
        changeMedia(-1);
    } else if (event.key === 'ArrowRight') {
        changeMedia(1);
    }
});

// 模态框部分结束




window.openFileViewer = openModal;
