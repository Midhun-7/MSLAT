$(function () {
  $(".sidebar-link").click(function () {
    $(".sidebar-link").removeClass("is-active");
    $(this).addClass("is-active");
  });
});

$(window)
.resize(function () {
  if ($(window).width() > 1090) {
    $(".sidebar").removeClass("collapse");
  } else {
    $(".sidebar").addClass("collapse");
  }
})
.resize();

$(function () {
  // Default to Home view on load
  $(".main-container").addClass("show");

  $(".discover").on("click", function (e) {
    $(".main-container").removeClass("show");
    $(".main-container").scrollTop(0);
  });
  $(".trending").on("click", function (e) {
    $(".main-container").addClass("show");
    $(".main-container").scrollTop(0);
    $(".sidebar-link").removeClass("is-active");
    $(".trending").addClass("is-active");
  });
});