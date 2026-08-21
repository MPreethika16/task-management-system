import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDebounce } from '../hooks/useDebounce';
import type { Task, TaskStatus, TaskPriority, Pagination as PaginationType } from '../types';
import { getTasks, deleteTask } from '../services/taskService';
import { TaskItem } from '../components/TaskItem';
import { TaskForm } from '../components/TaskForm';
import { Pagination } from '../components/Pagination';
import { Search, LogOut, Plus } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Query state
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<TaskPriority | ''>('');
  const [sort, setSort] = useState<'createdAt' | 'dueDate' | 'priority'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 10;

  // UI state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const fetchTasks = useCallback(async (currentPage: number) => {
    try {
      setLoading(true);
      setError('');
      const response = await getTasks({
        search: debouncedSearch,
        status,
        priority,
        sort,
        order,
        page: currentPage,
        limit
      });
      setTasks(response.tasks);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, priority, sort, order, limit]);

  // Refetch when filters or page change
  useEffect(() => {
    fetchTasks(page);
  }, [fetchTasks, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, priority, sort, order]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
      // Adjust page if we deleted the last item on current page
      if (tasks.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchTasks(page);
      }
    } catch (err) {
      console.error('Failed to delete task', err);
      alert('Failed to delete task.');
    }
  };

  const handleCreateNew = () => {
    setTaskToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchTasks(page);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>My Tasks</h1>
          <div className="user-controls">
            <span className="user-email">{user?.email}</span>
            <button onClick={logout} className="btn btn-secondary btn-icon" aria-label="Logout" title="Logout">
              <LogOut size={18} />
              <span className="hide-mobile">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="controls-bar">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search tasks"
            />
          </div>

          <div className="filters">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              aria-label="Filter by priority"
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <select
              value={`${sort}-${order}`}
              onChange={(e) => {
                const [newSort, newOrder] = e.target.value.split('-');
                setSort(newSort as any);
                setOrder(newOrder as any);
              }}
              aria-label="Sort tasks"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="dueDate-asc">Due Date (Asc)</option>
              <option value="dueDate-desc">Due Date (Desc)</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
            </select>

            {(status || priority || search) && (
              <button 
                onClick={() => { setStatus(''); setPriority(''); setSearch(''); }}
                className="btn btn-text"
              >
                Clear Filters
              </button>
            )}
          </div>

          <button onClick={handleCreateNew} className="btn btn-primary btn-icon">
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="tasks-container">
          {loading ? (
            <div className="loading-state">Loading tasks...</div>
          ) : tasks.length > 0 ? (
            <div className="task-list">
              {tasks.map(task => (
                <TaskItem
                  key={task._id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onStatusChange={() => fetchTasks(page)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {(search || status || priority) 
                ? 'No tasks match the current filters.'
                : 'No tasks yet. Create your first task.'}
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
          />
        )}
      </main>

      {isFormOpen && (
        <TaskForm
          taskToEdit={taskToEdit}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};
