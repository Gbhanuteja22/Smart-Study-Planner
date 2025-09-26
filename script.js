class StudyPlanner {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.currentEditId = null;
        this.init();
    }
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }
    
    initializeApp() {
        this.setupEventListeners();
        this.updateStats();
        this.renderTasks();
        this.renderRecentTasks();
        this.renderProgress();
        this.renderTimeline();
        this.renderSubjectProgress();
        this.checkForNotifications();
        this.setMinDate();
    }
    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        const dueDateInput = document.getElementById('due-date');
        const editDueDateInput = document.getElementById('edit-due-date');
        
        if (dueDateInput) {
            dueDateInput.min = today;
        }
        if (editDueDateInput) {
            editDueDateInput.min = today;
        }
    }
    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });
        });
        
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }
        
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });
        }
        
        const editTaskForm = document.getElementById('edit-task-form');
        if (editTaskForm) {
            editTaskForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateTask();
            });
        }
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                if (filter) {
                    this.setFilter(filter);
                }
            });
        });
        
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }
        
        const editModal = document.getElementById('edit-modal');
        if (editModal) {
            editModal.addEventListener('click', (e) => {
                if (e.target.id === 'edit-modal') {
                    this.closeModal();
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }
    showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        } else {
            return;
        }
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeNavLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }
        
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.classList.remove('active');
        }
        
        if (sectionName === 'progress') {
            this.renderProgress();
            this.renderTimeline();
            this.renderSubjectProgress();
        }
    }
    loadTasks() {
        const stored = localStorage.getItem('studyPlannerTasks');
        return stored ? JSON.parse(stored) : [];
    }
    saveTasks() {
        localStorage.setItem('studyPlannerTasks', JSON.stringify(this.tasks));
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    addTask() {
        const form = document.getElementById('task-form');
        const formData = new FormData(form);
        const task = {
            id: this.generateId(),
            subject: formData.get('subject').trim(),
            description: formData.get('description').trim(),
            dueDate: formData.get('due-date'),
            priority: formData.get('priority'),
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };
        if (!task.subject || !task.description || !task.dueDate) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        this.tasks.push(task);
        this.saveTasks();
        this.updateStats();
        this.renderTasks();
        this.renderRecentTasks();
        this.renderProgress();
        this.renderTimeline();
        this.renderSubjectProgress();
        form.reset();
        this.showNotification('Task added successfully!', 'success');
    }
    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        this.currentEditId = id;
        document.getElementById('edit-subject').value = task.subject;
        document.getElementById('edit-description').value = task.description;
        document.getElementById('edit-due-date').value = task.dueDate;
        document.getElementById('edit-priority').value = task.priority;
        document.getElementById('edit-modal').style.display = 'block';
    }
    updateTask() {
        const form = document.getElementById('edit-task-form');
        const formData = new FormData(form);
        const taskIndex = this.tasks.findIndex(t => t.id === this.currentEditId);
        if (taskIndex === -1) return;
        const updatedTask = {
            ...this.tasks[taskIndex],
            subject: formData.get('subject').trim(),
            description: formData.get('description').trim(),
            dueDate: formData.get('due-date'),
            priority: formData.get('priority')
        };
        if (!updatedTask.subject || !updatedTask.description || !updatedTask.dueDate) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }
        this.tasks[taskIndex] = updatedTask;
        this.saveTasks();
        this.updateStats();
        this.renderTasks();
        this.renderRecentTasks();
        this.renderProgress();
        this.renderTimeline();
        this.renderSubjectProgress();
        this.closeModal();
        this.showNotification('Task updated successfully!', 'success');
    }
    deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.updateStats();
        this.renderTasks();
        this.renderRecentTasks();
        this.renderProgress();
        this.renderTimeline();
        this.renderSubjectProgress();
        this.showNotification('Task deleted successfully!', 'success');
    }
    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        this.saveTasks();
        this.updateStats();
        this.renderTasks();
        this.renderRecentTasks();
        this.renderProgress();
        this.renderTimeline();
        this.renderSubjectProgress();
        const message = task.completed ? 'Task marked as completed!' : 'Task marked as pending!';
        this.showNotification(message, 'success');
    }
    closeModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.currentEditId = null;
    }
    setFilter(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.renderTasks();
    }
    getFilteredTasks() {
        const now = new Date();
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'pending':
                return this.tasks.filter(t => !t.completed && new Date(t.dueDate) >= now);
            case 'overdue':
                return this.tasks.filter(t => !t.completed && new Date(t.dueDate) < now);
            default:
                return this.tasks;
        }
    }
    isOverdue(task) {
        return !task.completed && new Date(task.dueDate) < new Date();
    }
    getTaskStatus(task) {
        if (task.completed) return 'completed';
        if (this.isOverdue(task)) return 'overdue';
        return 'pending';
    }
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    }
    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else {
            return `Due in ${diffDays} days`;
        }
    }
    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = this.tasks.filter(t => !t.completed).length;
        const overdue = this.tasks.filter(t => this.isOverdue(t)).length;
        document.getElementById('total-tasks').textContent = total;
        document.getElementById('completed-tasks').textContent = completed;
        document.getElementById('pending-tasks').textContent = pending;
        document.getElementById('overdue-tasks').textContent = overdue;
        const progressTotal = document.getElementById('stat-total');
        const progressCompleted = document.getElementById('stat-completed');
        const progressPending = document.getElementById('stat-pending');
        const progressOverdue = document.getElementById('stat-overdue');
        
        if (progressTotal) progressTotal.textContent = total;
        if (progressCompleted) progressCompleted.textContent = completed;
        if (progressPending) progressPending.textContent = pending;
        if (progressOverdue) progressOverdue.textContent = overdue;
    }
    renderTasks() {
        const container = document.getElementById('tasks-container');
        if (!container) {
            return;
        }
        
        const filteredTasks = this.getFilteredTasks();
        if (filteredTasks.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            return;
        }
        container.innerHTML = filteredTasks
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .map(task => this.getTaskHTML(task))
            .join('');
    }
    renderRecentTasks() {
        const container = document.getElementById('recent-tasks-list');
        if (!container) {
            return;
        }
        
        const recentTasks = this.tasks
            .filter(t => !t.completed)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 3);
        if (recentTasks.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-tasks"></i><h3>No pending tasks</h3><p>You\'re all caught up!</p></div>';
            return;
        }
        container.innerHTML = recentTasks.map(task => this.getTaskHTML(task, true)).join('');
    }
    getTaskHTML(task, isPreview = false) {
        const status = this.getTaskStatus(task);
        const relativeTime = this.getRelativeTime(task.dueDate);
        return `
            <div class="task-card ${task.priority}-priority ${status} ${isPreview ? 'fade-in' : ''}">
                <div class="task-header">
                    <h3 class="task-title">${this.escapeHtml(task.subject)}</h3>
                    <span class="task-priority ${task.priority}">${task.priority}</span>
                </div>
                <p class="task-description">${this.escapeHtml(task.description)}</p>
                <div class="task-meta">
                    <div class="task-date">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(task.dueDate)} (${relativeTime})</span>
                    </div>
                    <span class="task-status ${status}">${status}</span>
                </div>
                <div class="task-actions">
                    <button class="btn btn-small ${task.completed ? 'btn-warning' : 'btn-success'}" 
                            onclick="studyPlanner.toggleTask('${task.id}')">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                        ${task.completed ? 'Undo' : 'Complete'}
                    </button>
                    <button class="btn btn-small btn-primary" 
                            onclick="studyPlanner.editTask('${task.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-small btn-danger" 
                            onclick="studyPlanner.deleteTask('${task.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `;
    }
    getEmptyStateHTML() {
        const filterMessages = {
            all: 'No tasks found. Add your first study task!',
            pending: 'No pending tasks. Great job!',
            completed: 'No completed tasks yet. Start completing your tasks!',
            overdue: 'No overdue tasks. You\'re on track!'
        };
        return `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No Tasks</h3>
                <p>${filterMessages[this.currentFilter]}</p>
            </div>
        `;
    }
    renderProgress() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        const circle = document.getElementById('progress-circle');
        const circumference = 2 * Math.PI * 45;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = strokeDashoffset;
        if (!document.querySelector('#progressGradient')) {
            const svg = circle.closest('svg');
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.id = 'progressGradient';
            gradient.innerHTML = `
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            `;
            defs.appendChild(gradient);
            svg.insertBefore(defs, svg.firstChild);
        }
    }
    renderTimeline() {
        const container = document.getElementById('timeline-container');
        const tasksByDate = this.groupTasksByDate();
        if (Object.keys(tasksByDate).length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar"></i><h3>No tasks scheduled</h3><p>Add some tasks to see your timeline!</p></div>';
            return;
        }
        const sortedDates = Object.keys(tasksByDate).sort((a, b) => new Date(a) - new Date(b));
        container.innerHTML = sortedDates.map(date => {
            const tasks = tasksByDate[date];
            const tasksHTML = tasks.map(task => `
                <div class="timeline-task">
                    <span>${this.escapeHtml(task.subject)}</span>
                    <span class="task-status ${this.getTaskStatus(task)}">${this.getTaskStatus(task)}</span>
                </div>
            `).join('');
            return `
                <div class="timeline-item">
                    <div class="timeline-date">${this.formatDate(date)}</div>
                    <div class="timeline-tasks">${tasksHTML}</div>
                </div>
            `;
        }).join('');
    }
    groupTasksByDate() {
        const grouped = {};
        this.tasks.forEach(task => {
            const date = task.dueDate;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(task);
        });
        return grouped;
    }
    renderSubjectProgress() {
        const container = document.getElementById('subject-progress-container');
        const subjectStats = this.getSubjectStats();
        if (Object.keys(subjectStats).length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><h3>No subjects found</h3><p>Add tasks to see subject-wise progress!</p></div>';
            return;
        }
        container.innerHTML = Object.entries(subjectStats).map(([subject, stats]) => {
            const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return `
                <div class="subject-item">
                    <div class="subject-header">
                        <span class="subject-name">${this.escapeHtml(subject)}</span>
                        <span class="subject-percentage">${percentage}%</span>
                    </div>
                    <div class="subject-progress-bar">
                        <div class="subject-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="subject-stats">
                        <small>${stats.completed}/${stats.total} tasks completed</small>
                    </div>
                </div>
            `;
        }).join('');
    }
    getSubjectStats() {
        const stats = {};
        this.tasks.forEach(task => {
            const subject = task.subject;
            if (!stats[subject]) {
                stats[subject] = { total: 0, completed: 0 };
            }
            stats[subject].total++;
            if (task.completed) {
                stats[subject].completed++;
            }
        });
        return stats;
    }
    checkForNotifications() {
        const now = new Date();
        const today = now.toDateString();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
        this.tasks.forEach(task => {
            if (task.completed) return;
            const dueDate = new Date(task.dueDate);
            const dueDateString = dueDate.toDateString();
            if (dueDateString === today) {
                this.showNotification(`Task "${task.subject}" is due today!`, 'warning', 5000);
            } else if (dueDateString === tomorrow) {
                this.showNotification(`Task "${task.subject}" is due tomorrow!`, 'warning', 5000);
            }
        });
        const overdueTasks = this.tasks.filter(task => this.isOverdue(task));
        if (overdueTasks.length > 0) {
            this.showNotification(`You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}!`, 'error', 6000);
        }
    }
    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        const iconMap = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        notification.innerHTML = `
            <i class="fas ${iconMap[type]} notification-icon"></i>
            <span>${this.escapeHtml(message)}</span>
        `;
        container.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    exportData() {
        const data = {
            tasks: this.tasks,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `study-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully!', 'success');
    }
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.tasks && Array.isArray(data.tasks)) {
                    if (confirm('This will replace all current tasks. Are you sure?')) {
                        this.tasks = data.tasks;
                        this.saveTasks();
                        this.updateStats();
                        this.renderTasks();
                        this.renderRecentTasks();
                        this.renderProgress();
                        this.renderTimeline();
                        this.renderSubjectProgress();
                        this.showNotification('Data imported successfully!', 'success');
                    }
                } else {
                    this.showNotification('Invalid file format!', 'error');
                }
            } catch (error) {
                this.showNotification('Error reading file!', 'error');
            }
        };
        reader.readAsText(file);
    }
    clearAllData() {
        if (confirm('This will delete ALL tasks permanently. Are you sure?')) {
            if (confirm('This action cannot be undone. Continue?')) {
                this.tasks = [];
                this.saveTasks();
                this.updateStats();
                this.renderTasks();
                this.renderRecentTasks();
                this.renderProgress();
                this.renderTimeline();
                this.renderSubjectProgress();
                this.showNotification('All data cleared!', 'success');
            }
        }
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.studyPlanner) {
            window.studyPlanner = new StudyPlanner();
        }
    });
} else {
    if (!window.studyPlanner) {
        window.studyPlanner = new StudyPlanner();
    }
}
function showSection(sectionName) {
    if (window.studyPlanner && typeof window.studyPlanner.showSection === 'function') {
        window.studyPlanner.showSection(sectionName);
    }
}

window.addEventListener('online', () => {
    if (window.studyPlanner) {
        window.studyPlanner.showNotification('You are back online!', 'success');
    }
});
window.addEventListener('offline', () => {
    if (window.studyPlanner) {
        window.studyPlanner.showNotification('You are offline. Data will be saved locally.', 'warning');
    }
});
let autoSaveInterval;
document.addEventListener('DOMContentLoaded', () => {
    autoSaveInterval = setInterval(() => {
        if (window.studyPlanner && window.studyPlanner.tasks.length > 0) {
            window.studyPlanner.saveTasks();
        }
    }, 30000);
});
window.addEventListener('beforeunload', () => {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
});
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.getElementById('subject').focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.querySelector('.filter-btn').focus();
    }
    if (e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const sections = ['home', 'tasks', 'progress', 'about'];
        const sectionIndex = parseInt(e.key) - 1;
        if (window.studyPlanner && sections[sectionIndex]) {
            window.studyPlanner.showSection(sections[sectionIndex]);
        }
    }
});
let touchStartX = 0;
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });
document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        
    }
}, { passive: true });
function printTasks() {
    const printWindow = window.open('', '_blank');
    const tasks = window.studyPlanner.tasks;
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Study Planner Tasks</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .task { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
                .task-title { font-weight: bold; font-size: 1.1em; margin-bottom: 5px; }
                .task-meta { color: #666; font-size: 0.9em; }
                .priority-high { border-left: 5px solid #dc3545; }
                .priority-medium { border-left: 5px solid #ffc107; }
                .priority-low { border-left: 5px solid #28a745; }
                .completed { opacity: 0.6; text-decoration: line-through; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Smart Study Planner</h1>
                <p>Tasks Report - ${new Date().toLocaleDateString()}</p>
            </div>
            ${tasks.map(task => `
                <div class="task priority-${task.priority} ${task.completed ? 'completed' : ''}">
                    <div class="task-title">${task.subject}</div>
                    <div class="task-description">${task.description}</div>
                    <div class="task-meta">
                        Due: ${new Date(task.dueDate).toLocaleDateString()} | 
                        Priority: ${task.priority} | 
                        Status: ${task.completed ? 'Completed' : 'Pending'}
                    </div>
                </div>
            `).join('')}
        </body>
        </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}
