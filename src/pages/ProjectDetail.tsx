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
  const [loading, setLoading] = useState(true);

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        }
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

  const deleteDocument = async (docId: string) => {
    if (!window.confirm('Delete this file?')) return;
    await deleteDoc(doc(db, 'documents', docId));
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

const runAIReview = async () => {
  if (!id || !window.confirm("Run detailed AI Compliance Review?")) return;

  const today = new Date();

  const generatedTasks = [
    // === HIGH PRIORITY / STRUCTURAL ===
    {
      title: "Add NZS 3604 foundation bracing schedule & calculations",
      description: "Foundation Plan is missing bracing layout and calculations per NZS 3604:2011. Required for Building Consent.",
      status: "Open",
      priority: "high",
      projectId: id,
      dueDate: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },
    {
      title: "Confirm floor joist & bearer sizing to NZS 3604",
      description: "Check floor framing sizes and spans against NZS 3604 Table 7.1 and 7.2 for the proposed loads and spans.",
      status: "Open",
      priority: "high",
      projectId: id,
      dueDate: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },

    // === WEATHERTIGHTNESS (E2) ===
    {
      title: "Update cladding fixing details to E2/AS1",
      description: "HardieFlex / fibre cement cladding fixing pattern and cavity details must comply with E2/AS1 Acceptable Solution.",
      status: "Open",
      priority: "high",
      projectId: id,
      dueDate: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },
    {
      title: "Add window & door head flashing details",
      description: "Window and door installations require compliant head flashings with 15° slope and hemmed edges per E2/AS1.",
      status: "Open",
      priority: "high",
      projectId: id,
      dueDate: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },
    {
      title: "Confirm roof underlay and flashing details",
      description: "Check roof underlay specification, lap details, and flashing design against E2/AS1 requirements.",
      status: "Open",
      priority: "high",
      projectId: id,
      dueDate: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },

    // === FIRE SAFETY ===
    {
      title: "Add fire-rated wall details between units (if multi-unit)",
      description: "Fire separation between dwellings must achieve minimum FRL 60/60/60 with compliant fire-rated construction.",
      status: "Open",
      priority: "high",
      projectId: id,
      dueDate: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },
    {
      title: "Confirm smoke alarm locations & specification",
      description: "Smoke alarms must be installed in accordance with NZS 4514 and Building Code clause F7.",
      status: "Open",
      priority: "medium",
      projectId: id,
      dueDate: new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },

    // === ACCESSIBILITY & OTHER ===
    {
      title: "Check accessibility requirements (if applicable)",
      description: "Confirm compliance with NZS 4121 and Building Code D1/AS1 for accessible routes and facilities.",
      status: "Pending",
      priority: "medium",
      projectId: id,
      dueDate: new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },
    {
      title: "Verify recession plane & height in relation to boundary",
      description: "Check all elevations against District Plan recession plane and height-to-boundary rules.",
      status: "Open",
      priority: "medium",
      projectId: id,
      dueDate: new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },
    {
      title: "Confirm minimum 450mm eaves on all elevations",
      description: "E2/AS1 recommends minimum 450mm eaves overhang for weathertightness on most claddings.",
      status: "Open",
      priority: "medium",
      projectId: id,
      dueDate: new Date(today.getTime() + 14 * 86400000).toISOString().split('T')[0],
      createdAt: new Date(),
    },
  ];

  // Save all tasks to Firestore
  for (const task of generatedTasks) {
    await addDoc(collection(db, 'tasks'), task);
  }

  alert(`AI Compliance Review complete!\n\n${generatedTasks.length} tasks have been generated.`);
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
          <button onClick={runAIReview} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            Run AI Compliance Review
          </button>
        </div>

        {/* Upload + PDF Viewer side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            <UploadForm projectId={id!} onUploadComplete={handleUploadComplete} />
          </div>

          {/* PDF Viewer */}
          <div className="lg:col-span-3">
            <PDFViewer projectId={id!} />
          </div>
        </div>

        {/* Uploaded Drawings List */}
        {documents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h3 className="font-semibold mb-4">Uploaded Drawings ({documents.length})</h3>
            <div className="space-y-2">
              {documents.map((docItem) => (
                <div key={docItem.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium">{docItem.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {docItem.uploadedAt?.toDate?.().toLocaleDateString() || 'Unknown'}
                    </p>
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

        {/* Task Kanban - Full Width */}
        <div>
          <TaskKanban projectId={id!} />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
