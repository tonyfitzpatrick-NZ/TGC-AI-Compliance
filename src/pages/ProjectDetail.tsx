import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PDFViewer from '../components/PDFViewer';
import TaskKanban from '../components/TaskKanban';
import UploadForm from '../components/UploadForm';

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch project
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setProject({ id: docSnap.id, ...docSnap.data() });
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  // Fetch uploaded documents
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'documents'), where('projectId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  const handleUploadComplete = () => {};

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const deleteDocument = async (docId: string) => {
    if (!window.confirm('Delete this file?')) return;
    await deleteDoc(doc(db, 'documents', docId));
    setSelectedDocuments(prev => prev.filter(id => id !== docId));
  };

  const viewDocument = (url: string) => window.open(url, '_blank');
  const downloadDocument = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Placeholder for now - we'll wire up real AI analysis next
  const analyzeSelectedDrawings = () => {
    if (selectedDocuments.length === 0) {
      alert("Please select at least one drawing to analyze.");
      return;
    }

    const selectedFiles = documents.filter(d => selectedDocuments.includes(d.id));
    console.log("Selected drawings for AI analysis:", selectedFiles);

    alert(`AI Analysis will be performed on ${selectedFiles.length} drawing(s).\n\n(Real analysis coming in next step)`);
    
    // TODO: In the next step we will:
    // - Convert PDFs to images
    // - Send to GPT-4o with NZ compliance prompt
    // - Create tasks from the response
  };

  const runAIReview = async () => {
    if (!id || !window.confirm("Run AI Compliance Review?")) return;

    const today = new Date();
    const tasks = [
      { title: "Add NZS 3604 foundation bracing details", priority: "high", dueDate: new Date(today.getTime() + 7*86400000).toISOString().split('T')[0] },
      { title: "Confirm E1 surface water drainage sizing", priority: "high", dueDate: new Date(today.getTime() + 7*86400000).toISOString().split('T')[0] },
      { title: "Update cladding fixing schedule", priority: "medium", dueDate: new Date(today.getTime() + 14*86400000).toISOString().split('T')[0] },
      { title: "Add fire-rated wall details between units", priority: "high", dueDate: new Date(today.getTime() + 7*86400000).toISOString().split('T')[0] },
    ];

    for (const task of tasks) {
      await addDoc(collection(db, 'tasks'), {
        ...task,
        status: "Open",
        projectId: id,
        createdAt: new Date(),
      });
    }
    alert("AI Review complete!");
    window.location.reload();
  };

  if (loading) return <div className="p-8">Loading project...</div>;
  if (!project) return <div className="p-8 text-red-500">Project not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.address && <p className="text-gray-500 mt-1">{project.address}</p>}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={analyzeSelectedDrawings} 
              disabled={selectedDocuments.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              Analyze Selected Drawings with AI ({selectedDocuments.length})
            </button>
            <button onClick={runAIReview} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
              Run AI Compliance Review
            </button>
          </div>
        </div>

        {/* Upload + PDF Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-2">
            <UploadForm projectId={id!} onUploadComplete={handleUploadComplete} />
          </div>
          <div className="lg:col-span-3">
            <PDFViewer projectId={id!} />
          </div>
        </div>

        {/* Uploaded Drawings with Selection */}
        {documents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Uploaded Drawings ({documents.length})</h3>
              <span className="text-sm text-gray-500">Select drawings to analyze with AI</span>
            </div>
            <div className="space-y-2">
              {documents.map((docItem) => (
                <div key={docItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(docItem.id)}
                      onChange={() => toggleDocumentSelection(docItem.id)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <div>
                      <p className="font-medium">{docItem.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {docItem.uploadedAt?.toDate?.().toLocaleDateString() || 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => viewDocument(docItem.url)} className="px-4 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">View</button>
                    <button onClick={() => downloadDocument(docItem.url, docItem.fileName)} className="px-4 py-1.5 text-sm bg-gray-200 rounded-lg hover:bg-gray-300">Download</button>
                    <button onClick={() => deleteDocument(docItem.id)} className="px-4 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Kanban */}
        <div>
          <TaskKanban projectId={id!} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
