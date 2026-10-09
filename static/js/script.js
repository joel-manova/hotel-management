/**
 * ==============================================================================
 * 🏨 Hostel Room Allocation Management System - Frontend Controller
 * ==============================================================================
 * Handles:
 * - Dynamic FIFO Queue visualization updates (Front -> ... -> Rear)
 * - Async API communication (Register, Cancel, Search, Reset, Test Scenario)
 * - Responsive sidebar navigation and tab switching
 * - Toast notification dispatching (Blue for success, Red for cancel/error)
 * ==============================================================================
 */

// Toast notification dispatcher
function showToast(title, message, type = "blue", duration = 5000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconSymbol = type === "blue" ? "✅" : (type === "red" ? "⚠️" : "ℹ️");

  toast.innerHTML = `
    <div class="toast-icon">${iconSymbol}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

// Global UI State
let currentTab = "dashboard";

// DOM Ready initialization
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initRegistrationForm();
  initCancellationForm();
  initSearch();
  initQuickScenarioButtons();
  initRoomFilters();
  refreshDashboardData(); // Initial live pull
});

// ==============================================================================
// NAVIGATION & SIDEBAR
// ==============================================================================
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav-link-btn");
  const sections = document.querySelectorAll(".view-section");
  const topbarTitle = document.getElementById("topbar-page-title");
  const mobileToggle = document.getElementById("mobileToggle");
  const sidebar = document.getElementById("sidebar");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute("data-tab");
      switchTab(targetTab);

      // Close mobile sidebar if open
      if (window.innerWidth <= 992 && sidebar) {
        sidebar.classList.remove("show");
      }
    });
  });

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener("click", () => {
      sidebar.classList.toggle("show");
    });
  }

  // Handle URL hash if present
  const hash = window.location.hash.replace("#", "");
  if (hash && document.getElementById(`section-${hash}`)) {
    switchTab(hash);
  }
}

function switchTab(tabId) {
  currentTab = tabId;
  const navLinks = document.querySelectorAll(".nav-link-btn");
  const sections = document.querySelectorAll(".view-section");
  const topbarTitle = document.getElementById("topbar-page-title");

  navLinks.forEach(link => {
    if (link.getAttribute("data-tab") === tabId) {
      link.classList.add("active");
      if (topbarTitle) {
        topbarTitle.textContent = link.querySelector(".nav-text")?.textContent || "Dashboard";
      }
    } else {
      link.classList.remove("active");
    }
  });

  sections.forEach(sec => {
    if (sec.id === `section-${tabId}`) {
      sec.classList.add("active");
    } else {
      sec.classList.remove("active");
    }
  });

  window.location.hash = tabId;
}

// ==============================================================================
// REGISTRATION FORM LOGIC (FIFO ENQUEUE OR IMMEDIATE ALLOCATION)
// ==============================================================================
function initRegistrationForm() {
  const regForm = document.getElementById("studentRegistrationForm");
  if (!regForm) return;

  regForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = regForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = "Processing Queue...";
    submitBtn.disabled = true;

    const payload = {
      student_id: document.getElementById("reg_student_id").value.trim(),
      student_name: document.getElementById("reg_student_name").value.trim(),
      dept: document.getElementById("reg_dept").value,
      year: document.getElementById("reg_year").value,
      phone: document.getElementById("reg_phone").value.trim(),
      gender: document.getElementById("reg_gender").value,
      pref_type: document.getElementById("reg_pref_type").value
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (data.success) {
        if (data.status === "ALLOCATED") {
          showToast(
            "Room Allocated Successfully",
            `Student registered successfully.\nRoom ${data.room} allocated.`,
            "blue"
          );
        } else {
          showToast(
            "Added to Waiting Queue",
            `All rooms are occupied.\nStudent added to waiting queue (Position #${data.position}).`,
            "red"
          );
        }
        regForm.reset();
        // Generate new random ID placeholder suggestion
        updateQuickFillSuggestion();
        applySystemSnapshot(data.snapshot);
      } else {
        showToast("Registration Failed", data.message || "Could not register student.", "red");
      }
    } catch (err) {
      console.error("Registration error:", err);
      showToast("Error", "Network or server connection error.", "red");
    } finally {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

// Helper to fill sample student quickly
window.fillSampleStudent = function (sampleNo) {
  const sampleData = {
    1: { id: "23CS061", name: "Vikram Seth", dept: "CSE", year: "2nd Year", phone: "9876543221", gender: "Male", pref_type: "2 Sharing" },
    2: { id: "23IT072", name: "Meera Nair", dept: "IT", year: "3rd Year", phone: "9876543222", gender: "Female", pref_type: "Single" },
    3: { id: "23EC083", name: "Siddharth Rao", dept: "ECE", year: "1st Year", phone: "9876543223", gender: "Male", pref_type: "3 Sharing" },
    4: { id: "23CS094", name: "Aishwarya Rai", dept: "CSE", year: "4th Year", phone: "9876543224", gender: "Female", pref_type: "2 Sharing" }
  };

  const selected = sampleData[sampleNo] || sampleData[1];
  document.getElementById("reg_student_id").value = selected.id;
  document.getElementById("reg_student_name").value = selected.name;
  document.getElementById("reg_dept").value = selected.dept;
  document.getElementById("reg_year").value = selected.year;
  document.getElementById("reg_phone").value = selected.phone;
  document.getElementById("reg_gender").value = selected.gender;
  document.getElementById("reg_pref_type").value = selected.pref_type;

  showToast("Form Auto-Filled", `Loaded sample data for ${selected.name}`, "blue", 2000);
};

function updateQuickFillSuggestion() {
  const idInput = document.getElementById("reg_student_id");
  if (idInput && !idInput.value) {
    const randomNum = Math.floor(100 + Math.random() * 900);
    idInput.placeholder = `e.g. 23CS${randomNum}`;
  }
}

// ==============================================================================
// CANCELLATION FORM LOGIC (FIFO DEQUEUE AUTOMATIC ALLOCATION)
// ==============================================================================
function initCancellationForm() {
  const cancelForm = document.getElementById("cancellationForm");
  if (!cancelForm) return;

  cancelForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const identifier = document.getElementById("cancel_identifier").value.trim();
    if (!identifier) {
      showToast("Required", "Please enter a Student ID or Room Number.", "red");
      return;
    }
    await triggerCancellation(identifier);
    cancelForm.reset();
  });
}

