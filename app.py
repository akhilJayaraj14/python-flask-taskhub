import os
import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), "taskhub.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT DEFAULT 'General',
            priority TEXT DEFAULT 'Medium',
            completed BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            due_date TEXT
        )
    """)
    conn.commit()

    # Seed initial demo tasks if database is empty
    cursor.execute("SELECT COUNT(*) FROM tasks")
    count = cursor.fetchone()[0]
    if count == 0:
        sample_tasks = [
            ("Welcome to TaskHub!", "Explore the dashboard, create tasks, and organize your work seamlessly.", "Onboarding", "High", 0, "2026-11-20"),
            ("Design sleek glassmorphism UI", "Implement modern CSS backdrop filters, rounded borders, and subtle glows.", "Design", "High", 1, "2026-11-19"),
            ("Build RESTful Flask Endpoints", "Set up CRUD API with SQLite backend for instant state synchronization.", "Backend", "Medium", 1, "2026-11-19"),
            ("Push project to GitHub", "Initialize git repository, commit source code, and sync to remote.", "DevOps", "High", 0, "2026-11-20"),
            ("Review weekly productivity metrics", "Analyze completed tasks and prioritize upcoming goals.", "Productivity", "Low", 0, "2026-11-22")
        ]
        cursor.executemany("""
            INSERT INTO tasks (title, description, category, priority, completed, due_date)
            VALUES (?, ?, ?, ?, ?, ?)
        """, sample_tasks)
        conn.commit()
    conn.close()

# Initialize DB on start
init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/tasks", methods=["GET"])
def get_tasks():
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "all")
    category = request.args.get("category", "all")
    priority = request.args.get("priority", "all")

    query = "SELECT * FROM tasks WHERE 1=1"
    params = []

    if search:
        query += " AND (title LIKE ? OR description LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard])

    if status == "pending":
        query += " AND completed = 0"
    elif status == "completed":
        query += " AND completed = 1"

    if category != "all" and category:
        query += " AND category = ?"
        params.append(category)

    if priority != "all" and priority:
        query += " AND priority = ?"
        params.append(priority)

    query += " ORDER BY completed ASC, id DESC"

    conn = get_db_connection()
    tasks = conn.execute(query, params).fetchall()
    conn.close()

    return jsonify([dict(task) for task in tasks])

@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400

    description = data.get("description", "").strip()
    category = data.get("category", "General").strip() or "General"
    priority = data.get("priority", "Medium").strip() or "Medium"
    due_date = data.get("due_date", "")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO tasks (title, description, category, priority, completed, due_date)
        VALUES (?, ?, ?, ?, 0, ?)
    """, (title, description, category, priority, due_date))
    conn.commit()
    task_id = cursor.lastrowid
    new_task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()

    return jsonify(dict(new_task)), 201

@app.route("/api/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    data = request.get_json() or {}
    conn = get_db_connection()
    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not task:
        conn.close()
        return jsonify({"error": "Task not found"}), 404

    updates = []
    params = []

    if "title" in data:
        updates.append("title = ?")
        params.append(data["title"].strip())
    if "description" in data:
        updates.append("description = ?")
        params.append(data["description"].strip())
    if "category" in data:
        updates.append("category = ?")
        params.append(data["category"].strip())
    if "priority" in data:
        updates.append("priority = ?")
        params.append(data["priority"].strip())
    if "completed" in data:
        updates.append("completed = ?")
        params.append(1 if data["completed"] else 0)
    if "due_date" in data:
        updates.append("due_date = ?")
        params.append(data["due_date"])

    if updates:
        params.append(task_id)
        conn.execute(f"UPDATE tasks SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    updated = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    conn.close()

    return jsonify(dict(updated))

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()

    if not deleted:
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"success": True, "deleted_id": task_id})

@app.route("/api/stats", methods=["GET"])
def get_stats():
    conn = get_db_connection()
    total = conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
    completed = conn.execute("SELECT COUNT(*) FROM tasks WHERE completed = 1").fetchone()[0]
    pending = total - completed
    high_priority = conn.execute("SELECT COUNT(*) FROM tasks WHERE priority = 'High' AND completed = 0").fetchone()[0]
    
    # Categories list
    categories = [row[0] for row in conn.execute("SELECT DISTINCT category FROM tasks WHERE category IS NOT NULL AND category != ''").fetchall()]
    conn.close()

    completion_rate = round((completed / total * 100), 1) if total > 0 else 0

    return jsonify({
        "total": total,
        "completed": completed,
        "pending": pending,
        "high_priority": high_priority,
        "completion_rate": completion_rate,
        "categories": categories
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
