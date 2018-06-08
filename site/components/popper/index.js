$("[popshow='true']").hover(() => {
  var pos = $(this).getBoundingClientRect();
  var left = pos.left;
  var top = pos.top+30;
  $('.popover').css({
    'left': left,
    'top': top 
  })
})