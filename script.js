// Homework Todo Manager JavaScript

class HomeworkManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('homework-tasks')) || [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
        this.populateTeacherFilter();
        
        // Add some sample data if no tasks exist
        if (this.tasks.length === 0) {
            this.addSampleData();
        }
    }

    bindEvents() {
        // Modal events
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeEditModal());

        // Form events
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleAddTask(e));
        document.getElementById('editTaskForm').addEventListener('submit', (e) => this.handleEditTask(e));

        // Filter events
        document.getElementById('filterTeacher').addEventListener('change', () => this.filterTasks());
        document.getElementById('filterPriority').addEventListener('change', () => this.filterTasks());

        // Modal backdrop clicks
        document.getElementById('addTaskModal').addEventListener('click', (e) => {
            if (e.target.id === 'addTaskModal') this.closeModal();
        });
        document.getElementById('editTaskModal').addEventListener('click', (e) => {
            if (e.target.id === 'editTaskModal') this.closeEditModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeEditModal();
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.openAddModal();
            }
        });
    }

    addSampleData() {
        const sampleTasks = [
            {
                id: Date.now() + 1,
                teacher: 'SP',
                task: 'Complete detailed Notes',
                pages: 30,
                deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                priority: 7,
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                teacher: 'Computer Physics',
                task: 'LAB INDEX 3 & 4',
                pages: 20,
                deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                priority: 5,
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() + 3,
                teacher: 'SB',
                task: 'LAB INDEX 3 INITIAL',
                pages: 5,
                deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                priority: 3,
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
        
        this.tasks = sampleTasks;
        this.saveToStorage();
    }

    openAddModal() {
        document.getElementById('addTaskModal').classList.add('show');
        document.getElementById('teacher').focus();
        
        // Set default deadline to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59);
        document.getElementById('deadline').value = tomorrow.toISOString().slice(0, 16);
    }

    closeModal() {
        document.getElementById('addTaskModal').classList.remove('show');
        document.getElementById('taskForm').reset();
    }

    openEditModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        this.currentEditId = taskId;
        
        document.getElementById('editTeacher').value = task.teacher;
        document.getElementById('editTask').value = task.task;
        document.getElementById('editPages').value = task.pages;
        document.getElementById('editPriority').value = task.priority;
        document.getElementById('editDeadline').value = new Date(task.deadline).toISOString().slice(0, 16);
        
        document.getElementById('editTaskModal').classList.add('show');
    }

    closeEditModal() {
        document.getElementById('editTaskModal').classList.remove('show');
        document.getElementById('editTaskForm').reset();
        this.currentEditId = null;
    }

    handleAddTask(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const task = {
            id: Date.now(),
            teacher: document.getElementById('teacher').value.trim(),
            task: document.getElementById('task').value.trim(),
            pages: parseInt(document.getElementById('pages').value),
            deadline: document.getElementById('deadline').value,
            priority: parseInt(document.getElementById('priority').value),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveToStorage();
        this.renderTasks();
        this.updateStats();
        this.populateTeacherFilter();
        this.closeModal();
        
        this.showNotification('Task added successfully!', 'success');
    }

    handleEditTask(e) {
        e.preventDefault();
        
        const taskIndex = this.tasks.findIndex(t => t.id === this.currentEditId);
        if (taskIndex === -1) return;

        this.tasks[taskIndex] = {
            ...this.tasks[taskIndex],
            teacher: document.getElementById('editTeacher').value.trim(),
            task: document.getElementById('editTask').value.trim(),
            pages: parseInt(document.getElementById('editPages').value),
            deadline: document.getElementById('editDeadline').value,
            priority: parseInt(document.getElementById('editPriority').value),
            updatedAt: new Date().toISOString()
        };

        this.saveToStorage();
        this.renderTasks();
        this.updateStats();
        this.populateTeacherFilter();
        this.closeEditModal();
        
        this.showNotification('Task updated successfully!', 'success');
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveToStorage();
            this.renderTasks();
            this.updateStats();
            
            const message = task.completed ? 'Task completed! 🎉' : 'Task marked as incomplete';
            this.showNotification(message, task.completed ? 'success' : 'info');
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveToStorage();
            this.renderTasks();
            this.updateStats();
            this.populateTeacherFilter();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No tasks found</h3>
                    <p>Add your first homework task to get started!</p>
                </div>
            `;
            return;
        }

        // Sort tasks by priority (1 is highest priority) and then by deadline
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed - b.completed; // Show incomplete tasks first
            }
            if (a.priority !== b.priority) {
                return a.priority - b.priority; // Lower number = higher priority
            }
            return new Date(a.deadline) - new Date(b.deadline);
        });

        container.innerHTML = filteredTasks.map(task => this.createTaskCard(task)).join('');
    }

    createTaskCard(task) {
        const deadline = new Date(task.deadline);
        const now = new Date();
        const isOverdue = deadline < now;
        const isSoon = (deadline - now) < 24 * 60 * 60 * 1000; // Less than 24 hours
        
        const deadlineClass = isOverdue ? 'deadline overdue' : isSoon ? 'deadline soon' : 'deadline';
        const deadlineText = isOverdue ? 'OVERDUE!' : this.formatDeadline(deadline);

        return `
            <div class="task-card ${task.completed ? 'completed' : ''}" style="animation-delay: ${Math.random() * 0.3}s">
                <div class="task-header">
                    <span class="teacher-tag">${this.escapeHtml(task.teacher)}</span>
                    <div class="priority-badge priority-${task.priority}">${task.priority}</div>
                </div>
                
                <div class="task-description">${this.escapeHtml(task.task)}</div>
                
                <div class="task-meta">
                    <div class="meta-item">
                        <i class="fas fa-file-alt"></i>
                        <span>${task.pages} page${task.pages !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="meta-item ${deadlineClass}">
                        <i class="fas fa-clock"></i>
                        <span>${deadlineText}</span>
                    </div>
                </div>
                
                <div class="task-actions">
                    <button class="btn btn-small ${task.completed ? 'btn-warning' : 'btn-success'}" 
                            onclick="homeworkManager.toggleTask(${task.id})" 
                            title="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                        <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                    </button>
                    <button class="btn btn-small btn-secondary" 
                            onclick="homeworkManager.openEditModal(${task.id})" 
                            title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger" 
                            onclick="homeworkManager.deleteTask(${task.id})" 
                            title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getFilteredTasks() {
        const teacherFilter = document.getElementById('filterTeacher').value;
        const priorityFilter = document.getElementById('filterPriority').value;

        return this.tasks.filter(task => {
            const teacherMatch = !teacherFilter || task.teacher.toLowerCase().includes(teacherFilter.toLowerCase());
            const priorityMatch = !priorityFilter || task.priority.toString() === priorityFilter;
            return teacherMatch && priorityMatch;
        });
    }

    filterTasks() {
        this.renderTasks();
    }

    populateTeacherFilter() {
        const select = document.getElementById('filterTeacher');
        const teachers = [...new Set(this.tasks.map(task => task.teacher))].sort();
        
        // Keep the current selection
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">All Teachers</option>' +
            teachers.map(teacher => `<option value="${this.escapeHtml(teacher)}">${this.escapeHtml(teacher)}</option>`).join('');
        
        // Restore selection if it still exists
        if (teachers.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const totalPages = this.tasks.reduce((sum, task) => sum + task.pages, 0);

        // Animate counters
        this.animateCounter('totalTasks', totalTasks);
        this.animateCounter('completedTasks', completedTasks);
        this.animateCounter('totalPages', totalPages);
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        const currentValue = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetValue - currentValue) / 20);
        const duration = 50;

        if (currentValue === targetValue) return;

        const timer = setInterval(() => {
            const newValue = parseInt(element.textContent) + increment;
            if ((increment > 0 && newValue >= targetValue) || (increment < 0 && newValue <= targetValue)) {
                element.textContent = targetValue;
                clearInterval(timer);
            } else {
                element.textContent = newValue;
            }
        }, duration);
    }

    formatDeadline(date) {
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Tomorrow ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays > 0 && diffDays <= 7) {
            return `${diffDays} days left`;
        } else {
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveToStorage() {
        localStorage.setItem('homework-tasks', JSON.stringify(this.tasks));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add notification styles if not already present
        if (!document.querySelector('.notification-styles')) {
            const style = document.createElement('style');
            style.className = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 10px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 1001;
                    font-weight: 600;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                    animation: slideInRight 0.3s ease-out;
                }
                .notification-success { background: #28a745; }
                .notification-error { background: #dc3545; }
                .notification-info { background: #17a2b8; }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Export functionality
    exportData() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'homework-tasks.json';
        link.click();
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully!', 'success');
    }

    // Import functionality
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.saveToStorage();
                    this.renderTasks();
                    this.updateStats();
                    this.populateTeacherFilter();
                    this.showNotification('Data imported successfully!', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing data. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the application
let homeworkManager;
document.addEventListener('DOMContentLoaded', () => {
    homeworkManager = new HomeworkManager();
});

// Keyboard shortcuts info
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === '?') {
        alert(`Keyboard Shortcuts:
        
Ctrl + N: Add new task
Escape: Close modals
Ctrl + Shift + ?: Show this help`);
    }
});
