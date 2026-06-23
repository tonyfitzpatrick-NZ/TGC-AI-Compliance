import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Edit2, Trash2, Calendar, AlertTriangle, MessageCircle } from 'lucide-react';

interface Comment {
  text: string;
  createdAt: any;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate?: string;
  comments?: Comment[];
}

const TaskKanban: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', dueDate: '' });
  const [newComment, setNewComment] = useState('');
  const [addingCommentTo, setAddingCommentTo] = useState<string | null>(null);

  const columns = ['Open', 'In Progress', 'Pending', 'Approved', 'Closed'];

  // Real-time listener
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

  const updateStatus = async (taskId: string, newStatus: string) => {
    await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
  };

  const saveTask = async () => {
    if (!editingTask) return;

    await updateDoc(doc(db, 'tasks', editingTask.id), {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      dueDate: editForm.dueDate || null,
    });
    setEditingTask(null);
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    await deleteDoc(doc(db, 'tasks', taskId));
  };

  const startEditing = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || '',
    });
    setAddingCommentTo(null);
  };

  // Add comment to task
  const addComment = async (taskId: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      text: newComment.trim(),
      createdAt: new Date(),
    };

    await updateDoc(doc(db, 'tasks', taskId), {
      comments: arrayUnion(comment)
    });

    setNewComment('');
    setAddingCommentTo(null);
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {columns.map((status) => {
          const columnTasks = tasks.filter(t => t.status === status);

          return (
            <div
              key={status}
              className="bg-gray-50 rounded-2xl p-5 min-h-[620px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-semibold text-xl text-gray-800">{status}</span>
                <span className="text-sm font-medium bg-white px-3.5 py-1 rounded-full border text-gray-600">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-4">
                {columnTasks.length === 0 ? (
                  <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 text-sm">
                    Drop tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition group"
                    >
                      {editingTask?.id === task.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full border border-blue-400 rounded-xl px-4 py-2.5 text-base font-medium"
                            placeholder="Task title"
                          />
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm h-24 resize-y"
                            placeholder="Description"
                          />
                          <input
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm"
                          />
                          <div className="flex gap-3">
                            <button onClick={saveTask} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700">Save</button>
                            <button onClick={() => setEditingTask(null)} className="flex-1 bg-gray-200 py-2.5 rounded-xl font-medium hover:bg-gray-300">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <h4 className="font-semibold text-gray-900 text-[15px] leading-snug pr-2 break-words">{task.title}</h4>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                              <button onClick={() => startEditing(task)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl">
                                <Edit2 size={17} />
                              </button>
                              <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-sm text-gray-600 mb-4 whitespace-pre-wrap leading-relaxed break-words">{task.description}</p>
                          )}

                          {/* Comments Section */}
                          <div className="mb-4">
                            {(task.comments && task.comments.length > 0) && (
                              <div className="mb-3 space-y-2">
                                {task.comments.map((comment, index) => (
                                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm">
                                    <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                      {comment.createdAt?.toDate?.().toLocaleDateString('en-NZ') || 'Just now'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment */}
                            {addingCommentTo === task.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Add a note..."
                                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') addComment(task.id);
                                    if (e.key === 'Escape') {
                                      setAddingCommentTo(null);
                                      setNewComment('');
                                    }
                                  }}
                                />
                                <button 
                                  onClick={() => addComment(task.id)} 
                                  className="px-4 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
                                >
                                  Add
                                </button>
                                <button 
                                  onClick={() => { setAddingCommentTo(null); setNewComment(''); }} 
                                  className="px-4 bg-gray-200 rounded-xl text-sm font-medium hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setAddingCommentTo(task.id)} 
                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 mt-1"
                              >
                                <MessageCircle size={14} /> Add note
                              </button>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className={`px-3 py-1.5 rounded-full font-medium text-xs ${
                                task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {task.priority}
                              </span>

                              {task.dueDate && (
                                <span className={`flex items-center gap-1.5 ${isOverdue(task.dueDate) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                  <Calendar size={15} />
                                  {new Date(task.dueDate).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' })}
                                  {isOverdue(task.dueDate) && <AlertTriangle size={15} />}
                                </span>
                              )}
                            </div>

                            <select
                              value={task.status}
                              onChange={(e) => updateStatus(task.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none"
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
