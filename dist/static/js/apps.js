

async function displayApps() {
    const appList = document.getElementById('app-list');
    appList.innerHTML = '';

    

    const apps = await fetch(`${window.config.apiUrl}/apps`,
        { method: 'POST' }
    )
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Apps:', data);
            return data.apps;
        } else {
            console.log('Error:', data.message);
            showToastTopRight('', '获取应用列表失败', "warning");
            return [];
        }
    }).catch(error => {
        console.error('Fetch error:', error);
        showToastTopRight('', '获取应用列表失败', "warning");
        return [];
    });

    apps.forEach(appData => {
        const appElement = createAppElement(appData);
        appList.appendChild(appElement);
    });
}

function createAppElement(appData) {
    const appElement = document.createElement('div');
    appElement.className = 'card app-card';
    appElement.setAttribute('data-category', appData.partition);

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body text-center';

    const appIcon = document.createElement('div');
    appIcon.className = 'app-icon mx-auto';
    appIcon.style.backgroundImage = appData.iconBackground;
    appIcon.innerHTML = appData.appIconElement;

    const appName = document.createElement('h4');
    appName.className = 'card-title';
    appName.textContent = appData.name;

    const author = document.createElement('small');
    author.className = 'text-muted';
    author.textContent = `提供者：${appData.author}`;

    const appDescription = document.createElement('p');
    appDescription.className = 'card-text';
    appDescription.innerHTML = appData.appDescription;

    const go = document.createElement('a');
    go.className = 'btn btn-outline-primary';
    go.href = appData.url;
    go.target = '_blank';
    go.textContent = '立即前往';


    cardBody.appendChild(appIcon);
    cardBody.appendChild(appName);
    cardBody.appendChild(author);
    cardBody.appendChild(appDescription);
    appElement.appendChild(cardBody);
    appElement.appendChild(go);
    return appElement;
}

export function init() {
    console.log('apps.js init');

    const categoryButtons = document.querySelectorAll('.category-btn');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {

            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');

            const appCards = document.querySelectorAll('.app-card');
            
            appCards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    AOS.init({
        duration: 1000,
        offset: 100
    });
    displayApps();

}



