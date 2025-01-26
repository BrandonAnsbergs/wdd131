document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('menuButton');
    const navList = document.getElementById('navList');

    menuButton.addEventListener('click', function() {
        navList.classList.toggle('show');
    });
});