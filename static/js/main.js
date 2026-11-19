/**
 * TaskHub Frontend Controller
 * Fast, reactive state management with RESTful sync
 */

document.addEventListener('DOMContentLoaded', () => {
    // State
    const state = {
        tasks: [],
        filterStatus: 'all',
        filterCategory: 'all',
        filterPriority: 'all',
        searchQuery: '',
    };

    // DOM Elements
    const tasksGrid = document.getElementById('tasks-grid');
    const emptyState = document.getElementById('empty-state');
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const taskIdInput = document.getElementById('task-id');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priorityFilter = document.getElementById('priority-filter');
    const filterTabs = document.querySelectorAll('.tab-btn');
    const btnOpenModal = document.getElementById('btn-open-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const btnEmptyAdd = document.getElementById('btn-empty-add');
    const toastContainer = document.getElementById('toast-container');

    // Stat Elements
    const statTotal = document.getElementById('stat-total');
    const statPending = document.getElementById('stat-pending');
    const statCompleted = document.getElementById('stat-completed');
    const statHighPriorityText = document.getElementById('stat-high-priority-text');
    const statPercentText = document.getElementById('stat-percent-text');
    const statProgressBar = document.getElementById('stat-progress-bar');

    // Utility: Safe HTML Escape
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Toast Notifications
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconSvg = type === 'success' 
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`
            : type === 'error'
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

        toast.innerHTML = `${iconSvg} <span>${escapeHtml(message)}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // Load & Render Stats
    async function loadStats() {
        try {
            const res = await fetch('/api/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();

            statTotal.textContent = data.total;
            statPending.textContent = data.pending;
            statCompleted.textContent = data.completed;
            statHighPriorityText.textContent = `${data.high_priority} High Priority`;
            statPercentText.textContent = `${data.completion_rate}%`;
            statProgressBar.style.width = `${data.completion_rate}%`;

            // Update Category Filter options
            const currentSelected = categoryFilter.value;
            categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
            data.categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                if (cat === currentSelected) opt.selected = true;
                categoryFilter.appendChild(opt);
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }

    // Load Tasks with filters
    async function loadTasks() {
        try {
            const params = new URLSearchParams({
                status: state.filterStatus,
                category: state.filterCategory,
                priority: state.filterPriority,
                search: state.searchQuery
            });

            const res = await fetch(`/api/tasks?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load tasks');
            state.tasks = await res.json();
            renderTasks();
            loadStats();
        } catch (err) {
            console.error('Error fetching tasks:', err);
            showToast('Unable to load tasks from server', 'error');
        }
    }

    // Render Tasks to DOM
    function renderTasks() {
        tasksGrid.innerHTML = '';

        if (state.tasks.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        state.tasks.forEach(task => {
            const card = document.createElement('article');
            card.className = `task-card ${task.completed ? 'is-completed' : ''}`;
            card.dataset.id = task.id;

            const priorityClass = task.priority === 'High' 
                ? 'tag-priority-high' 
                : task.priority === 'Medium' 
                ? 'tag-priority-medium' 
                : 'tag-priority-low';

            card.innerHTML = `
                <div>
                    <div class="task-card-top">
                        <button class="custom-checkbox ${task.completed ? 'checked' : ''}" 
                                aria-label="${task.completed ? 'Mark pending' : 'Mark complete'}"
                                data-action="toggle" 
                                data-id="${task.id}"
                                data-completed="${task.completed}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <div class="task-body">
                            <h3 class="task-title">${escapeHtml(task.title)}</h3>
                            ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
                        </div>
                    </div>
                </div>

                <div class="task-card-meta">
                    <div class="meta-tags">
                        <span class="tag ${priorityClass}">${task.priority}</span>
                        <span class="tag">${escapeHtml(task.category)}</span>
                        ${task.due_date ? `
                            <span class="meta-due">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                ${task.due_date}
                            </span>
                        ` : ''}
                    </div>

                    <div class="task-card-actions">
                        <button class="btn-icon" data-action="edit" data-id="${task.id}" title="Edit task" aria-label="Edit task">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon" data-action="delete" data-id="${task.id}" title="Delete task" aria-label="Delete task">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;

            tasksGrid.appendChild(card);
        });
    }

    // Toggle Task Status
    async function toggleTaskStatus(taskId, currentStatus) {
        try {
            const nextStatus = !currentStatus;
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: nextStatus })
            });

            if (!res.ok) throw new Error('Status update failed');
            showToast(nextStatus ? 'Task marked as completed! 🎉' : 'Task moved back to in progress', 'success');
            loadTasks();
        } catch (err) {
            console.error(err);
            showToast('Failed to update task status', 'error');
        }
    }

    // Delete Task
    async function deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            showToast('Task deleted successfully', 'info');
            loadTasks();
        } catch (err) {
            console.error(err);
            showToast('Failed to delete task', 'error');
        }
    }

    // Open Modal for Add
    function openAddModal() {
        modalTitle.textContent = 'Create New Task';
        taskIdInput.value = '';
        taskForm.reset();
        taskModal.showModal();
        document.getElementById('task-title').focus();
    }

    // Open Modal for Edit
    function openEditModal(task) {
        modalTitle.textContent = 'Edit Task';
        taskIdInput.value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-category').value = task.category || 'General';
        document.getElementById('task-priority').value = task.priority || 'Medium';
        document.getElementById('task-duedate').value = task.due_date || '';
        taskModal.showModal();
        document.getElementById('task-title').focus();
    }

    // Close Modal
    function closeModal() {
        taskModal.close();
    }

    // Handle Form Submit (Add or Edit)
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskId = taskIdInput.value;
        const payload = {
            title: document.getElementById('task-title').value.trim(),
            description: document.getElementById('task-desc').value.trim(),
            category: document.getElementById('task-category').value.trim() || 'General',
            priority: document.getElementById('task-priority').value,
            due_date: document.getElementById('task-duedate').value
        };

        if (!payload.title) {
            showToast('Please enter a task title', 'error');
            return;
        }

        try {
            if (taskId) {
                // Update existing
                const res = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Update failed');
                showToast('Task updated successfully', 'success');
            } else {
                // Create new
                const res = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Creation failed');
                showToast('Task created successfully!', 'success');
            }

            closeModal();
            loadTasks();
        } catch (err) {
            console.error(err);
            showToast('Operation failed. Please try again.', 'error');
        }
    });

    // Event Delegation on Tasks Grid
    tasksGrid.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('[data-action="toggle"]');
        if (toggleBtn) {
            const taskId = toggleBtn.dataset.id;
            const completed = toggleBtn.dataset.completed === '1' || toggleBtn.dataset.completed === 'true';
            toggleTaskStatus(taskId, completed);
            return;
        }

        const editBtn = e.target.closest('[data-action="edit"]');
        if (editBtn) {
            const taskId = parseInt(editBtn.dataset.id, 10);
            const task = state.tasks.find(t => t.id === taskId);
            if (task) openEditModal(task);
            return;
        }

        const deleteBtn = e.target.closest('[data-action="delete"]');
        if (deleteBtn) {
            const taskId = deleteBtn.dataset.id;
            deleteTask(taskId);
            return;
        }
    });

    // Modal Trigger Buttons
    btnOpenModal.addEventListener('click', openAddModal);
    btnEmptyAdd.addEventListener('click', openAddModal);
    btnCloseModal.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);

    // Light-dismiss dialog when clicking on backdrop
    taskModal.addEventListener('click', (e) => {
        const rect = taskModal.getBoundingClientRect();
        const isInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
            closeModal();
        }
    });

    // Search Input with Debounce
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            state.searchQuery = e.target.value.trim();
            loadTasks();
        }, 250);
    });

    // Shortcut: Press '/' to focus search
    window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput && !taskModal.open) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });

    // Filter Tabs (Status)
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.filterStatus = tab.dataset.status;
            loadTasks();
        });
    });

    // Filter Selects
    categoryFilter.addEventListener('change', (e) => {
        state.filterCategory = e.target.value;
        loadTasks();
    });

    priorityFilter.addEventListener('change', (e) => {
        state.filterPriority = e.target.value;
        loadTasks();
    });

    // Initial Load
    loadTasks();
});
