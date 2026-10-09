# 🏨 Hostel Room Allocation Management System

A production-style college hostel management portal powered by **Python Flask** and demonstrating the **FIFO (First-In, First-Out) Queue Data Structure** using Python's `collections.deque`.

---

## 📌 Main Concept & Requirement

In college hostels, fairness requires that students receive rooms in the exact order of their arrival and registration. When all hostel rooms are occupied, incoming students must be placed into a **Waiting Queue**. When any occupied room is cancelled or vacated, the first student waiting in line must **automatically receive that room**.

This project implements and visualizes this exact workflow using the **Queue Data Structure** (`collections.deque`).

---

## 🎨 Theme & UI Architecture

Designed with a professional **Red + Blue** color theme inspired by premier university administration portals:
* **Dark Blue (`#0B1F3A`)**: Navigation headers, branding, and dark cards.
* **Blue (`#1565C0`)**: Available room indicators, primary actions, and active navigation.
* **Light Blue (`#E3F2FD`)**: Informational chips, accent backgrounds.
* **Red (`#D32F2F`)**: Occupied rooms, cancellation warnings, and first-in-line alerts.
* **Light Red (`#FFEBEE`)**: Dequeue notices and occupied badges.
* **White (`#FFFFFF`) & Light Gray (`#F5F7FA`)**: Background canvas and cards.

---

## 🧠 Data Structure Implementation

```python
from collections import deque

# Available hostel rooms queue (FIFO)
available_rooms = deque(["A101", "A102", "A103", ..., "A110"])

# Student waiting queue when all rooms are occupied (FIFO)
waiting_queue = deque()

# List of currently allocated students
allocated_students = []
```

### Queue Operations Mapping

| Operation | Python Method | Time Complexity | Role in System |
|---|---|---|---|
| **Enqueue** | `waiting_queue.append(student)` | **O(1)** | Adds newly registered student to **REAR** when all rooms are occupied |
| **Dequeue** | `waiting_queue.popleft()` | **O(1)** | Removes student from **FRONT** to assign released room |
| **Peek** | `waiting_queue[0]` | **O(1)** | Inspects next student in line without removing them |
| **isEmpty** | `len(waiting_queue) == 0` | **O(1)** | Checks if anyone is waiting when a room becomes vacant |

> **Viva Note:** Unlike Python `list.pop(0)` which is $O(n)$ because it shifts all remaining elements in memory, `collections.deque.popleft()` is strictly **$O(1)$** because it is built upon a doubly-linked memory block.

---

## 🖥️ System Sections & Features

1. **Dashboard Overview**:
   * Live statistics cards: Total Rooms, Available Rooms, Occupied Rooms, Waiting Queue Size, and Total Allocated Students.
   * Visual Queue pipeline preview showing `FRONT ↓` and `↑ REAR`.
   * Real-time activity audit stream.

2. **Student Registration**:
   * Form capturing: Student ID, Student Name, Department, Year, Phone Number, Gender, and Preferred Room Type.
   * Auto-fill sample student buttons for rapid testing.
   * If rooms are available: assigns next room via `available_rooms.popleft()`.
   * If all rooms are full: enqueues student via `waiting_queue.append()`.

3. **Room Allocation Master Table**:
   * Displays all rooms with status badges: **Blue (Available)** and **Red (Occupied)**.
   * Shows resident Student ID, Name, Department, and quick action buttons.

4. **Waiting Queue (Core Visualizer)**:
   * Visual queue flow pipe showing connected nodes:
     ```text
     FRONT (Head)
       ↓
     23CS011  ➔  23CS012  ➔  23CS013
                               ↑
                              REAR (Tail)
     ```
   * Waiting roster table with 1-based positions, student details, and registration timestamps.
   * Displays the core rule: **FIFO Queue — First Registered Student Gets Room First**.

5. **Cancel Room Allocation**:
   * Allows searching by Student ID or Room Number to cancel a booking.
   * Automatically executes:
     1. Removes student from `allocated_students`.
     2. Checks if `waiting_queue` has students.
     3. If yes: dequeues student with `waiting_queue.popleft()` and assigns the freed room immediately.
     4. If no: returns room to `available_rooms.append(room)`.

6. **Search Student / Room**:
   * Real-time search across allocated students, waiting queue, and vacant rooms.
   * Shows exact queue position if student is waiting.

7. **Hostel Room Status (Visual Cards Grid)**:
   * Interactive cards for rooms `A101` through `A110`.
   * Filterable by: **All Rooms**, **Available Only**, and **Occupied Only**.

