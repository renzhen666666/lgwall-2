let noticeCache = null;
let noticeCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

const apiUrl = window.config.apiUrl;
const staticUrl = apiUrl + '/static';



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







window.likeMessage = likeMessage;
window.dislikeMessage = dislikeMessage;
window.validateFileType = validateFileType;
window.openFileViewer = openFileViewer;
window.updateModalContent = updateModalContent;
window.loadNoticeContent = loadNoticeContent;


//



document.addEventListener('DOMContentLoaded', function() {
    const noticeModal = document.getElementById('notice');
    if (noticeModal) {
        noticeModal.addEventListener('show.bs.modal', function () {
            loadNoticeContent();
        });
    }
});