// Trigger cancellation from any button (table, room card, modal)
window.triggerCancellation = async function (identifier) {
  if (!confirm(`Are you sure you want to cancel the allocation for "${identifier}"?`)) {
    return;
  }

  try {
    const response = await fetch("/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier })
    });
    const data = await response.json();

    if (data.success) {
      if (data.action === "REALLOCATED") {
        showToast(
          "Allocation Cancelled & Auto-Reassigned!",
          `Room ${data.released_room} has been released.\n\nWaiting Queue processed:\n${data.reallocated_student.id} (${data.reallocated_student.name}) → Room ${data.released_room} allocated.`,
          "blue",
          7000
        );
      } else if (data.action === "FREED") {
        showToast(
          "Room Released",
          `Room ${data.released_room} has been released and is now Available.\n(Waiting queue is empty)`,
          "red",
          5000
        );
      } else {
        showToast("Updated", data.message, "blue");
      }
      applySystemSnapshot(data.snapshot);
    } else {
      showToast("Cancellation Failed", data.message || "Failed to cancel allocation.", "red");
    }
  } catch (err) {
    console.error("Cancellation error:", err);
    showToast("Error", "Network or server connection error.", "red");
  }
};

// ==============================================================================
// LIVE SEARCH LOGIC
// ==============================================================================
function initSearch() {
  const searchInput = document.getElementById("searchQueryInput");
  const searchBtn = document.getElementById("searchSubmitBtn");
  const resultsContainer = document.getElementById("searchResultsArea");

  if (!searchInput || !resultsContainer) return;

  const performSearch = async () => {
    const query = searchInput.value.trim();
    if (!query) {
      resultsContainer.innerHTML = `
        <div class="queue-empty-box">
          <div class="icon">🔍</div>
          <p>Enter a Student ID, Student Name, or Room Number to search.</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = "<p style='text-align:center; padding:20px; color:#64748B;'>Searching system records...</p>";

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.found && data.results.length > 0) {
        let html = `<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px;">`;

        data.results.forEach(res => {
          if (res.category === "ALLOCATED") {
            html += `
              <div class="stat-card card-red" style="flex-direction:column; align-items:flex-start;">
                <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:8px;">
                  <span class="badge badge-occupied">ALLOCATED</span>
                  <strong style="color:var(--color-dark-blue); font-size:16px;">Room ${res.room}</strong>
                </div>
                <h4 style="font-size:16px; margin-bottom:4px;">${res.name}</h4>
                <p style="font-size:13px; color:var(--color-text-muted);">ID: <strong>${res.student_id}</strong> | Dept: ${res.dept}</p>
                <p style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">Type: ${res.room_type} | Year: ${res.year}</p>
                <div style="margin-top:12px; width:100%;">
                  <button class="btn btn-outline-danger btn-sm btn-block" onclick="triggerCancellation('${res.student_id}')">Cancel Allocation</button>
                </div>
              </div>
            `;
          } else if (res.category === "WAITING") {
            html += `
              <div class="stat-card card-warning" style="flex-direction:column; align-items:flex-start;">
                <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:8px;">
                  <span class="badge" style="background:#FFF3E0; color:#E65100; border:1px solid #FFE0B2;">IN WAITING QUEUE</span>
                  <span class="badge badge-pos badge-pos-first" style="font-size:11px;">Pos #${res.queue_position}</span>
                </div>
                <h4 style="font-size:16px; margin-bottom:4px;">${res.name}</h4>
                <p style="font-size:13px; color:var(--color-text-muted);">ID: <strong>${res.student_id}</strong> | Dept: ${res.dept}</p>
                <p style="font-size:12px; color:var(--color-text-muted); margin-top:4px;">Queue Position: <strong>#${res.queue_position}</strong> (FIFO Order)</p>
                <div style="margin-top:12px; width:100%;">
                  <button class="btn btn-outline-danger btn-sm btn-block" onclick="triggerCancellation('${res.student_id}')">Remove From Queue</button>
                </div>
              </div>
            `;
          } else {
            html += `
              <div class="stat-card card-blue" style="flex-direction:column; align-items:flex-start;">
                <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:8px;">
                  <span class="badge badge-available">AVAILABLE ROOM</span>
                  <strong style="color:var(--color-blue); font-size:16px;">${res.room}</strong>
                </div>
                <h4 style="font-size:16px; margin-bottom:4px;">Room ${res.room}</h4>
                <p style="font-size:13px; color:var(--color-text-muted);">Type: <strong>${res.room_type}</strong></p>
                <p style="font-size:12px; color:#2E7D32; margin-top:4px;">Status: Vacant & Ready for next registrant</p>
              </div>
            `;
          }
        });

        html += `</div>`;
        resultsContainer.innerHTML = html;
      } else {
        resultsContainer.innerHTML = `
          <div class="queue-empty-box">
            <div class="icon">❌</div>
            <p>No student or room found matching "<strong>${query}</strong>".</p>
          </div>
        `;
      }
    } catch (err) {
      console.error("Search error:", err);
      resultsContainer.innerHTML = `<p style="color:red; text-align:center;">Error fetching search results.</p>`;
    }
  };

  if (searchBtn) searchBtn.addEventListener("click", performSearch);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") performSearch();
  });
}

