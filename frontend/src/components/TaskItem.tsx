import React, { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import { Edit2, Trash2, CheckCircle, Circle, Clock } from 'lucide-react';
import { updateTaskStatus } from '../services/taskService';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: () => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusToggle = async () => {
    try {
      setIsUpdating(true);
      const newStatus: TaskStatus = task.status === 'Done' ? 'Todo' : 'Done';
      await updateTaskStatus(task._id, newStatus);
      onStatusChange();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update task status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const statusIcon = {
    'Todo': <Circle size={20} className="text-gray" />,
    'In Progress': <Clock size={20} className="text-blue" />,
    'Done': <CheckCircle size={20} className="text-green" />,
  };

  return (
    <div className={`task-item ${task.status === 'Done' ? 'task-done' : ''}`}>
      <div className="task-status-toggle">
        <button
          onClick={handleStatusToggle}
          disabled={isUpdating}
          className="icon-btn"
          aria-label={`Mark as ${task.status === 'Done' ? 'Todo' : 'Done'}`}
          title={`Mark as ${task.status === 'Done' ? 'Todo' : 'Done'}`}
        >
          {statusIcon[task.status]}
        </button>
      </div>
      
      <div className="task-content">
        <div className="task-header">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-badges">
            <span className={`badge badge-priority-${task.priority.toLowerCase()}`}>
              {task.priority}
            </span>
            <span className={`badge badge-status-${task.status.toLowerCase().replace(' ', '-')}`}>
              {task.status}
            </span>
          </div>
        </div>
        <p className="task-description">{task.description}</p>
        <div className="task-meta">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      </div>

      <div className="task-actions">
        <button
          onClick={() => onEdit(task)}
          className="icon-btn text-blue"
          aria-label="Edit task"
          title="Edit task"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this task?')) {
              onDelete(task._id);
            }
          }}
          className="icon-btn text-red"
          aria-label="Delete task"
          title="Delete task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
