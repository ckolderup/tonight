(function(){

  (function(){
    var localizedTimestamp = function(o) {
      var date = new Date(parseInt(o.attributes["data-unixtime"].value, 10) * 1000);
      var label = (date.getHours() > 12 ? date.getHours() - 12 : date.getHours());
      label += ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes();
      label += (date.getHours() >= 12 ? "PM" : "AM");
      return label;
    };
    
    (function(){
      var timestamps = document.getElementsByClassName("timestamp");
      for (var i = 0; i < timestamps.length; i++) {
        var timestamp = timestamps[i];
        timestamp.innerHTML = localizedTimestamp(timestamp);
      }
    }());

    (function(){
      var inputTitle = document.getElementById("input-title");
      var inputIdx = inputTitle.title.lastIndexOf(" ") + 1;
      if (-1 != inputIdx) {
        var inputPrefix = inputTitle.title.substr(0, inputIdx);
        inputTitle.title = inputPrefix + localizedTimestamp(inputTitle);
      }
    }());
  }());

  (function(){
    var copyLink = document.querySelector("a[href='/copy']");
    var selectOutField = function(e) {
      if (e && e.target && e.target.nodeName == "H2") return;
      var side = (e && e.target && e.target.className) || "out",
        responders = document.querySelector(".responders." + side);
      if (copyLink) copyLink.attributes.href.value = "/copy" + (side === "out" ? "#out" : "");
      (responders.nodeName === "TEXTAREA" ? responders : document.querySelector("." + side + " form.add input")).select();
    }
    if (location.hash === "#out") selectOutField();
    var title = document.querySelector("h2");
    title && (title.onclick = selectOutField);
  }());
    
  (function(){
    var resetOutButtonState = function() {
      var out = document.querySelector(".out form.add button");
      if (this.value == "") {
        out.setAttribute('disabled', 'disabled');
      } else {
        out.removeAttribute('disabled');
      }
    };

    var name = document.querySelector(".out form.add input#name");

    name.onkeyup = resetOutButtonState;
    name.onkeyup();
  }());
})();
