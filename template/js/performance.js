const Store = require('electron-store');
const store = new Store();
const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on("gpus", function(e,d) {
  if (d == "ok") {
    updateGPUs();
  }
})

var selected = [];
updateGPUs();

$(".list-group-item").click(function() {
  $(this).toggleClass("active");
  var idx = $.inArray($(this).attr('id'), selected);
  if (idx == -1) {
    selected.push($(this).attr('id'));
  } else {
    selected.splice(idx, 1);
  }
  if (selected.length > 0) {
    $("#benchmark").removeClass("disabled");
  } else if (!$("#benchmark").hasClass("disabled")){
    $("#benchmark").addClass("disabled")
  }
})

var ProgressBar = require('progressbar.js')
var bar = new ProgressBar.Circle($("#progress")[0], {
  color: '#aaa',
  strokeWidth: 10,
  trailWidth: 1,
  easing: 'easeInOut',
  duration: 1400,
  text: {
    autoStyleContainer: false
  },
  from: { color: '#f7b733', width: 1 },
  to: { color: '#4abdac', width: 10 },
  step: function(state, circle) {
    circle.path.setAttribute('stroke', state.color);
    circle.path.setAttribute('stroke-width', state.width);

    var value = Math.round(circle.value() * 100);
    if (value === 0) {
      circle.setText('');
    } else {
      circle.setText(value);
    }

  }
});
bar.text.style.fontSize = '2rem';

$("#benchmark").click(function() {
  if ($(this).hasClass("disabled")) {
    return false;
  }
  $(".loadpopup").removeClass("hidden");
  bar.animate(1.0);
  // TODO: Add actual benchmark and reload page then.
})

$("#cancel_bench").click(function() {
  bar.animate(0, function() {
    $(".loadpopup").addClass("hidden");
  });
})

function updateGPUs() {
  var gpus = store.get('gpus');
  if(gpus !== undefined && gpus.length > 0) {
    $("#gpuList").html("");
  }
  for (var id in gpus) {
    var dis = 'disabled';
    if (typeof store.get('bench') !== 'undefined' && typeof store.get('bench')[id] !== 'undefined') {
      dis = ""
    }
    $("#gpuList").append("<a href='#' class='list-group-item list-group-item-action' id='gpuid_"+id+"'>"+gpus[id]+"<span class='pull-right'><button class='btn btn-xs secondary "+dis+"'>Stats</button></span></a>")
  }
}
