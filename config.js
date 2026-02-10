const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';


window.config = {
    apiUrl: "/api",

    siderbar: {
        default: 'menu.html'
    },
    navbar: {
        default: 'nav.html'
    }
};