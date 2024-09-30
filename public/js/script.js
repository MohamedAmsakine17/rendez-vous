const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      if (e.target.classList.contains("hidden-left")) {
        e.target.classList.add("show-left");
      } else if (e.target.classList.contains("hidden-right")) {
        e.target.classList.add("show-right");
      } else if (e.target.classList.contains("hidden-top")) {
        e.target.classList.add("show-top");
      } else if (e.target.classList.contains("hidden-bottom")) {
        e.target.classList.add("show-bottom");
      } else {
        e.target.classList.add("show");
      }
    }
  });
});

const hiddenElements = document.querySelectorAll(
  ".hidden, .hidden-left, .hidden-right, .hidden-top, .hidden-bottom"
);
hiddenElements.forEach((el) => observer.observe(el));
