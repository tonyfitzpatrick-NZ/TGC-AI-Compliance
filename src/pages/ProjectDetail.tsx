import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PDFViewer from '../components/PDFViewer';
import TaskKanban from '../components/TaskKanban';
import UploadForm from '../components/UploadForm';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

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

  // Fetch documents
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'documents'), where('projectId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [id]);

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleUploadComplete = () => {};

  const deleteDocument = async (docId: string) => {
    if (!window.confirm('Delete this file?')) return;
    await deleteDoc(doc(db, 'documents', docId));
    setSelectedDocuments(prev => prev.filter(id => id !== docId));
  };

  const viewDocument = (url: string) => window.open(url, '_blank');
  const downloadDocument = (url: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = url; link.download = fileName;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // Convert PDF first page to base64 image
  const convertPdfToImage = async (pdfUrl: string): Promise<string> => {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context!, viewport }).promise;

    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1]; // return base64 without prefix
  };

  // Main AI Analysis Function
  const analyzeWithAI = async () => {
    if (selectedDocuments.length === 0) {
      alert("Please select at least one drawing to analyze.");
      return;
    }

    if (!OPENAI_API_KEY) {
      alert("OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY in Netlify.");
      return;
    }

    setAnalyzing(true);

    try {
      const selectedFiles = documents.filter(d => selectedDocuments.includes(d.id));
      const imageContents: any[] = [];

      for (const file of selectedFiles) {
        try {
          const base64Image = await convertPdfToImage(file.url);
          imageContents.push({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          });
        } catch (err) {
          console.error("Failed to convert PDF:", file.fileName);
        }
      }

      if (imageContents.length === 0) {
        alert("Could not process any of the selected drawings.");
        setAnalyzing(false);
        return;
      }

      const prompt = `You are an expert New Zealand building compliance reviewer. Analyze the attached architectural drawings for compliance issues related to the New Zealand Building Code, NZS 3604, E2/AS1, fire safety, weathertightness, and common consent issues.

Return your findings as a JSON array of tasks in this exact format:

[
  {
    "title": "Short clear task title",
    "description": "Detailed explanation including relevant standard if known",
    "priority": "high" | "medium" | "low"
  }
]

Only return valid JSON. Do not include any other text.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                ...imageContents
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.3
        })
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        alert("AI did not return a valid response.");
        setAnalyzing(false);
        return;
      }

      // Try to parse JSON from the response
      let tasks = [];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          tasks = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse AI response as JSON:", content);
        alert("AI returned an invalid format. Please try again.");
        setAnalyzing(false);
        return;
      }

      if (!Array.isArray(tasks) || tasks.length === 0) {
        alert("AI analysis complete. No significant issues were flagged.");
        setAnalyzing(false);
        return;
      }

      // Save tasks to Firestore
      const today = new Date();
      for (const task of tasks) {
        await addDoc(collection(db, 'tasks'), {
          title: task.title,
          description: task.description || "",
          priority: task.priority || "medium",
          status: "Open",
          projectId: id,
          dueDate: new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0],
          createdAt: new Date(),
        });
      }

      alert(`AI Analysis complete! ${tasks.length} tasks were created.`);
      setSelectedDocuments([]);
      window.location.reload();

    } catch (error) {
      console.error("AI Analysis error:", error);
      alert("An error occurred during AI analysis. Please check the console.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="p-8">Loading project...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project?.name}</h1>
            {project?.address && <p className="text-gray-500 mt-1">{project.address}</p>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={analyzeWithAI}
              disabled={selectedDocuments.length === 0 || analyzing}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition"
            >
              {analyzing ? "Analyzing..." : `Analyze Selected Drawings with AI (${selectedDocuments.length})`}
            </button>
            <button onClick={() => alert("Basic review coming soon")} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
              Run AI Compliance Review
            </button>
          </div>
        </div>

        {/* Upload + PDF Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
          <div className="lg:col-span-2">
            <UploadForm projectId={id!} onUploadComplete={() => {}} />
          </div>
          <div className="lg:col-span-3">
            <PDFViewer projectId={id!} />
          </div>
        </div>

        {/* Uploaded Drawings with Checkboxes */}
        {documents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <h3 className="font-semibold mb-4">Uploaded Drawings ({documents.length}) — Select for AI Analysis</h3>
            <div className="space-y-2">
              {documents.map((docItem) => (
                <div key={docItem.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(docItem.id)}
                      onChange={() => toggleDocumentSelection(docItem.id)}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <div>
                      <p className="font-medium">{docItem.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {docItem.uploadedAt?.toDate?.().toLocaleDateString() || 'Unknown'}
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
