'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDashboardData } from '@/hooks/useDashboardData';

const COLUMNS = [
  { id: 'todo', label: 'To Do', icon: '○' },
  { id: 'in_progress', label: 'On Going', icon: '◑' },
  { id: 'done', label: 'Finished', icon: '●' },
];

function mapStatus(status) {
  if (!status) return 'todo';
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (['done', 'completed', 'finished'].includes(s)) return 'done';
  if (['active', 'in_progress', 'ongoing', 'in progress', 'on_going'].includes(s)) return 'in_progress';
  return 'todo';
}

export default function SprintsPage() {
  const { data, loading, refetch } = useDashboardData();
  const sprints = data?.sprints || [];
  const [activeSprint, setActiveSprint] = useState(null);
  const [showAddTask, setShowAddTask] = useState(null); // column id
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewSprint, setShowNewSprint] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);

  // Auto-select first sprint
  useEffect(() => {
    if (sprints.length > 0 && !activeSprint) {
      setActiveSprint(sprints[0].id);
    }
  }, [sprints, activeSprint]);

  const currentSprint = sprints.find(s => s.id === activeSprint);
  const tasks = currentSprint?.tasks || [];

  // Group tasks by column
  const grouped = {
    todo: tasks.filter(t => mapStatus(t.status) === 'todo'),
    in_progress: tasks.filter(t => mapStatus(t.status) === 'in_progress'),
    done: tasks.filter(t => mapStatus(t.status) === 'done'),
  };

  async function handleAddTask(columnId) {
    if (!newTaskTitle.trim() || !activeSprint) return;
    setIsSubmitting(true);
    try {
      const updatedTasks = [
        ...tasks,
        {
          id: `task-${Date.now()}`,
          title: newTaskTitle.trim(),
          status: columnId === 'in_progress' ? 'in_progress' : columnId === 'done' ? 'done' : 'todo',
        }
      ];
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sprint',
          action: 'update',
          data: { id: activeSprint, tasks: updatedTasks },
          author: 'User',
        }),
      });
      if (res.ok) {
        setNewTaskTitle('');
        setShowAddTask(null);
        await refetch();
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMoveTask(taskId, targetColumn) {
    if (!activeSprint) return;
    const newStatus = targetColumn === 'in_progress' ? 'in_progress' : targetColumn === 'done' ? 'done' : 'todo';
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    try {
      await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sprint',
          action: 'update',
          data: { id: activeSprint, tasks: updatedTasks },
          author: 'User',
        }),
      });
      await refetch();
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  }

  async function handleDeleteTask(taskId) {
    if (!activeSprint) return;
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    try {
      await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sprint',
          action: 'update',
          data: { id: activeSprint, tasks: updatedTasks },
          author: 'User',
        }),
      });
      await refetch();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }

  async function handleCreateSprint(e) {
    e.preventDefault();
    if (!newSprintName.trim()) return;
    setIsSubmitting(true);
    try {
      const id = `sprint-${Date.now()}`;
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sprint',
          action: 'add',
          data: {
            id,
            name: newSprintName.trim(),
            status: 'Active',
            startDate: new Date().toISOString().split('T')[0],
            tasks: [],
          },
          author: 'User',
        }),
      });
      if (res.ok) {
        setNewSprintName('');
        setShowNewSprint(false);
        await refetch();
        setActiveSprint(id);
      }
    } catch (err) {
      console.error('Failed to create sprint:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Drag handlers
  function handleDragStart(e, task) {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  }

  function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1';
    setDraggedTask(null);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e, columnId) {
    e.preventDefault();
    if (draggedTask && mapStatus(draggedTask.status) !== columnId) {
      handleMoveTask(draggedTask.id, columnId);
    }
    setDraggedTask(null);
  }

  return (
    <>
      <header className="page-header" id="sprints-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Sprint Board</h1>
            <p>Plan and track your tasks across sprints in a Kanban-style board.</p>
          </div>
          <Link href="/dashboard" className="btn btn-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <section className="section" id="sprints-content" style={{ paddingTop: '24px' }}>
        {/* Sprint selector */}
        <div className="board-sprint-bar">
          <div className="board-sprint-tabs">
            {sprints.map(sprint => (
              <button
                key={sprint.id}
                className={`board-sprint-tab ${activeSprint === sprint.id ? 'board-sprint-tab-active' : ''}`}
                onClick={() => setActiveSprint(sprint.id)}
              >
                <span className="board-sprint-tab-name">{sprint.name || sprint.id}</span>
                <span className="board-sprint-tab-count">{(sprint.tasks || []).length}</span>
              </button>
            ))}
            <button
              className="board-sprint-tab board-sprint-tab-new"
              onClick={() => setShowNewSprint(true)}
            >
              + New Sprint
            </button>
          </div>
          {currentSprint && (
            <div className="board-sprint-meta">
              <span className="source-tag">{currentSprint.status || 'Active'}</span>
              {currentSprint.startDate && (
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  {currentSprint.startDate}{currentSprint.endDate ? ` → ${currentSprint.endDate}` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* New sprint form */}
        {showNewSprint && (
          <form onSubmit={handleCreateSprint} className="board-new-sprint-form">
            <input
              className="field-input"
              type="text"
              placeholder="Sprint name (e.g. Sprint 4 – UI Polish)"
              value={newSprintName}
              onChange={e => setNewSprintName(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !newSprintName.trim()}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowNewSprint(false)}>
              Cancel
            </button>
          </form>
        )}

        {/* Board */}
        {loading ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '40px 0', textAlign: 'center' }}>Loading board...</div>
        ) : !currentSprint ? (
          <div style={{ color: 'var(--text-tertiary)', padding: '60px 0', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', marginBottom: '12px' }}>No sprints yet.</p>
            <button className="btn btn-primary" onClick={() => setShowNewSprint(true)}>Create your first sprint</button>
          </div>
        ) : (
          <div className="board-columns">
            {COLUMNS.map(col => {
              const colTasks = grouped[col.id];
              return (
                <div
                  key={col.id}
                  className="board-column"
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, col.id)}
                >
                  <div className="board-column-header">
                    <div className="board-column-title">
                      <span className={`board-column-icon board-column-icon-${col.id}`}>{col.icon}</span>
                      <span>{col.label}</span>
                      <span className="board-column-count">{colTasks.length}</span>
                    </div>
                    <button
                      className="board-add-btn"
                      onClick={() => { setShowAddTask(col.id); setNewTaskTitle(''); }}
                      title={`Add task to ${col.label}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="board-column-body">
                    {/* Add task inline form */}
                    {showAddTask === col.id && (
                      <div className="board-task-form">
                        <input
                          className="field-input"
                          type="text"
                          placeholder="Task title..."
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddTask(col.id);
                            if (e.key === 'Escape') setShowAddTask(null);
                          }}
                          autoFocus
                          disabled={isSubmitting}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => handleAddTask(col.id)}
                            disabled={isSubmitting || !newTaskTitle.trim()}
                          >
                            Add
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => setShowAddTask(null)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    )}

                    {colTasks.length === 0 && showAddTask !== col.id && (
                      <div className="board-empty">No tasks</div>
                    )}

                    {colTasks.map(task => (
                      <div
                        key={task.id}
                        className="board-task-card"
                        draggable
                        onDragStart={e => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="board-task-title">{task.title}</div>
                        <div className="board-task-actions">
                          <span className="board-task-id">{task.id}</span>
                          <div className="board-task-move-btns">
                            {col.id !== 'todo' && (
                              <button
                                className="board-move-btn"
                                onClick={() => handleMoveTask(task.id, col.id === 'done' ? 'in_progress' : 'todo')}
                                title="Move left"
                              >←</button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                className="board-move-btn"
                                onClick={() => handleMoveTask(task.id, col.id === 'todo' ? 'in_progress' : 'done')}
                                title="Move right"
                              >→</button>
                            )}
                            <button
                              className="board-move-btn board-delete-btn"
                              onClick={() => handleDeleteTask(task.id)}
                              title="Delete task"
                            >✕</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
