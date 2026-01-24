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


// =========================================
// 消息提示组件逻辑
// =========================================

/**
 * 1. 屏幕中央警告模态框
 * @param {string} title - 标题
 * @param {string} message - 内容
 * @param {function} callback - 点击确定后的回调函数 (可选)
 */
function showToastCenter(title, message, callback) {
    const overlay = document.getElementById('toastCenterOverlay');
    const titleEl = document.getElementById('centerTitle');
    const msgEl = document.getElementById('centerMsg');
    const btn = overlay.querySelector('.toast-center-btn');

    titleEl.textContent = title;
    msgEl.textContent = message;

    // 绑定一次性点击事件
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.onclick = () => {
        closeToastCenter();
        if (callback && typeof callback === 'function') {
            callback();
        }
    };

    overlay.classList.add('active');
}

function closeToastCenter() {
    document.getElementById('toastCenterOverlay').classList.remove('active');
}

/**
 * 2. 右上角提示 (带倒计时条)
 * @param {string} title - 标题
 * @param {string} message - 内容
 * @param {string} type - 'info' | 'success' | 'warning' | 'error'
 * @param {number} duration - 停留时间
 */
function showToastTopRight(title, message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastTopRightContainer');
    
    // 颜色映射
    const colors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    const color = colors[type] || colors.info;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.style.borderLeftColor = color;
    
    toast.innerHTML = `
        <div>
            <div style="font-weight:bold; margin-bottom:4px; color:#333;">${title}</div>
            <div style="font-size:0.9rem; color:#666;">${message}</div>
        </div>
        <div class="toast-progress" style="background:${color}; animation: progress ${duration}ms linear forwards;"></div>
    `;

    // 添加 CSS 动画 keyframes for progress if not exists (simplified here using inline style logic)
    // 为了简单起见，我们用JS控制进度条宽度，或者直接用CSS transition
    const progressBar = toast.querySelector('.toast-progress');
    
    container.appendChild(toast);

    // 动画逻辑
    setTimeout(() => {
        progressBar.style.width = '0%';
        progressBar.style.transition = `width ${duration}ms linear`;
    }, 10);

    // 自动移除
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s ease forwards';
        toast.addEventListener('animationend', () => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        });
    }, duration);
}

/**
 * 3. 右下角提示 (简单滑入)
 * @param {string} message - 消息内容
 * @param {number} duration - 停留时间 (0表示不自动消失)
 */
function showToastBottomRight(message, duration = 3000) {
    const container = document.getElementById('toastBottomRightContainer');
    
    const toast = document.createElement('div');
    toast.className = 'toast-bottom-item';
    toast.innerHTML = `<span>${message}</span>`;
    
    container.appendChild(toast);

    if (duration > 0) {
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, duration);
    }
}

/*

 * 4. 指定元素下方提示
 * @param {string} targetId - 目标元素的ID
 * @param {string} message - 错误信息
 */
function showToastBelow(targetId, message) {
    // 先清除该元素已有的提示
    const target = document.getElementById(targetId);
    if (!target) return;

    // 移除旧的
    const oldToast = document.getElementById(`toast-anchored-${targetId}`);
    if (oldToast) oldToast.remove();

    // 创建新的
    const toast = document.createElement('div');
    toast.id = `toast-anchored-${targetId}`;
    toast.className = 'toast-anchored fade-in';
    toast.textContent = message;

    // 计算位置
    const rect = target.getBoundingClientRect();
    // 需要加上 scrollY 因为 fixed/absolute 坐标系不同
    // 这里我们直接 append 到 body 并使用 absolute 定位相对于 body (假设 body 是 relative 或无定位)
    // 更好的方式是 append 到一个 position: relative 的父级，或者直接计算 fixed 坐标
    
    // 为了简单且不受父级 overflow 影响，这里使用 fixed 定位
    toast.style.position = 'fixed';
    toast.style.top = (rect.bottom + 5) + 'px';
    toast.style.left = rect.left + 'px';

    document.body.appendChild(toast);

    // 3秒后自动消失
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

//   From GLM4.7 -- 阿里云百炼 / cherry studio


window.openFileViewer = openModal;


window.showToastTopRight = showToastTopRight;
window.showToastBottomRight = showToastBottomRight;
window.showToastBelow = showToastBelow;
window.showToastCenter = showToastCenter;