8. **Academic / Viva Voce Section**:
   * Complete theoretical breakdown of the Queue Data Structure.
   * Complexity analysis table comparing `deque` vs Python `list`.
   * Viva questions and model answers.

9. **Demo Scenario Tester (1-Click Test)**:
   * 1-click button to load the exact prompt scenario:
     * 10 rooms available $\rightarrow$ Students 1 to 10 allocated to `A101` to `A110`.
     * Student 11 and Student 12 placed in Waiting Queue.
   * 1-click button to cancel Room `A101`, demonstrating instant automatic allocation of `A101` to Student 11!

---

## 📁 Project Directory Structure

```text
Hostel-Room-Allocation-System/
│
├── app.py                     # Flask application & FIFO Queue logic
├── requirements.txt           # Python dependencies (Flask, Werkzeug)
├── README.md                  # Complete documentation & guide
│
├── templates/
│   ├── login.html             # Admin login portal with demo autofill
│   └── dashboard.html         # Main unified dashboard with all 8 views
│
└── static/
    ├── css/
    │   └── style.css          # Red + Blue college management design system
    ├── js/
    │   └── script.js          # Dynamic DOM rendering, Queue visualizer & APIs
    └── images/
```

---

## 🚀 How to Run Locally

### Prerequisites
* Python 3.8 or higher installed on your computer.

### Step 1: Open Terminal / Command Prompt
Navigate to the project folder:
```bash
cd "C:\Users\acer\.gemini\antigravity\scratch\Hostel-Room-Allocation-System"
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Start the Flask Application
```bash
python app.py
```

You should see output similar to:
```text
🏨 Starting Hostel Room Allocation System...
📍 URL: http://127.0.0.1:5000
🔑 Login: admin / admin123
 * Running on http://127.0.0.1:5000
```

### Step 4: Open in Web Browser
Open your browser and visit:
```text
http://127.0.0.1:5000
```

---

## 🔑 Admin Login Credentials

* **Username:** `admin`
* **Password:** `admin123`

*(The login page includes a **⚡ Auto-Fill Credentials** button for instant one-click login)*

---

## 🧪 Testing the Required Scenario

To verify the test scenario:

1. Log in to the system.
2. In the topbar or sidebar, click **Demo Scenario Tester** (or **Quick Test Scenario**).
3. Click **"1️⃣ Load Test Scenario (10 Allocated + 2 Waiting)"**:
   * All 10 rooms (`A101` to `A110`) are assigned to Student 1 through Student 10.
   * Student 11 is placed in **Waiting Queue Position #1**.
   * Student 12 is placed in **Waiting Queue Position #2**.
4. Go to the **Waiting Queue** tab to view the live queue topology showing:
   $$\text{FRONT} \downarrow \text{ Student 11} \longrightarrow \text{Student 12 } \uparrow \text{REAR}$$
5. Now, go back to the tester and click **"2️⃣ Cancel Room A101"** (or use the **Cancel Allocation** tab):
   * Room `A101` is released from Student 1.
   * System detects the waiting queue.
   * **Student 11 automatically receives Room A101**.
   * Waiting Queue is updated to contain only **Student 12** at Position #1!

---

## 🎓 Academic Viva Voce Questions & Answers

### Q1: Why is Queue chosen over Stack or Array for room allocation?
**Answer:**
Room allocation must guarantee fairness: the student who applies first should get a room first. A **Queue** adheres to the **FIFO (First In, First Out)** principle, ensuring zero bias. A Stack would follow LIFO (Last In, First Out), giving rooms to the newest applicant first, which is unfair.

### Q2: Why use `collections.deque` instead of Python `list`?
**Answer:**
In a standard Python list, removing the first item (`list.pop(0)`) takes $O(n)$ time because all remaining $n-1$ items must be shifted left in contiguous memory. `collections.deque` is implemented as a doubly-linked list of blocks, providing true **$O(1)$ constant time** for `popleft()` and `append()`.

### Q3: How does automatic reallocation work upon cancellation?
**Answer:**
When an allocated student cancels:
1. The student is removed from the `allocated_students` list.
2. The system checks `if len(waiting_queue) > 0:`.
3. If true, `waiting_queue.popleft()` extracts the front student and assigns them the vacated room immediately.
4. If the waiting queue is empty, the room is appended back to `available_rooms`.

---

## 📄 License
Academic Mini-Project — Created for demonstration of Data Structures in Python.
