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
    selectOutField
  
  for (i = 0; i < timestamps.length; i++) {
    timestamp = timestamps[i]
    date = new Date(parseInt(timestamp.attributes["data-unixtime"].value, 10) * 1000)
    label = (date.getHours() > 12 ? date.getHours() - 12 : date.getHours())
    label += ":" + (date.getMinutes() < 10 ? "0" : "") + date.getMinutes()
    label += (date.getHours() >= 12 ? "PM" : "AM")
    timestamp.innerHTML = label
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
})()