// ==============================================================================
// 1-CLICK DEMO SCENARIO TESTER
// ==============================================================================
function initQuickScenarioButtons() {
  const loadScenarioBtn = document.getElementById("btnLoadTestScenario");
  const resetBtn = document.getElementById("btnResetDefault");
  const quickCancelA101Btn = document.getElementById("btnQuickCancelA101");

  if (loadScenarioBtn) {
    loadScenarioBtn.addEventListener("click", async () => {
      try {
        const resp = await fetch("/api/load-scenario", { method: "POST" });
        const res = await resp.json();
        showToast("Test Scenario Loaded!", res.message, "blue", 6000);
        applySystemSnapshot(res.snapshot);
        switchTab("queue");
      } catch (e) {
        showToast("Error", "Could not load test scenario.", "red");
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      try {
        const resp = await fetch("/api/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "default" })
        });
        const res = await resp.json();
        showToast("System Reset", "Restored to standard demo state.", "blue");
        applySystemSnapshot(res.snapshot);
      } catch (e) {
        showToast("Error", "Could not reset system.", "red");
      }
    });
  }

  if (quickCancelA101Btn) {
    quickCancelA101Btn.addEventListener("click", async () => {
      await triggerCancellation("A101");
    });
  }
}

// ==============================================================================
// ROOM FILTER BUTTONS (ALL / AVAILABLE / OCCUPIED)
// ==============================================================================
function initRoomFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");

      const roomCards = document.querySelectorAll(".room-card");
      roomCards.forEach(card => {
        if (filter === "all") {
          card.style.display = "block";
        } else if (filter === "available") {
          card.style.display = card.classList.contains("status-available") ? "block" : "none";
        } else if (filter === "occupied") {
          card.style.display = card.classList.contains("status-occupied") ? "block" : "none";
        }
      });
    });
  });
}

