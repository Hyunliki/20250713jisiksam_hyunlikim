class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.hideLoading();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'flex';
        }
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    }

    bindEvents() {
        // 할 일 추가
        const addBtn = document.getElementById('addBtn');
        const todoInput = document.getElementById('todoInput');

        if (addBtn) {
            addBtn.addEventListener('click', () => this.addTodo());
        }
        
        if (todoInput) {
            todoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTodo();
                }
            });
        }

        // 필터 버튼
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // 삭제 버튼들
        const clearCompletedBtn = document.getElementById('clearCompleted');
        const clearAllBtn = document.getElementById('clearAll');
        
        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        }
        
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAll());
        }
    }

    addTodo() {
        const input = document.getElementById('todoInput');
        if (!input) return;
        
        const text = input.value.trim();

        if (text === '') {
            this.showSweetAlert('할 일을 입력해주세요!', 'warning');
            return;
        }

        // 마감일 설정 여부 확인
        Swal.fire({
            title: '마감일 설정',
            text: '이 할 일에 마감일을 설정하시겠습니까?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '마감일 설정',
            cancelButtonText: '마감일 없음',
            reverseButtons: true
        }).then((result) => {
            let dueDate = null;
            
            if (result.isConfirmed) {
                // 마감일 설정 다이얼로그
                Swal.fire({
                    title: '마감일 설정',
                    html: `
                        <div class="mb-3">
                            <label class="form-label">할 일 내용</label>
                            <input id="swal-input1" class="form-control" value="${text}" readonly>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">마감일</label>
                            <input id="swal-input2" class="form-control" type="datetime-local" required>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: '추가',
                    cancelButtonText: '취소',
                    preConfirm: () => {
                        const dueDateInput = document.getElementById('swal-input2').value;
                        if (!dueDateInput) {
                            Swal.showValidationMessage('마감일을 선택해주세요!');
                            return false;
                        }
                        return dueDateInput;
                    }
                }).then((dateResult) => {
                    if (dateResult.isConfirmed) {
                        dueDate = new Date(dateResult.value).toISOString();
                        this.createTodo(text, dueDate);
                    }
                });
            } else {
                this.createTodo(text, dueDate);
            }
        });
    }

    createTodo(text, dueDate) {
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: dueDate
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.render();
        this.updateStats();

        const input = document.getElementById('todoInput');
        if (input) input.value = '';
        
        this.showSweetAlert('할 일이 추가되었습니다!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
            this.updateStats();
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;

        Swal.fire({
            title: '할 일 수정',
            html: `
                <div class="mb-3">
                    <label class="form-label">할 일 내용</label>
                    <input id="swal-input1" class="form-control" value="${todo.text}" placeholder="수정할 내용을 입력하세요...">
                </div>
                <div class="mb-3">
                    <label class="form-label">마감일 (선택사항)</label>
                    <input id="swal-input2" class="form-control" type="datetime-local" value="${todo.dueDate ? todo.dueDate.slice(0, 16) : ''}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '수정',
            cancelButtonText: '취소',
            preConfirm: () => {
                const text = document.getElementById('swal-input1').value.trim();
                const dueDate = document.getElementById('swal-input2').value;
                
                if (!text) {
                    Swal.showValidationMessage('할 일을 입력해주세요!');
                    return false;
                }
                
                return {
                    text: text,
                    dueDate: dueDate ? new Date(dueDate).toISOString() : null
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                todo.text = result.value.text;
                todo.dueDate = result.value.dueDate;
                this.saveTodos();
                this.render();
                this.showSweetAlert('할 일이 수정되었습니다!', 'success');
            }
        });
    }

    deleteTodo(id) {
        Swal.fire({
            title: '할 일 삭제',
            text: '정말로 이 할 일을 삭제하시겠습니까?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        }).then((result) => {
            if (result.isConfirmed) {
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveTodos();
                this.render();
                this.updateStats();
                this.showSweetAlert('할 일이 삭제되었습니다!', 'success');
            }
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // 필터 버튼 활성화 상태 변경
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeFilterBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeFilterBtn) {
            activeFilterBtn.classList.add('active');
        }
        
        this.render();
    }

    clearCompleted() {
        Swal.fire({
            title: '완료된 항목 삭제',
            text: '완료된 모든 할 일을 삭제하시겠습니까?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        }).then((result) => {
            if (result.isConfirmed) {
                this.todos = this.todos.filter(t => !t.completed);
                this.saveTodos();
                this.render();
                this.updateStats();
                this.showSweetAlert('완료된 할 일들이 삭제되었습니다!', 'success');
            }
        });
    }

    clearAll() {
        Swal.fire({
            title: '전체 삭제',
            text: '모든 할 일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '전체 삭제',
            cancelButtonText: '취소',
            dangerMode: true
        }).then((result) => {
            if (result.isConfirmed) {
                this.todos = [];
                this.saveTodos();
                this.render();
                this.updateStats();
                this.showSweetAlert('모든 할 일이 삭제되었습니다!', 'success');
            }
        });
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const todoList = document.getElementById('todoList');
        if (!todoList) return;
        
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            todoList.innerHTML = this.getEmptyStateHTML();
            return;
        }

        todoList.innerHTML = filteredTodos.map(todo => this.getTodoItemHTML(todo)).join('');
        
        // 이벤트 리스너 다시 바인딩
        this.bindTodoItemEvents();
    }

    getTodoItemHTML(todo) {
        const completedClass = todo.completed ? 'completed' : '';
        const checked = todo.completed ? 'checked' : '';
        const createdDate = this.formatDate(todo.createdAt);
        const dueDateText = todo.dueDate ? this.formatDate(todo.dueDate) : null;
        
        // 마감일 지남 여부 확인
        const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();
        const overdueClass = isOverdue ? 'overdue' : '';
        
        return `
            <div class="todo-item d-flex align-items-center ${completedClass} ${overdueClass}" data-id="${todo.id}">
                <div class="form-check me-3">
                    <input type="checkbox" class="form-check-input todo-checkbox" ${checked}>
                </div>
                <div class="flex-grow-1">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-date">
                        <i class="fas fa-calendar-plus me-1"></i>생성: ${createdDate}
                        ${dueDateText ? `<span class="ms-3"><i class="fas fa-calendar-check me-1"></i>마감: ${dueDateText}</span>` : ''}
                        ${isOverdue ? '<span class="badge bg-danger ms-2"><i class="fas fa-exclamation-triangle me-1"></i>마감일 지남</span>' : ''}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="btn btn-sm btn-outline-primary edit-btn" title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getEmptyStateHTML() {
        const messages = {
            all: { icon: 'fas fa-clipboard-list', title: '할 일이 없습니다', message: '새로운 할 일을 추가해보세요!' },
            active: { icon: 'fas fa-check-circle', title: '진행중인 할 일이 없습니다', message: '모든 할 일이 완료되었습니다!' },
            completed: { icon: 'fas fa-tasks', title: '완료된 할 일이 없습니다', message: '할 일을 완료해보세요!' }
        };

        const current = messages[this.currentFilter];
        
        return `
            <div class="empty-state">
                <i class="${current.icon}"></i>
                <h3>${current.title}</h3>
                <p>${current.message}</p>
            </div>
        `;
    }

    bindTodoItemEvents() {
        // 체크박스 이벤트
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const todoItem = e.target.closest('.todo-item');
                const id = parseInt(todoItem.dataset.id);
                this.toggleTodo(id);
            });
        });

        // 수정 버튼 이벤트
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const todoItem = e.target.closest('.todo-item');
                const id = parseInt(todoItem.dataset.id);
                this.editTodo(id);
            });
        });

        // 삭제 버튼 이벤트
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const todoItem = e.target.closest('.todo-item');
                const id = parseInt(todoItem.dataset.id);
                this.deleteTodo(id);
            });
        });
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const active = total - completed;

        const totalElement = document.getElementById('totalCount');
        const activeElement = document.getElementById('activeCount');
        const completedElement = document.getElementById('completedCount');

        if (totalElement) totalElement.textContent = total;
        if (activeElement) activeElement.textContent = active;
        if (completedElement) completedElement.textContent = completed;
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const formattedDate = date.toLocaleDateString('ko-KR', options);
        
        // 상대적 시간 표시
        if (diffDays === 0) {
            return `${formattedDate} (오늘)`;
        } else if (diffDays === 1) {
            return `${formattedDate} (내일)`;
        } else if (diffDays === -1) {
            return `${formattedDate} (어제)`;
        } else if (diffDays > 1 && diffDays <= 7) {
            return `${formattedDate} (${diffDays}일 후)`;
        } else if (diffDays < -1 && diffDays >= -7) {
            return `${formattedDate} (${Math.abs(diffDays)}일 전)`;
        }
        
        return formattedDate;
    }

    showSweetAlert(message, type = 'info') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: type,
            title: message
        });
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    // SweetAlert2 기본 설정
    Swal.mixin({
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        reverseButtons: true
    });

    new TodoApp();
});
