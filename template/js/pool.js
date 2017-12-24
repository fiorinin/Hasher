const Store = require('electron-store');
const store = new Store();

var pools = store.get("config").pools;
var selectedPools = store.get("selectedPools");
for (var id in pools) {
  var pool = pools[id];
  var checked = ""
  if (selectedPools.indexOf(id) !== -1) {
    checked = "checked";
  }
  $("#poolList").append("<li class='list-group-item' id='listid_"+id+"'><a href='"+pool.home_URL+"'>"+pool.name+"</a><span class='pull-right'><div class='pretty p-icon p-jelly p-plain'><input class='pool' id='poolid_"+id+"' type='checkbox' "+checked+"/><div class='state p-primary-o'><i class='icon glyphicon glyphicon-star'></i><label></label></div></div></span></li>");
  var langs = store.get("langPools")[id];
  if(pool.regions > 0) {
    $("#listid_"+id).append("<span class='regions' id='regionid_"+id+"'>Regions:&nbsp;</span>");
    for(var lid in pool.regions) {
      var lcheck = "";
      if(langs[lid] == 1) {
        lcheck = "checked";
      }
      $("#regionid_"+id).append("<div class='pretty p-icon p-jelly'><input class='region' id='"+id+"_"+lid+"' type='radio' name='"+pool.name+"' "+lcheck+"/><div class='state p-primary-o'><i class='icon glyphicon glyphicon-home'></i><label>"+pool.regions[lid][0]+"</label></div></div>");
    }
  }
}

// Open links in browser
const shell = require('electron').shell;
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

$(".pool").change(function() {
  var poolid = $(this).attr("id").replace("poolid_", "");
  var idx = selectedPools.indexOf(poolid);
  if ($(this).is(':checked')) {
    if (idx === -1) {
      selectedPools.push(poolid);
    }
  } else {
    if (idx !== -1) {
      selectedPools.splice(idx, 1);
    }
  }
  store.set("selectedPools", selectedPools);
})

$(".region").change(function() {
  var langPools = store.get("langPools");
  var sp = $(this).attr('id').split("_");
  var poolid = parseInt(sp[0]);
  var langid = parseInt(sp[1]);
  for (var lid in langPools[poolid]) {
    if(lid == langid && $(this).is(":checked")) {
      langPools[poolid][lid] = 1;
    } else {
      langPools[poolid][lid] = 0;
    }
  }
  store.set("langPools", langPools);
})
