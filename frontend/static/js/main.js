let noticeCache = null;
let noticeCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

const apiUrl = window.config.apiUrl;
const staticUrl = apiUrl + '/static';

let currentFiles = [];
let currentFileIndex = 0;

async function loadNoticeContent() {
    const now = Date.now();
    
    if (noticeCache && (now - noticeCacheTime) < CACHE_DURATION) {
        document.getElementById('notice-content').innerHTML = noticeCache;
        return;
    }
    
    try {
        const response = await fetch(`${apiUrl}/notice`, {'method': 'POST'});
        const data = await response.json();
        
        const noticeContent = document.getElementById('notice-content');

        const noticeList = document.createElement('ul');


        if (data.success && data.content.length > 0) {
            data.content.slice().reverse().forEach(item => {
                const listItem = document.createElement('li');
                const content = item.content.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')

                const card = document.createElement('div');
                card.className = 'card';

                const cardHead = document.createElement('div');
                cardHead.className = 'card-header';

                const timestamp = document.createElement('small');
                timestamp.className = 'text-muted';
                timestamp.innerHTML = item.timestamp;

                const cardBody = document.createElement('div');
                cardBody.className = 'card-body';
                cardBody.innerHTML = content;

                cardHead.appendChild(timestamp);
                card.appendChild(cardHead);
                card.appendChild(cardBody);

                listItem.appendChild(card);
                noticeList.appendChild(listItem);
            });

            noticeContent.innerHTML = '';
            noticeContent.appendChild(noticeList);

            noticeCache = noticeContent.innerHTML;
            noticeCacheTime = now;
        } else {
            noticeContent.innerHTML = '<div class="alert alert-info">暂无公告内容</div>';
            noticeCache = '<div class="alert alert-info">暂无公告内容</div>';
            noticeCacheTime = now;
        }
    } catch (error) {
        console.error('加载公告失败:', error);
        document.getElementById('notice-content').innerHTML = 
            '<div class="alert alert-danger">加载公告失败，请稍后再试</div>';
    }
}


function likeMessage(messageId) {
    const likeButton = document.getElementById(`like-${messageId}`);
    let currentLikes = parseInt(likeButton.textContent.split(' ')[0]);
    likeButton.disabled = true;

    fetch(`${apiUrl}/wall/like/${messageId}`, {
        method:'POST'
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            alert('点赞失败');
        }
    }).then(data => {
        if (data.success) {
            if (data.action == 'cancel') {
                likeButton.classList.remove('liked');
                likeButton.style.backgroundColor = 'transparent';
                likeButton.style.color = 'black';
            }
            else {
                likeButton.classList.add('liked');
                likeButton.style.backgroundColor = '#ff0000';
                likeButton.style.color = 'white';
            }
            likeButton.textContent = `${data.likes} 👍`;
        } else {
            likeButton.textContent = `${currentLikes} 👍`;
            console.log(data.error);
        }
    }).finally(() => {
        likeButton.disabled = false;
    });
}

function dislikeMessage(messageId) {
    const dislikeButton = document.getElementById(`dislike-${messageId}`);
    dislikeButton.disabled = true;

    fetch(`${apiUrl}/wall/dislike/${messageId}`, {
        method:'POST'
    }).then(response => {
        if (response.ok) {
            return response.json();
        } else {
            alert('点踩失败');
        }
    }).then(data => {
        if (data.success) {
            if (data.action == 'cancel') {
                dislikeButton.classList.remove('disliked');
                dislikeButton.style.backgroundColor = 'transparent';
                dislikeButton.style.color = 'black';
            } else{
                dislikeButton.classList.add('disliked');
                dislikeButton.style.backgroundColor = '#bd841a';
                dislikeButton.style.color = 'white';
            }
        } else {
            console.log(data.error);
        }
    }).finally(() => {
        dislikeButton.disabled = false;
    });
}


function validateFileType(files) {
    const allowedExtensions = ['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'mp3', 'wav', 'avi', 'mp4', 'mov', 'm4a', 'webm', 'aac', 'flac', 'mid', 'apk'];
    for (let i = 0; i < files.length; i++) {
        const fileExtension = files[i].name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            flashMessage(`文件 "${files[i].name}" 类型不支持`);
            return false;
        }
    }
    return true;
  }

