"""
=============================================================================
🏨 Hostel Room Allocation Management System
Backend: Python + Flask
Data Structure: FIFO Queue (collections.deque)
=============================================================================
Description:
    This system implements a First-In, First-Out (FIFO) Queue using Python's
    `collections.deque` to automate student hostel room allocations.

Key Data Structure Logic:
    1. available_rooms: deque of free hostel room numbers.
    2. waiting_queue:   deque of students waiting for a room when full.
    3. allocated_students: list of currently allocated student records.

FIFO Operations:
    - enqueue: waiting_queue.append(student) -> Adds student to REAR (O(1))
    - dequeue: waiting_queue.popleft()       -> Removes student from FRONT (O(1))
    - room alloc: available_rooms.popleft()  -> Takes next available room (O(1))
    - room free: available_rooms.append(room) -> Adds released room back (O(1))
=============================================================================
"""

import datetime
from collections import deque
from functools import wraps
from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash

app = Flask(__name__)
app.secret_key = "hostel_secret_key_queue_demo_2026"

# =============================================================================
# DATA STRUCTURE CORE INITIALIZATION
# =============================================================================

# All defined rooms with their attributes
ROOM_CATALOG = {
    "A101": {"type": "2 Sharing", "floor": "1st Floor", "wing": "East Wing"},
    "A102": {"type": "2 Sharing", "floor": "1st Floor", "wing": "East Wing"},
    "A103": {"type": "3 Sharing", "floor": "1st Floor", "wing": "East Wing"},
    "A104": {"type": "2 Sharing", "floor": "1st Floor", "wing": "West Wing"},
    "A105": {"type": "Single",    "floor": "1st Floor", "wing": "West Wing"},
    "A106": {"type": "2 Sharing", "floor": "2nd Floor", "wing": "East Wing"},
    "A107": {"type": "3 Sharing", "floor": "2nd Floor", "wing": "East Wing"},
    "A108": {"type": "2 Sharing", "floor": "2nd Floor", "wing": "West Wing"},
    "A109": {"type": "Single",    "floor": "2nd Floor", "wing": "West Wing"},
    "A110": {"type": "3 Sharing", "floor": "2nd Floor", "wing": "West Wing"},
}

TOTAL_ROOM_COUNT = len(ROOM_CATALOG)

# The core data structures requested:
# 1. available_rooms: Queue of rooms ready for allocation (FIFO)
available_rooms = deque()

# 2. waiting_queue: Queue of registered students waiting for rooms (FIFO)
waiting_queue = deque()

# 3. allocated_students: List of students currently assigned a room
allocated_students = []

# Audit log of allocation events for visual transparency
activity_log = []


def log_event(event_type, message, status="info", extra=None):
    """Utility to track allocation lifecycle actions."""
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    entry = {
        "timestamp": timestamp,
        "type": event_type,
        "message": message,
        "status": status,
        "extra": extra or {}
    }
    activity_log.insert(0, entry)
    if len(activity_log) > 50:
        activity_log.pop()


