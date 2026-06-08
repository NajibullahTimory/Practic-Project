// ---- DATA ----
let items = [
  {
    day: "Saturday",
    time: "7 - 10",
    work: "Pray, eat, bath",
    photo: "./img/g.jpg"
  }
]

// ---- PANEL ----
function openPanel() {
  document.getElementById("panel").style.display = "block"
}

function closePanel() {
  document.getElementById("panel").style.display = "none"
}

// ---- BACKGROUND ----
function setBg(imageUrl) {
  document.body.style.background = "url('" + imageUrl + "') center/cover no-repeat fixed"
}

// ---- SHOW CARDS ----
function showCards() {
  let container = document.getElementById("cards")

  if (items.length === 0) {
    container.innerHTML = '<div class="empty">No tasks yet. Click ⚙ Settings to add one!</div>'
    return
  }

  container.innerHTML = ""

  for (let i = 0; i < items.length; i++) {
    let item = items[i]

    // image or placeholder
    let imgHtml = ""
    if (item.photo) {
      imgHtml = '<img src="' + item.photo + '" alt="photo">'
    } else {
      imgHtml = '<div class="card-no-img">📅</div>'
    }

    // build the card
    let cardHtml = `
      <div class="card">
        ${imgHtml}
        <div class="card-body">
          <button class="card-delete" onclick="deleteTask(${i})">✕</button>
          <div class="card-day">${item.day}</div>
          <div class="card-time">⏰ ${item.time}</div>
          <div class="card-work">${item.work}</div>
        </div>
      </div>
    `

    container.innerHTML += cardHtml
  }
}

// ---- ADD TASK ----
function addTask() {
  let day   = document.getElementById("day").value
  let time  = document.getElementById("time").value
  let work  = document.getElementById("work").value
  let photo = document.getElementById("photo").value

  if (day === "") {
    alert("Please enter a day!")
    return
  }

  items.push({
    day:   day,
    time:  time || "—",
    work:  work || "No description",
    photo: photo
  })

  // clear inputs
  document.getElementById("day").value   = ""
  document.getElementById("time").value  = ""
  document.getElementById("work").value  = ""
  document.getElementById("photo").value = ""

  showCards()
  closePanel()
}

// ---- DELETE TASK ----
function deleteTask(index) {
  items.splice(index, 1)
  showCards()
}

// ---- START ----
showCards()