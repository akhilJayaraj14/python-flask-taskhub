# ⚡ TaskHub — Python Flask Web Application

A modern, fast, and responsive task and productivity management web app built with **Python 3, Flask, and SQLite**. Featuring a dark-mode glassmorphic user interface, instant RESTful synchronization, and keyboard shortcuts.

![TaskHub Preview](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## ✨ Features

- **🎨 Modern Glassmorphic Design**: Tailored dark-mode UI with ambient gradient lighting, backdrop blurs, and smooth micro-animations.
- **⚡ Reactive Dashboard**: Real-time metric cards displaying total tasks, in-progress items, completion velocity, and high-priority counters.
- **🔍 Instant Search & Filtering**: Fast client-side debounced search and multi-criteria filters (Status, Category, Priority).
- **🚀 Accessible Native Modals**: Uses HTML5 `<dialog>` with top-layer entry transitions and light-dismiss backdrop interactions.
- **💾 Zero-Config SQLite Storage**: Automatically initializes SQLite database with sample starter data on first run.
- **⌨️ Keyboard Shortcuts**: Press `/` anywhere to instantly focus the search bar, or `Esc` to close modals.
- **📱 Fully Responsive**: Fluid layouts that look stunning across desktop, tablet, and mobile displays.

---

## 🛠️ Project Structure

```
python-flask-taskhub/
├── app.py                # Flask application, SQLite setup, and REST API
├── requirements.txt      # Python dependencies
├── templates/
│   └── index.html        # Semantic HTML5 template with native <dialog>
├── static/
│   ├── css/
│   │   └── style.css     # CSS custom properties, glassmorphism, responsive styles
│   └── js/
│       └── main.js       # Client controller, async fetch operations, toast alerts
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation
```

---

## 🚀 Quickstart

### 1. Clone the repository
```bash
git clone https://github.com/akhilJayaraj14/python-flask-taskhub.git
cd python-flask-taskhub
```

### 2. Create a virtual environment & install dependencies
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS / Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the application
```bash
python3 app.py
```

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | Get all tasks (supports query params: `search`, `status`, `category`, `priority`) |
| `POST` | `/api/tasks` | Create a new task (body: `title`, `description`, `category`, `priority`, `due_date`) |
| `PATCH` | `/api/tasks/<id>` | Update specific fields or completion state of a task |
| `DELETE` | `/api/tasks/<id>` | Remove a task by ID |
| `GET` | `/api/stats` | Retrieve aggregate metrics (total, pending, completed, rate, categories) |

---

## 📄 License

This project is licensed under the MIT License.