def reset_system(initial_scenario="default"):
    """
    Resets the Queue and room state.
    - "empty": All 10 rooms available, 0 waiting.
    - "default": 6 rooms allocated, 4 available, 2 in waiting queue for demo.
    - "full": Exactly 10 rooms allocated, 2 in waiting queue (ready for cancel test!).
    """
    global available_rooms, waiting_queue, allocated_students, activity_log
    
    available_rooms = deque(list(ROOM_CATALOG.keys()))
    waiting_queue = deque()
    allocated_students = []
    activity_log = []

    if initial_scenario == "default":
        # Pre-allocate 6 students
        demo_students = [
            {"id": "23CS001", "name": "Arun Kumar", "dept": "CSE", "year": "3rd Year", "phone": "9876543210", "gender": "Male", "pref_type": "2 Sharing"},
            {"id": "23IT014", "name": "Priya Sharma", "dept": "IT", "year": "2nd Year", "phone": "9876543211", "gender": "Female", "pref_type": "2 Sharing"},
            {"id": "23EC022", "name": "Rahul Verma", "dept": "ECE", "year": "3rd Year", "phone": "9876543212", "gender": "Male", "pref_type": "3 Sharing"},
            {"id": "23ME005", "name": "Sneha Patel", "dept": "MECH", "year": "4th Year", "phone": "9876543213", "gender": "Female", "pref_type": "Single"},
            {"id": "23CS033", "name": "Karthik Raja", "dept": "CSE", "year": "1st Year", "phone": "9876543214", "gender": "Male", "pref_type": "2 Sharing"},
            {"id": "23EE018", "name": "Ananya Roy", "dept": "EEE", "year": "2nd Year", "phone": "9876543215", "gender": "Female", "pref_type": "2 Sharing"},
        ]
        for s in demo_students:
            room = available_rooms.popleft() # FIFO dequeue from available rooms
            alloc_record = {
                **s,
                "room": room,
                "room_type": ROOM_CATALOG[room]["type"],
                "floor": ROOM_CATALOG[room]["floor"],
                "wing": ROOM_CATALOG[room]["wing"],
                "allocated_at": (datetime.datetime.now() - datetime.timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M")
            }
            allocated_students.append(alloc_record)

        # Pre-populate 2 students in waiting queue
        waiting_demos = [
            {"id": "23CS041", "name": "Kavin Raj", "dept": "CSE", "year": "2nd Year", "phone": "9876543216", "gender": "Male", "pref_type": "2 Sharing"},
            {"id": "23IT055", "name": "Divya Nair", "dept": "IT", "year": "3rd Year", "phone": "9876543217", "gender": "Female", "pref_type": "3 Sharing"},
        ]
        for w in waiting_demos:
            w_record = {
                **w,
                "registered_at": (datetime.datetime.now() - datetime.timedelta(minutes=10)).strftime("%H:%M:%S")
            }
            waiting_queue.append(w_record) # FIFO enqueue

        log_event("SYSTEM_INIT", "System initialized with 6 allocated rooms, 4 available rooms, and 2 students in waiting queue.", "info")

    elif initial_scenario == "test_scenario":
        # 10 rooms allocated (A101 - A110)
        # Student 11 & Student 12 in waiting queue
        test_students = [
            {"id": f"23CS{str(i).zfill(3)}", "name": f"Student {i}", "dept": "CSE", "year": "2nd Year", "phone": f"98765432{str(i).zfill(2)}", "gender": "Male" if i%2 else "Female", "pref_type": "2 Sharing"}
            for i in range(1, 11)
        ]
        for s in test_students:
            room = available_rooms.popleft() # Room A101 to A110
            alloc_record = {
                **s,
                "room": room,
                "room_type": ROOM_CATALOG[room]["type"],
                "floor": ROOM_CATALOG[room]["floor"],
                "wing": ROOM_CATALOG[room]["wing"],
                "allocated_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            }
            allocated_students.append(alloc_record)

        # 2 students in waiting queue
        queue_students = [
            {"id": "23CS011", "name": "Student 11", "dept": "IT", "year": "1st Year", "phone": "9876543291", "gender": "Male", "pref_type": "2 Sharing", "registered_at": datetime.datetime.now().strftime("%H:%M:%S")},
            {"id": "23CS012", "name": "Student 12", "dept": "CSE", "year": "1st Year", "phone": "9876543292", "gender": "Female", "pref_type": "2 Sharing", "registered_at": datetime.datetime.now().strftime("%H:%M:%S")},
        ]
        for q in queue_students:
            waiting_queue.append(q)

        log_event("SCENARIO_LOADED", "Loaded 10 allocated rooms (Student 1-10) and 2 waiting queue students (Student 11, 12). Ready for cancellation test!", "success")


# Initialize default state on module load
reset_system("default")


# =============================================================================
# AUTHENTICATION DECORATOR & DEMO CREDENTIALS
# =============================================================================

DEMO_ADMIN = {
    "username": "admin",
    "password": "admin123"
}

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("logged_in"):
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


# =============================================================================
# CORE BUSINESS LOGIC (QUEUE ALGORITHM IMPLEMENTATION)
# =============================================================================

def process_registration(student_data):
    """
    Registers a student following strict FIFO allocation rules.
    1. Check if student already exists in allocated or waiting list.
    2. If rooms are available in available_rooms deque:
       - Dequeue the next room using available_rooms.popleft()
       - Assign to student and save in allocated_students.
    3. If NO room is available (available_rooms is empty):
       - Enqueue the student to the REAR of waiting_queue using waiting_queue.append()
    """
    student_id = student_data["id"].strip().upper()
    student_name = student_data["name"].strip()
    
    # Validation
    if not student_id or not student_name:
        return {"success": False, "message": "Student ID and Name are required."}

    # Check for duplicates
    for a in allocated_students:
        if a["id"].upper() == student_id:
            return {"success": False, "message": f"Student {student_id} is already allocated to Room {a['room']}."}

    for w in waiting_queue:
        if w["id"].upper() == student_id:
            return {"success": False, "message": f"Student {student_id} is already in the Waiting Queue."}

    # Record registration timestamp
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    time_str = datetime.datetime.now().strftime("%H:%M:%S")
    clean_record = {
        "id": student_id,
        "name": student_name,
        "dept": student_data.get("dept", "General"),
        "year": student_data.get("year", "1st Year"),
        "phone": student_data.get("phone", "N/A"),
        "gender": student_data.get("gender", "N/A"),
        "pref_type": student_data.get("pref_type", "2 Sharing"),
        "registered_at": time_str
    }

    # =========================================================================
    # QUEUE DECISION LOGIC:
    # Check if available_rooms deque has items
    # =========================================================================
    if len(available_rooms) > 0:
        # Step 3: Room is available -> Dequeue from front of available_rooms
        room = available_rooms.popleft()
        clean_record["room"] = room
        clean_record["room_type"] = ROOM_CATALOG[room]["type"]
        clean_record["floor"] = ROOM_CATALOG[room]["floor"]
        clean_record["wing"] = ROOM_CATALOG[room]["wing"]
        clean_record["allocated_at"] = now_str
        
        allocated_students.append(clean_record)
        log_event(
            "ALLOCATION",
            f"Student {student_id} ({student_name}) registered and allocated Room {room}.",
            "success",
            {"student_id": student_id, "room": room}
        )
        return {
            "success": True,
            "status": "ALLOCATED",
            "room": room,
            "message": f"Student registered successfully. Room {room} allocated.",
            "data": clean_record
        }
    else:
        # Step 4: No room available -> Enqueue student to waiting_queue (REAR)
        waiting_queue.append(clean_record)
        queue_pos = len(waiting_queue)
        log_event(
            "WAITING_ENQUEUE",
            f"All rooms occupied. Student {student_id} ({student_name}) placed in Waiting Queue at Position #{queue_pos}.",
            "warning",
            {"student_id": student_id, "position": queue_pos}
        )
        return {
            "success": True,
            "status": "WAITING",
            "position": queue_pos,
            "message": f"All rooms are occupied. Student added to waiting queue (Position #{queue_pos}).",
            "data": clean_record
        }


def process_cancellation(identifier):
    """
    Cancels room allocation for a given student ID or Room Number.
    Workflow:
    1. Locate student in allocated_students.
    2. Remove student from allocated list.
    3. Make room available.
    4. Check if waiting_queue has students.
    5. If waiting students exist:
       - Dequeue first student: waiting_queue.popleft() [FIFO]
       - Immediately allocate freed room to that student.
    6. If waiting queue is empty:
       - Return freed room to available_rooms deque: available_rooms.append(room)
    """
    query = identifier.strip().upper()
    if not query:
        return {"success": False, "message": "Please enter a valid Student ID or Room Number."}

    # Find allocation record
    target_idx = -1
    for idx, alloc in enumerate(allocated_students):
        if alloc["id"].upper() == query or alloc["room"].upper() == query:
            target_idx = idx
            break

    if target_idx == -1:
        # Check if the query is in the waiting list instead
        for idx, waiter in enumerate(waiting_queue):
            if waiter["id"].upper() == query:
                # Remove from waiting queue (non-FIFO manual drop, rare case)
                del waiting_queue[idx]
                log_event("WAITING_CANCEL", f"Student {waiter['id']} removed from waiting queue.", "info")
                return {
                    "success": True,
                    "action": "WAITING_REMOVED",
                    "message": f"Student {waiter['id']} was removed from the Waiting Queue.",
                    "details": {"student_id": waiter["id"]}
                }

        return {"success": False, "message": f"No active allocation found for '{query}'."}

    # Pop the allocated student
    cancelled_student = allocated_students.pop(target_idx)
    released_room = cancelled_student["room"]

    log_event(
        "CANCELLATION",
        f"Allocation cancelled for Student {cancelled_student['id']} ({cancelled_student['name']}). Room {released_room} has been released.",
        "danger",
        {"student_id": cancelled_student["id"], "room": released_room}
    )

    # =========================================================================
    # QUEUE PROCESSING:
    # Check if waiting_queue has students waiting
    # =========================================================================
    if len(waiting_queue) > 0:
        # Step 4 & 5: FIFO Dequeue -> Next student at FRONT gets the released room!
        next_student = waiting_queue.popleft()
        
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        next_student["room"] = released_room
        next_student["room_type"] = ROOM_CATALOG[released_room]["type"]
        next_student["floor"] = ROOM_CATALOG[released_room]["floor"]
        next_student["wing"] = ROOM_CATALOG[released_room]["wing"]
        next_student["allocated_at"] = now_str

        allocated_students.append(next_student)

        log_event(
            "QUEUE_AUTO_ALLOCATE",
            f"Waiting Queue processed: {next_student['id']} ({next_student['name']}) -> Room {released_room} automatically allocated.",
            "success",
            {"student_id": next_student["id"], "room": released_room}
        )

        return {
            "success": True,
            "action": "REALLOCATED",
            "released_room": released_room,
            "cancelled_student": cancelled_student,
            "reallocated_student": next_student,
            "remaining_waiting_count": len(waiting_queue),
            "message": f"Room {released_room} has been released.\nWaiting Queue processed:\n{next_student['id']} → Room {released_room} allocated."
        }
    else:
        # Step 6: Queue is empty -> Return room to available_rooms deque
        available_rooms.append(released_room)
        return {
            "success": True,
            "action": "FREED",
            "released_room": released_room,
            "cancelled_student": cancelled_student,
            "reallocated_student": None,
            "remaining_waiting_count": 0,
            "message": f"Room {released_room} has been released and is now Available."
        }


def search_system(query):
    """
    Searches across allocated students, waiting queue, and rooms.
    """
    q = query.strip().upper()
    if not q:
        return {"found": False, "message": "Search query cannot be empty."}

    results = []

    # Search in allocated students
    for s in allocated_students:
        if q in s["id"].upper() or q in s["name"].upper() or q in s["room"].upper():
            results.append({
                "category": "ALLOCATED",
                "student_id": s["id"],
                "name": s["name"],
                "dept": s["dept"],
                "year": s["year"],
                "room": s["room"],
                "room_type": s["room_type"],
                "status": "Allocated",
                "status_badge": "bg-danger",
                "time": s.get("allocated_at", "N/A")
            })

    # Search in waiting queue
    for idx, w in enumerate(waiting_queue):
        if q in w["id"].upper() or q in w["name"].upper():
            results.append({
                "category": "WAITING",
                "student_id": w["id"],
                "name": w["name"],
                "dept": w["dept"],
                "year": w["year"],
                "room": "In Queue",
                "room_type": w.get("pref_type", "N/A"),
                "status": "Waiting in Queue",
                "status_badge": "bg-warning",
                "queue_position": idx + 1,
                "time": w.get("registered_at", "N/A")
            })

    # Search in available rooms
    for r in available_rooms:
        if q == r or q in r:
            results.append({
                "category": "AVAILABLE_ROOM",
                "student_id": "None",
                "name": "Unoccupied",
                "dept": "N/A",
                "year": "N/A",
                "room": r,
                "room_type": ROOM_CATALOG[r]["type"],
                "status": "Available",
                "status_badge": "bg-primary",
                "time": "Ready for assignment"
            })

    return {
        "found": len(results) > 0,
        "count": len(results),
        "query": query,
        "results": results
    }


def get_system_snapshot():
    """Returns current state metrics for dashboard and API."""
    # Build complete room status list
    all_rooms_status = []
    
    # Map allocated rooms
    allocated_by_room = {a["room"]: a for a in allocated_students}

    for room_no, meta in ROOM_CATALOG.items():
        if room_no in allocated_by_room:
            occupant = allocated_by_room[room_no]
            all_rooms_status.append({
                "room_no": room_no,
                "room_type": meta["type"],
                "floor": meta["floor"],
                "wing": meta["wing"],
                "status": "Occupied",
                "is_available": False,
                "student_id": occupant["id"],
                "student_name": occupant["name"],
                "dept": occupant["dept"],
                "allocated_at": occupant.get("allocated_at", "N/A")
            })
        else:
            all_rooms_status.append({
                "room_no": room_no,
                "room_type": meta["type"],
                "floor": meta["floor"],
                "wing": meta["wing"],
                "status": "Available",
                "is_available": True,
                "student_id": "-",
                "student_name": "-",
                "dept": "-",
                "allocated_at": "-"
            })

    # Format waiting queue with 1-based positions
    formatted_waiting_queue = []
    for idx, waiter in enumerate(waiting_queue):
        formatted_waiting_queue.append({
            "position": idx + 1,
            "id": waiter["id"],
            "name": waiter["name"],
            "dept": waiter["dept"],
            "year": waiter.get("year", "N/A"),
            "phone": waiter.get("phone", "N/A"),
            "pref_type": waiter.get("pref_type", "2 Sharing"),
            "registered_at": waiter.get("registered_at", "N/A")
        })

    return {
        "metrics": {
            "total_rooms": TOTAL_ROOM_COUNT,
            "available_rooms_count": len(available_rooms),
            "occupied_rooms_count": len(allocated_students),
            "waiting_count": len(waiting_queue),
            "total_allocated_students": len(allocated_students)
        },
        "available_rooms_deque": list(available_rooms),
        "waiting_queue": formatted_waiting_queue,
        "allocated_students": allocated_students,
        "all_rooms": all_rooms_status,
        "activity_log": activity_log[:20]
    }


# =============================================================================
# FLASK HTTP ROUTES
# =============================================================================

@app.route("/")
def index():
    """Landing route: redirect to dashboard if authenticated, else login."""
    if session.get("logged_in"):
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    """Admin login page with demo credentials."""
    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()
        
        if username == DEMO_ADMIN["username"] and password == DEMO_ADMIN["password"]:
            session["logged_in"] = True
            session["username"] = username
            flash("Welcome to Hostel Allocation Portal", "success")
            return redirect(url_for("dashboard"))
        else:
            error = "Invalid credentials. Please use admin / admin123."

    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    """Clear session and log out."""
    session.clear()
    flash("You have been safely logged out.", "info")
    return redirect(url_for("login"))


@app.route("/dashboard")
@login_required
def dashboard():
    """Main administrative dashboard view."""
    data = get_system_snapshot()
    return render_template("dashboard.html", data=data)


# Standard Form Submission Endpoints (Supports both classic forms & AJAX)
@app.route("/register", methods=["POST"])
@login_required
def register_form():
    student_data = {
        "id": request.form.get("student_id", ""),
        "name": request.form.get("student_name", ""),
        "dept": request.form.get("department", "CSE"),
        "year": request.form.get("year", "1st Year"),
        "phone": request.form.get("phone", "N/A"),
        "gender": request.form.get("gender", "Male"),
        "pref_type": request.form.get("pref_type", "2 Sharing")
    }
    result = process_registration(student_data)
    if result["success"]:
        flash(result["message"], "success" if result["status"] == "ALLOCATED" else "warning")
    else:
        flash(result["message"], "danger")
    return redirect(url_for("dashboard"))


@app.route("/cancel", methods=["POST"])
@login_required
def cancel_form():
    identifier = request.form.get("identifier", "")
    result = process_cancellation(identifier)
    if result["success"]:
        flash(result["message"], "success")
    else:
        flash(result["message"], "danger")
    return redirect(url_for("dashboard"))


@app.route("/waiting-list")
@login_required
def waiting_list():
    """Direct route for waiting queue view."""
    data = get_system_snapshot()
    return render_template("dashboard.html", data=data, active_tab="waiting")


@app.route("/rooms")
@login_required
def rooms_view():
    """Direct route for rooms grid view."""
    data = get_system_snapshot()
    return render_template("dashboard.html", data=data, active_tab="rooms")


@app.route("/search", methods=["GET", "POST"])
@login_required
def search_view():
    """Search route."""
    query = request.args.get("q", "") if request.method == "GET" else request.form.get("q", "")
    search_data = search_system(query) if query else None
    data = get_system_snapshot()
    return render_template("dashboard.html", data=data, search_data=search_data, query=query, active_tab="search")


# =============================================================================
# REST API ENDPOINTS (FOR DYNAMIC ASYNC FRONTEND INTERACTION)
# =============================================================================

@app.route("/api/status", methods=["GET"])
@login_required
def api_status():
    """Returns current live data snapshot."""
    return jsonify(get_system_snapshot())


@app.route("/api/register", methods=["POST"])
@login_required
def api_register():
    """JSON API to register student and allocate or enqueue."""
    payload = request.get_json(silent=True) or request.form.to_dict()
    student_data = {
        "id": payload.get("student_id") or payload.get("id", ""),
        "name": payload.get("student_name") or payload.get("name", ""),
        "dept": payload.get("department") or payload.get("dept", "CSE"),
        "year": payload.get("year", "1st Year"),
        "phone": payload.get("phone", "N/A"),
        "gender": payload.get("gender", "Male"),
        "pref_type": payload.get("pref_type", "2 Sharing")
    }
    result = process_registration(student_data)
    result["snapshot"] = get_system_snapshot()
    return jsonify(result), (200 if result["success"] else 400)


@app.route("/api/cancel", methods=["POST"])
@login_required
def api_cancel():
    """JSON API to cancel allocation and trigger FIFO waiting queue dequeue."""
    payload = request.get_json(silent=True) or request.form.to_dict()
    identifier = payload.get("identifier") or payload.get("student_id") or payload.get("room", "")
    result = process_cancellation(identifier)
    result["snapshot"] = get_system_snapshot()
    return jsonify(result), (200 if result["success"] else 400)


@app.route("/api/search", methods=["GET"])
@login_required
def api_search():
    """JSON API to search students or rooms."""
    q = request.args.get("q", "")
    result = search_system(q)
    return jsonify(result)


@app.route("/api/reset", methods=["POST"])
@login_required
def api_reset():
    """Reset system to empty or default scenario."""
    payload = request.get_json(silent=True) or {}
    mode = payload.get("mode", "default")
    reset_system(mode)
    return jsonify({
        "success": True,
        "message": f"System state reset to '{mode}'.",
        "snapshot": get_system_snapshot()
    })


@app.route("/api/load-scenario", methods=["POST"])
@login_required
def api_load_scenario():
    """
    Specifically loads the prompt's required test scenario:
    10 rooms available -> Student 1 to 10 allocated
    Student 11 -> Waiting Queue Position 1
    Student 12 -> Waiting Queue Position 2
    """
    reset_system("test_scenario")
    return jsonify({
        "success": True,
        "message": "Test Scenario loaded: 10 rooms allocated (A101-A110 to Student 1-10) and 2 students in Waiting Queue (Student 11 & 12). Ready to cancel Room A101!",
        "snapshot": get_system_snapshot()
    })


# =============================================================================
# APPLICATION ENTRYPOINT
# =============================================================================

if __name__ == "__main__":
    print("🏨 Starting Hostel Room Allocation System...")
    print("📍 URL: http://127.0.0.1:5000")
    print("🔑 Login: admin / admin123")
    app.run(debug=True, port=5000)