// ==============================================================================
// SYSTEM STATE REFRESH & DOM SYNC
// ==============================================================================
async function refreshDashboardData() {
  try {
    const response = await fetch("/api/status");
    if (response.ok) {
      const data = await response.json();
      applySystemSnapshot(data);
    }
  } catch (err) {
    console.warn("Could not pull live status update:", err);
  }
}

function applySystemSnapshot(snapshot) {
  if (!snapshot) return;

  const { metrics, waiting_queue, allocated_students, all_rooms, activity_log } = snapshot;

  // 1. Update Metric Cards
  if (metrics) {
    updateElementText("metricTotalRooms", metrics.total_rooms);
    updateElementText("metricAvailableRooms", metrics.available_rooms_count);
    updateElementText("metricOccupiedRooms", metrics.occupied_rooms_count);
    updateElementText("metricWaitingCount", metrics.waiting_count);
    updateElementText("metricTotalAllocated", metrics.total_allocated_students);

    // Sidebar counter badges
    updateElementText("badgeWaitingCountSidebar", metrics.waiting_count);
    updateElementText("badgeAvailableCountSidebar", metrics.available_rooms_count);
    updateElementText("topbarWaitingPill", `Waiting Queue: ${metrics.waiting_count}`);
  }

  // 2. Render Visual Queue (The Core FIFO Diagram)
  renderVisualQueuePipe(waiting_queue);

  // 3. Render Waiting Queue Table
  renderWaitingQueueTable(waiting_queue);

  // 4. Render Room Allocation Table
  renderRoomAllocationTable(all_rooms);

  // 5. Render Room Cards Grid
  renderRoomCardsGrid(all_rooms);

  // 6. Render Activity Log
  renderActivityLog(activity_log);
}

function updateElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ==============================================================================
// DYNAMIC DOM RENDERING FUNCTIONS
// ==============================================================================

/**
 * Renders the Visual Queue pipe:
 * FRONT ↓ [Student 11] -> [Student 12] -> ... ↑ REAR
 */
