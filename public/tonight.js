(function(){
  var
    offset = (new Date()).getTimezoneOffset() / -60 * 1000,
    timestamps = document.getElementsByClassName("timestamp"),
    i,
    timestamp,
    date,
    label,
    title = document.querySelector("h2"),
    copyLink = document.querySelector("a[href='/copy']"),
    inputTitle = document.getElementById("input-title"),
    inputIdx,
    inputPrefix,
    localizedTimestamp,
    selectOutField

  localizedTimestamp = function(o) {
    date = new Date(parseInt(o.attributes["data-unixtime"].value, 10) * 1000)
    label = (date.getHours() > 12 ? date.getHours() - 12 : date.getHours())
    label += ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes()
    label += (date.getHours() >= 12 ? "PM" : "AM")
    return label
  }
  
  for (i = 0; i < timestamps.length; i++) {
    timestamp = timestamps[i]
    timestamp.innerHTML = localizedTimestamp(timestamp)
  }

  inputIdx = inputTitle.title.lastIndexOf(" ") + 1;
  if (-1 != inputIdx) {
    inputPrefix = inputTitle.title.substr(0, inputIdx);
    date = new Date(parseInt(inputTitle.attributes["data-unixtime"].value, 10) * 1000)
    inputTitle.title = inputPrefix + localizedTimestamp(inputTitle)
  }
  
  selectOutField = function(e) {
    if (e && e.target && e.target.nodeName == "H2") return;
    var
      side = (e && e.target && e.target.className) || "out",
      responders = document.querySelector(".responders." + side)

    if (copyLink) copyLink.attributes.href.value = "/copy" + (side === "out" ? "#out" : "")
    ;(responders.nodeName === "TEXTAREA" ? responders : document.querySelector("." + side + " form.add input"))
      .select()
  }
  
  if (location.hash === "#out") selectOutField()

  title && (title.onclick = selectOutField)

  
  resetOutButtonState = function() {
    var out = document.querySelector(".out form.add button")
    if (this.value == "") {
      out.setAttribute('disabled', 'disabled')
    } else {
      out.removeAttribute('disabled')
    }
  }
  
  var name = document.querySelector(".out form.add input#name")

  name.onkeyup = resetOutButtonState
  name.onkeyup()
})()
