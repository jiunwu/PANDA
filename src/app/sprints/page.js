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
  const [newSprintStartDate, setNewSprintStartDate] = useState('');
  const [newSprintEndDate, setNewSprintEndDate] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskData, setEditTaskData] = useState({ title: '', description: '', assignee: '', note: '', sprintId: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalEditData, setModalEditData] = useState({ title: '', description: '', assignee: '', note: '', sprintId: '' });

  // Auto-select first sprint or current active sprint
  useEffect(() => {
    if (sprints.length > 0 && !activeSprint) {
      const today = new Date().toISOString().split('T')[0];
      const currentActiveSprint = sprints.find(s => s.startDate && s.endDate && s.startDate <= today && s.endDate >= today);
      if (currentActiveSprint) {
        setActiveSprint(currentActiveSprint.id);
      } else {
        setActiveSprint(sprints[0].id);
      }
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
        await refetch(true);
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
      await refetch(true);
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
      await refetch(true);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }

  async function handleMoveToSprint(task, targetSprintId) {
    if (!activeSprint || !targetSprintId) return;
    setIsSubmitting(true);

    const targetSprint = sprints.find(s => s.id === targetSprintId);
    if (!targetSprint) {
      setIsSubmitting(false);
      return;
    }

    const updatedCurrentTasks = tasks.filter(t => t.id !== task.id);
    const updatedTargetTasks = [...(targetSprint.tasks || []), task];

    try {
      await Promise.all([
        fetch('/api/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sprint',
            action: 'update',
            data: { id: activeSprint, tasks: updatedCurrentTasks },
            author: 'User',
          }),
        }),
        fetch('/api/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sprint',
            action: 'update',
            data: { id: targetSprintId, tasks: updatedTargetTasks },
            author: 'User',
          }),
        })
      ]);
      await refetch(true);
    } catch (err) {
      console.error('Failed to move task to another sprint:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteSprint(sprintId) {
    if (!confirm('Are you sure you want to delete this sprint?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sprint',
          action: 'delete',
          data: { id: sprintId },
          author: 'User',
        }),
      });
      if (res.ok) {
        setActiveSprint(sprints.length > 1 ? sprints.find(s => s.id !== sprintId)?.id : null);
        await refetch(true);
      }
    } catch (err) {
      console.error('Failed to delete sprint:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateSprint(e) {
    e.preventDefault();
    if (!newSprintStartDate || !newSprintEndDate) return;
    setIsSubmitting(true);
    try {
      const id = `sprint-${Date.now()}`;
      const startDateObj = new Date(newSprintStartDate + 'T00:00:00');
      const endDateObj = new Date(newSprintEndDate + 'T00:00:00');
      const monthName = startDateObj.toLocaleString('en-US', { month: 'long' });
      const startDay = startDateObj.getDate();
      const endDay = endDateObj.getDate();
      const name = `Sprint ${monthName}: ${startDay} to ${endDay}`;
      const res = await fetch('/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sprint',
          action: 'add',
          data: {
            id,
            name,
            status: 'Active',
            startDate: newSprintStartDate,
            endDate: newSprintEndDate,
            tasks: [],
          },
          author: 'User',
        }),
      });
      if (res.ok) {
        setNewSprintStartDate('');
        setNewSprintEndDate('');
        setShowNewSprint(false);
        await refetch(true);
        setActiveSprint(id);
      }
    } catch (err) {
      console.error('Failed to create sprint:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openTaskModal(task) {
    setSelectedTask(task);
    setModalEditData({
      title: task.title || '',
      description: task.description || '',
      assignee: task.assignee || '',
      note: task.note || '',
      sprintId: activeSprint,
    });
  }

  function closeTaskModal() {
    setSelectedTask(null);
    setModalEditData({ title: '', description: '', assignee: '', note: '', sprintId: '' });
  }

  async function saveModalTask() {
    if (!selectedTask || !modalEditData.title.trim() || !activeSprint) return;

    if (modalEditData.sprintId !== activeSprint) {
      // Sprint was changed, move the task
      const updatedTask = {
        ...selectedTask,
        title: modalEditData.title.trim(),
        description: modalEditData.description.trim(),
        assignee: modalEditData.assignee,
        note: modalEditData.note.trim(),
      };
      await handleMoveToSprint(updatedTask, modalEditData.sprintId);
      closeTaskModal();
      return;
    }

    setIsSubmitting(true);

    const updatedTasks = tasks.map(t =>
      t.id === selectedTask.id ? {
        ...t,
        title: modalEditData.title.trim(),
        description: modalEditData.description.trim(),
        assignee: modalEditData.assignee,
        note: modalEditData.note.trim()
      } : t
    );

    try {
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
        await refetch(true);
        closeTaskModal();
      }
    } catch (err) {
      console.error('Failed to update task from modal:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEditTask(task) {
    setEditingTaskId(task.id);
    setEditTaskData({
      title: task.title || '',
      description: task.description || '',
      assignee: task.assignee || '',
      note: task.note || '',
      sprintId: activeSprint,
    });
  }

  function cancelEditTask() {
    setEditingTaskId(null);
    setEditTaskData({ title: '', description: '', assignee: '', note: '', sprintId: '' });
  }

  async function saveEditTask(taskId) {
    if (!editTaskData.title.trim() || !activeSprint) return;

    const originalTask = tasks.find(t => t.id === taskId);

    if (editTaskData.sprintId !== activeSprint) {
       // Sprint was changed, move the task
       const updatedTask = {
         ...originalTask,
         title: editTaskData.title.trim(),
         description: editTaskData.description !== undefined ? editTaskData.description.trim() : originalTask.description,
         assignee: editTaskData.assignee !== undefined ? editTaskData.assignee : originalTask.assignee,
         note: editTaskData.note !== undefined ? editTaskData.note.trim() : originalTask.note,
       };
       await handleMoveToSprint(updatedTask, editTaskData.sprintId);
       cancelEditTask();
       return;
    }

    setIsSubmitting(true);

    const updatedTasks = tasks.map(t =>
      t.id === taskId ? {
        ...t,
        title: editTaskData.title.trim(),
        description: editTaskData.description !== undefined ? editTaskData.description.trim() : t.description,
        assignee: editTaskData.assignee !== undefined ? editTaskData.assignee : t.assignee,
        note: editTaskData.note !== undefined ? editTaskData.note.trim() : t.note
      } : t
    );

    try {
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
        await refetch(true);
        cancelEditTask();
      }
    } catch (err) {
      console.error('Failed to update task:', err);
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
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px', marginLeft: '12px', color: 'var(--error, #e53e3e)' }}
                onClick={() => handleDeleteSprint(currentSprint.id)}
                disabled={isSubmitting}
                title="Delete Sprint"
              >
                Delete Sprint
              </button>
            </div>
          )}
        </div>

        {/* New sprint form */}
        {showNewSprint && (
          <form onSubmit={handleCreateSprint} className="board-new-sprint-form">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
              <input type="date" className="field-input" value={newSprintStartDate} onChange={e => setNewSprintStartDate(e.target.value)} required />
              <span>to</span>
              <input type="date" className="field-input" value={newSprintEndDate} onChange={e => setNewSprintEndDate(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !newSprintStartDate || !newSprintEndDate}>
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
                        draggable={editingTaskId !== task.id}
                        onDragStart={e => {
                          if (editingTaskId !== task.id) handleDragStart(e, task);
                        }}
                        onDragEnd={handleDragEnd}
                      >
                        {editingTaskId === task.id ? (
                          <div className="board-task-form">
                            <input
                              className="field-input"
                              type="text"
                              placeholder="Task title..."
                              value={editTaskData.title}
                              onChange={e => setEditTaskData({ ...editTaskData, title: e.target.value })}
                              disabled={isSubmitting}
                              autoFocus
                            />
                            <textarea
                              className="field-input"
                              placeholder="Short description..."
                              value={editTaskData.description}
                              onChange={e => setEditTaskData({ ...editTaskData, description: e.target.value })}
                              disabled={isSubmitting}
                              rows={2}
                              style={{ resize: 'vertical' }}
                            />
                            <select
                              className="field-input"
                              value={editTaskData.assignee}
                              onChange={e => setEditTaskData({ ...editTaskData, assignee: e.target.value })}
                              disabled={isSubmitting}
                            >
                              <option value="">Unassigned</option>
                              <option value="Nina">Nina</option>
                              <option value="Jiun">Jiun</option>
                              <option value="Together">Together</option>
                            </select>
                            <select
                              className="field-input"
                              value={editTaskData.sprintId}
                              onChange={e => setEditTaskData({ ...editTaskData, sprintId: e.target.value })}
                              disabled={isSubmitting}
                              style={{ marginTop: '4px' }}
                            >
                              {sprints.map(s => (
                                <option key={s.id} value={s.id}>{s.name || s.id}</option>
                              ))}
                            </select>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => saveEditTask(task.id)}
                                disabled={isSubmitting || !editTaskData.title.trim()}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={cancelEditTask}
                                disabled={isSubmitting}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ cursor: 'pointer' }} onClick={() => openTaskModal(task)}>
                              <div className="board-task-title">{task.title}</div>
                              {task.description && (
                                <div style={{
                                  fontSize: '12px',
                                  color: 'var(--text-secondary)',
                                  marginBottom: '8px',
                                  whiteSpace: 'pre-wrap',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {task.description}
                                </div>
                              )}
                              {task.assignee && (
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                                  👤 {task.assignee}
                                </div>
                              )}
                              <div style={{
                                display: 'inline-block',
                                marginTop: '4px',
                                fontSize: '14px',
                                filter: task.note ? 'none' : 'grayscale(100%) opacity(50%)'
                              }} title={task.note ? "Note attached" : "No note"}>
                                📝
                              </div>
                            </div>
                            <div className="board-task-actions">
                              <span className="board-task-id">{task.id}</span>
                              <div className="board-task-move-btns">
                                <button
                                  className="board-move-btn"
                                  onClick={() => startEditTask(task)}
                                  title="Edit task"
                                >✎</button>
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
                                {sprints.findIndex(s => s.id === activeSprint) < sprints.length - 1 && (
                                  <button
                                    className="board-move-btn"
                                    onClick={() => handleMoveToSprint(task, sprints[sprints.findIndex(s => s.id === activeSprint) + 1].id)}
                                    title="Push to next sprint"
                                  >⏭</button>
                                )}
                                <button
                                  className="board-move-btn board-delete-btn"
                                  onClick={() => handleDeleteTask(task.id)}
                                  title="Delete task"
                                >✕</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          onClick={closeTaskModal}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--white)', padding: '24px', borderRadius: '8px',
              width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Task Details</h2>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Title</label>
              <input
                className="field-input"
                type="text"
                placeholder="Task title..."
                value={modalEditData.title}
                onChange={e => setModalEditData({ ...modalEditData, title: e.target.value })}
                disabled={isSubmitting}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Description</label>
              <textarea
                className="field-input"
                placeholder="Full description..."
                value={modalEditData.description}
                onChange={e => setModalEditData({ ...modalEditData, description: e.target.value })}
                disabled={isSubmitting}
                rows={3}
                style={{ resize: 'vertical', width: '100%', padding: '8px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Note</label>
              <textarea
                className="field-input"
                placeholder="Private note..."
                value={modalEditData.note}
                onChange={e => setModalEditData({ ...modalEditData, note: e.target.value })}
                disabled={isSubmitting}
                rows={5}
                style={{ resize: 'vertical', width: '100%', padding: '8px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Assignee</label>
              <select
                className="field-input"
                value={modalEditData.assignee}
                onChange={e => setModalEditData({ ...modalEditData, assignee: e.target.value })}
                disabled={isSubmitting}
                style={{ width: '100%', padding: '8px' }}
              >
                <option value="">Unassigned</option>
                <option value="Nina">Nina</option>
                <option value="Jiun">Jiun</option>
                <option value="Together">Together</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Sprint</label>
              <select
                className="field-input"
                value={modalEditData.sprintId}
                onChange={e => setModalEditData({ ...modalEditData, sprintId: e.target.value })}
                disabled={isSubmitting}
                style={{ width: '100%', padding: '8px' }}
              >
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name || s.id}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={closeTaskModal}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveModalTask}
                disabled={isSubmitting || !modalEditData.title.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
