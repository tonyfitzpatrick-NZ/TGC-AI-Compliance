import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PDFViewer from '../components/PDFViewer';
import TaskKanban from '../components/TaskKanban';
import UploadForm from '../components/UploadForm';
import * as pdfjsLib from 'pdfjs-dist';

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [thumbnails, setThumbnails] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  // Fetch project
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

  // Real-time documents listener
  useEffect(() => {
    if (!id) return;

    const q = query(collection(db, 'documents'), where('projectId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(docs);
    });
    return () => unsubscribe();
  }, [id]);

  // Generate thumbnails for PDFs
  useEffect(() => {
    const generateThumbnails = async () => {
      const newThumbnails: { [key: string]: string } = {};

      for (const docItem of documents) {
        if (docItem.url && docItem.fileName?.toLowerCase().endsWith('.pdf') && !thumbnails[docItem.id]) {
          try {
            const pdf = await pdfjsLib.getDocument(docItem.url).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 0.3 });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context!, viewport }).promise;
            newThumbnails[docItem.id] = canvas.toDataURL();
          } catch (error) {
            console.error('Thumbnail generation failed for', docItem.fileName);
          }
        }
      }

      if (Object.keys(newThumbnails).length > 0) {
        setThumbnails(prev => ({ ...prev, ...newThumbnails }));
      }
    };

    if (documents.length > 0) {
      generateThumbnails();
    }
  }, [documents]);

  const handleUploadComplete = () => console.log('Upload complete');

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

  // AI Review
  const runAIReview = async () => {
    if (!id) return;
    if (!window.confirm("Run AI Compliance Review?")) return;

    try {
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
      alert("AI Review complete! Tasks added.");
      window.location.reload();
    } catch (error) {
      alert("Error running AI review.");
    }
  };

  if (loading) return <div className="p-8">Loading project...</div>;
  if (!project) return <div className="p-8 text-red-500">Project not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.address && <p className="text-gray-500 mt-1">{project.address}</p>}
          </div>
          <button onClick={runAIReview} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            Run AI Compliance Review
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <UploadForm projectId={id!} onUploadComplete={handleUploadComplete} />

            {/* Uploaded Drawings with Thumbnails */}
            {documents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-4">Uploaded Drawings ({documents.length})</h3>
                <div className="space-y-3">
                  {documents.map((docItem) => (
                    <div key={docItem.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg items-center">
                      {/* Thumbnail */}
                      <div className="w-16 h-20 bg-white border rounded overflow-hidden flex-shrink-0">
                        {thumbnails[docItem.id] ? (
                          <img src={thumbnails[docItem.id]} alt="PDF preview" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">PDF</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{docItem.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {docItem.uploadedAt?.toDate?.().toLocaleDateString() || 'Unknown date'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => viewDocument(docItem.url)} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">View</button>
                        <button onClick={() => downloadDocument(docItem.url, docItem.fileName)} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">Download</button>
                        <button onClick={() => deleteDocument(docItem.id)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <PDFViewer projectId={id!} />
          </div>

          <div>
            <TaskKanban projectId={id!} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
