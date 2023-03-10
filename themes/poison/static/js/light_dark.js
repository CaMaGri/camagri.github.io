const btn = document.querySelector(".btn-light-dark");
const langBtn = document.querySelector(".btn-en-es");
const moon = document.querySelector(".moon");
const sun = document.querySelector(".sun");

const themeFromLS = localStorage.getItem("theme")
const themeFromHugo = document.body.classList.contains("dark-theme") ? "dark" : null
const currentTheme = themeFromLS ? themeFromLS : themeFromHugo;

if (currentTheme == "dark") {
    document.body.classList.add("dark-theme");
    moon.style.display = 'none';
    sun.style.display = 'block';
} else {
    document.body.classList.remove("dark-theme");
    moon.style.display = 'block';
    sun.style.display = 'none';
}

btn.addEventListener("click", function () {
    document.body.classList.toggle("dark-theme");

    let theme = "light";
    if (document.body.classList.contains("dark-theme")) {
        theme = "dark";
        moon.style.display = 'none';
        sun.style.display = 'block';
    } else {
        moon.style.display = 'block';
        sun.style.display = 'none';
    }
    localStorage.setItem("theme", theme);
});

langBtn.addEventListener("click", (_event) => {
    console.log(langBtn.attributes['lang'].value);
    if(langBtn.attributes['lang'].value == 'es') {
        window.location = location.pathname.replace('/es/', '/');
    } else {
        window.location = '/es' + location.pathname;
    }
});
