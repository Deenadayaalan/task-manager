import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import api from '../services/api';
import TaskCard from './TaskCard';
import { useNotification } from '../contexts/NotificationContext';

const COLUMNS = [
  { status: 'TODO', title: 'To Do' },
  { status: 'IN_PROGRESS', title: 'In Progress' },
  { status: 'DONE', title: 'Done' },
];

function BoardColumn({ status, title, tasks }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`board-column${isOver ? ' board-column--over' : ''}`}
      aria-label={`${title} column, ${tasks.length} tasks`}
    >
      <div className="board-column__header">
        <h3>{title}</h3>
        <span className="board-column__count">{tasks.length}</span>
      </div>
      <div className="board-column__cards">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function Board() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { showNotification } = useNotification();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    api.get('/tasks')
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredTasks = searchQuery
    ? tasks.filter((t) => {
        const query = searchQuery.toLowerCase();
        const titleMatch = t.title && t.title.toLowerCase().includes(query);
        const descMatch = t.description && t.description.toLowerCase().includes(query);
        return titleMatch || descMatch;
      })
    : tasks;

  const groupedTasks = {
    TODO: filteredTasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: filteredTasks.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: filteredTasks.filter((t) => t.status === 'DONE'),
  };

  function findColumnForTask(taskId) {
    const task = tasks.find((t) => String(t.id) === String(taskId));
    return task ? task.status : null;
  }

  function handleDragStart(event) {
    const task = tasks.find((t) => String(t.id) === String(event.active.id));
    setActiveTask(task || null);
  }

  async function handleDragEnd(event) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const currentStatus = findColumnForTask(taskId);

    // The "over" target could be a column ID or another task card.
    // If it's a column ID (TODO, IN_PROGRESS, DONE), use it directly.
    // Otherwise, find which column the target task belongs to.
    let newStatus = over.id;
    if (!COLUMNS.some((c) => c.status === newStatus)) {
      newStatus = findColumnForTask(over.id);
    }

    if (!newStatus || currentStatus === newStatus) return;

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) =>
        String(t.id) === String(taskId) ? { ...t, status: newStatus } : t
      )
    );

    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch (err) {
      // Revert on error
      setTasks(previousTasks);
      showNotification('Failed to update status', 'error');
      setError(`Failed to update task status: ${err.message}`);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div className="board">
      <div className="board-header">
        <h2 className="page-title">Board</h2>
        <div className="search-bar">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
          />
        </div>
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board-columns">
          {COLUMNS.map((col) => (
            <BoardColumn
              key={col.status}
              status={col.status}
              title={col.title}
              tasks={groupedTasks[col.status]}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="task-card" style={{ opacity: 0.85, cursor: 'grabbing' }}>
              <span className="task-card__title">{activeTask.title}</span>
              <div className="task-card__meta">
                <span className={`badge badge--priority-${(activeTask.priority || 'medium').toLowerCase()}`}>
                  {(activeTask.priority || 'MEDIUM').toUpperCase()}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default Board;
