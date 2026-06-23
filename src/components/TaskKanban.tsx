import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Edit2, Trash2, Calendar, AlertTriangle } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate?: string;
}

const TaskKanban: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', dueDate: '' });

  const columns = ['Open', 'In Progress', 'Pending', 'Approved', 'Closed'];

  // Real-time task listener
  useEffect(() => {
    if (!projectId) return;

    const q = query(collection(db, 'tasks'), where('projectId', '==', projectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
      setTasks(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Update task status (for drag & drop + dropdown)
  const updateStatus = async (taskId: string, newStatus: string) => {
    await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
  };

  // Save edited task
  const saveTask = async () => {
    if (!editingTask) return;

    await updateDoc(doc(db, 'tasks', editingTask.id), {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      dueDate: editForm.dueDate || null,
    });

    setEditingTask(null);
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    await deleteDoc(doc(db, 'tasks', taskId));
  };

  // Start editing a task
  const startEditing = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
    });
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) updateStatus(taskId, newStatus);
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) return <div className="p-6">Loading tasks...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6">Compliance Tasks</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {columns.map((status) => {
          const columnTasks = tasks.filter(t => t.status === status);

          return (
            <div
              key={status}
              className="bg-gray-50 rounded-xl p-4 min-h-[520px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-50 py-2 z-10">
                <span className="font-semibold text-gray-800">{status}</span>
                <span className="text-xs bg-white px-2.5 py-1 rounded-full border text-gray-600">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 border border-dashed border-gray-300 rounded-xl">
                    Drop tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow transition group"
                    >
                      {editingTask?.id === task.id ? (
                        // Edit Mode
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm font-medium"
                            placeholder="Task title"
                          />
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 resize-y"
                            placeholder="Description (optional)"
                          />
                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                          <div className="flex gap-2 pt-1">
                            <button onClick={saveTask} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
                            <button onClick={() => setEditingTask(null)} className="flex-1 bg-gray-200 py-2 rounded-lg text-sm font-medium hover:bg-gray-300">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900 pr-2 leading-snug">{task.title}</h4>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => startEditing(task)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => deleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{task.description}</p>
                          )}

                          <div className="flex items-center justify-between text-xs mt-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full font-medium ${
                                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {task.priority}
                              </span>

                              {task.dueDate && (
                                <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                  <Calendar size={13} />
                                  {new Date(task.dueDate).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}
                                  {isOverdue(task.dueDate) && <AlertTriangle size={13} />}
                                </span>
                              )}
                            </div>

                            <select
                              value={task.status}
                              onChange={(e) => updateStatus(task.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            >
                              {columns.map(col => <option key={col} value={col}>{col}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskKanban;