function renderVisualQueuePipe(queue) {
  const pipeContainer = document.getElementById("queueVisualPipe");
  if (!pipeContainer) return;

  if (!queue || queue.length === 0) {
    pipeContainer.innerHTML = `
      <div class="queue-empty-box">
        <div class="icon">✨</div>
        <p>Waiting Queue is currently empty. All registered students have received rooms!</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="queue-diagram-layout">
      <!-- FRONT INDICATOR -->
      <div class="queue-end-marker front-marker">
        <div>FRONT (Head)</div>
        <div style="font-size:16px;">↓</div>
        <div style="font-size:10px; color:#B71C1C;">Next Room Recipient (popleft)</div>
      </div>

      <!-- QUEUE NODES CHAIN -->
      <div class="queue-node-chain">
  `;

  queue.forEach((student, index) => {
    const isFirst = index === 0;
    const isLast = index === queue.length - 1;

    html += `
      <div class="queue-node ${isFirst ? 'node-first' : ''}">
        <span class="queue-node-pos">#${student.position}</span>
        <div class="queue-node-id">${student.id}</div>
        <div class="queue-node-name" title="${student.name}">${student.name}</div>
        <div class="queue-node-dept">${student.dept}</div>
      </div>
    `;

    // Arrow connector between nodes
    if (!isLast) {
      html += `<div class="queue-arrow">➔</div>`;
    }
  });

  html += `
      </div>

      <!-- REAR INDICATOR -->
      <div class="queue-end-marker rear-marker">
        <div>REAR (Tail)</div>
        <div style="font-size:16px;">↑</div>
        <div style="font-size:10px; color:#0D47A1;">New Registrations Enter (append)</div>
      </div>
    </div>
  `;

  pipeContainer.innerHTML = html;
}

/**
 * Renders the Waiting Queue Table
 */
function renderWaitingQueueTable(queue) {
  const tbody = document.getElementById("waitingQueueTableBody");
  if (!tbody) return;

  if (!queue || queue.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px; color:#64748B;">
          No students currently in the waiting list.
        </td>
      </tr>
    `;
    return;
  }

  let rows = "";
  queue.forEach((item, index) => {
    const isFirst = index === 0;
    rows += `
      <tr>
        <td>
          <span class="badge-pos ${isFirst ? 'badge-pos-first' : ''}">${item.position}</span>
          ${isFirst ? '<span class="badge" style="background:#FFEBEE; color:#D32F2F; margin-left:6px;">Next in Line</span>' : ''}
        </td>
        <td><strong>${item.id}</strong></td>
        <td>${item.name}</td>
        <td><span class="badge" style="background:#E3F2FD; color:#1565C0;">${item.dept}</span></td>
        <td>${item.registered_at || 'Just now'}</td>
        <td>
          <button class="btn btn-outline-danger btn-sm" onclick="triggerCancellation('${item.id}')" title="Remove student from queue">
            Cancel
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rows;
}

/**
 * Renders Room Allocation Table
 */
function renderRoomAllocationTable(rooms) {
  const tbody = document.getElementById("roomAllocationTableBody");
  if (!tbody) return;

  if (!rooms || rooms.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No rooms loaded.</td></tr>`;
    return;
  }

  let rows = "";
  rooms.forEach(r => {
    const isAvail = r.is_available;
    rows += `
      <tr>
        <td><strong>${r.room_no}</strong></td>
        <td>${r.room_type}</td>
        <td>
          <span class="badge ${isAvail ? 'badge-available' : 'badge-occupied'}">
            ${r.status}
          </span>
        </td>
        <td>${isAvail ? '<span style="color:#94A3B8;">-</span>' : `<strong>${r.student_id}</strong>`}</td>
        <td>${isAvail ? '<span style="color:#94A3B8;">Vacant</span>' : r.student_name}</td>
        <td>
          ${isAvail 
            ? `<button class="btn btn-primary btn-sm" onclick="switchTab('register')">Allocate Room</button>`
            : `<button class="btn btn-outline-danger btn-sm" onclick="triggerCancellation('${r.room_no}')">Cancel</button>`
          }
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rows;
}

/**
 * Renders Visual Room Cards Grid (Hostel Room Status)
 */
function renderRoomCardsGrid(rooms) {
  const container = document.getElementById("roomCardsContainer");
  if (!container) return;

  if (!rooms || rooms.length === 0) {
    container.innerHTML = `<p style="padding:20px; color:#64748B;">No rooms found.</p>`;
    return;
  }

  let html = "";
  rooms.forEach(r => {
    const isAvail = r.is_available;
    html += `
      <div class="room-card ${isAvail ? 'status-available' : 'status-occupied'}">
        <div class="room-card-head">
          <div class="room-no-title">${r.room_no}</div>
          <span class="room-meta-pill">${r.room_type}</span>
        </div>

        <div class="room-status-badge ${isAvail ? 'badge-available' : 'badge-occupied'}">
          ${isAvail ? '● Available' : '■ Occupied'}
        </div>

        <div class="room-details-list">
          <div class="row-item">
            <span>Location:</span>
            <strong>${r.wing || 'Main Wing'}, ${r.floor || '1st Fl'}</strong>
          </div>
          <div class="row-item">
            <span>Occupant:</span>
            <strong>${isAvail ? 'Vacant' : r.student_id}</strong>
          </div>
          ${!isAvail ? `
            <div class="row-item">
              <span>Name:</span>
              <strong title="${r.student_name}">${r.student_name}</strong>
            </div>
          ` : ''}
        </div>

        <div class="room-card-action">
          ${isAvail
            ? `<button class="btn btn-primary btn-sm btn-block" onclick="switchTab('register')">Allocate Room</button>`
            : `<button class="btn btn-outline-danger btn-sm btn-block" onclick="triggerCancellation('${r.room_no}')">Cancel Allocation</button>`
          }
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Renders Activity Stream
 */
function renderActivityLog(logs) {
  const container = document.getElementById("recentActivityStream");
  if (!container) return;

  if (!logs || logs.length === 0) {
    container.innerHTML = `<p style="color:#94A3B8; font-size:13px;">No recent events.</p>`;
    return;
  }

  let html = "";
  logs.slice(0, 8).forEach(entry => {
    const isDanger = entry.status === "danger";
    const isSuccess = entry.status === "success";
    const dotColor = isDanger ? "#D32F2F" : (isSuccess ? "#2E7D32" : "#1565C0");

    html += `
      <div style="display:flex; gap:12px; margin-bottom:12px; font-size:13px; align-items:flex-start;">
        <span style="width:8px; height:8px; border-radius:50%; background:${dotColor}; margin-top:5px; flex-shrink:0;"></span>
        <div style="flex:1;">
          <div style="color:var(--color-text-main); font-weight:500;">${entry.message}</div>
          <div style="color:#94A3B8; font-size:11px; margin-top:2px;">${entry.timestamp}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