function showModal(imageSrc) {
    const modal = document.getElementById('Modal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc;
    modal.style.display = 'flex';
}



// 打开文件查看模态框
function openFileViewer(files, startIndex) {
    currentFiles = files;
    currentFileIndex = startIndex;
    updateModalContent();
    
    // 显示模态框
    const modalElement = document.getElementById('fileModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // 显示/隐藏导航按钮
    document.querySelector('.btn-prev').style.display = files.length > 1 ? 'block' : 'none';
    document.querySelector('.btn-next').style.display = files.length > 1 ? 'block' : 'none';
}



function updateModalContent() {
    const contentContainer = document.getElementById('modalContentContainer');
    const modalImage = document.getElementById('modalImage');
    const modalVideo = document.getElementById('modalVideo');
    const modalAudio = document.getElementById('modalAudio');
    const modalText = document.getElementById('modalText');
    
    // 隐藏所有内容元素
    modalImage.style.display = 'none';
    modalVideo.style.display = 'none';
    modalAudio.style.display = 'none';
    modalText.style.display = 'none';
    
    const file = currentFiles[currentFileIndex];
    const ext = file.split('.').pop().toLowerCase();
    const filePath = `${staticUrl}/files/${file}`;
    
    // 根据文件类型显示相应内容
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) {
        modalImage.src = filePath;
        modalImage.alt = file;
        modalImage.onload = function() {
            modalImage.style.display = 'block';
        };
        modalImage.onerror = function() {
            modalText.textContent = `无法加载图片: ${file}`;
            modalText.style.display = 'block';
        };
        modalImage.style.display = 'block';
    } 
    else if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) {
        modalVideo.src = filePath;
        modalVideo.innerHTML = `<source src="${filePath}" type="video/${ext}">`;
        modalVideo.onloadeddata = function() {
            modalVideo.play().catch(e => console.log("自动播放失败:", e));
            modalVideo.style.display = 'block';
        };
        modalVideo.onerror = function() {
            modalText.textContent = `无法加载视频: ${file}`;
            modalText.style.display = 'block';
        };
        modalVideo.style.display = 'block';
    }
    else if (['mp3', 'wav', 'aac', 'flac', 'm4a'].includes(ext)) {
        modalAudio.src = filePath;
        modalAudio.onloadeddata = function() {
            modalAudio.play().catch(e => console.log("自动播放失败:", e));
            modalAudio.style.display = 'block';
        };
        modalAudio.onerror = function() {
            modalText.textContent = `无法加载音频: ${file}`;
            modalText.style.display = 'block';
        };
        modalAudio.style.display = 'block';
    }
    else {
        modalText.innerHTML = `
            <div class="d-flex flex-column align-items-center">
                <p>不支持的文件类型: ${ext}</p>
                <a href="${filePath}" target="_blank" class="btn btn-primary mt-3">下载文件: ${file}</a>
            </div>
        `;
        modalText.style.display = 'block';
    }
}

// 上一个文件
function prevFile(event) {
    event.stopPropagation(); // 防止触发关闭模态框
    if (currentFileIndex > 0) {
        currentFileIndex--;
        updateModalContent();
    }
}

// 下一个文件
function nextFile(event) {
    event.stopPropagation(); // 防止触发关闭模态框
    if (currentFileIndex < currentFiles.length - 1) {
        currentFileIndex++;
        updateModalContent();
    }
}

function closeFileModal() {
    const modalElement = document.getElementById('fileModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
        
        // 停止当前播放的媒体
        const modalVideo = document.getElementById('modalVideo');
        const modalAudio = document.getElementById('modalAudio');
        if (modalVideo) modalVideo.pause();
        if (modalAudio) modalAudio.pause();
    }
}


window.likeMessage = likeMessage;
window.dislikeMessage = dislikeMessage;
window.validateFileType = validateFileType;
window.showModal = showModal;
window.openFileViewer = openFileViewer;
window.updateModalContent = updateModalContent;
window.prevFile = prevFile;
window.nextFile = nextFile;
window.loadNoticeContent = loadNoticeContent;
window.closeFileModal = closeFileModal;
//



document.addEventListener('DOMContentLoaded', function() {
    const noticeModal = document.getElementById('notice');
    if (noticeModal) {
        noticeModal.addEventListener('show.bs.modal', function () {
            loadNoticeContent();
        });
    }
});

