import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface UploadedDocument {
  id: string;
  fileName: string;
  url: string;
}

interface PDFViewerProps {
  projectId: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ projectId }) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch list of uploaded documents
  useEffect(() => {
    if (!projectId) return;

    const q = query(collection(db, 'documents'), where('projectId', '==', projectId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UploadedDocument[];
      setDocuments(docs);

      if (docs.length > 0 && !selectedDoc) {
        const firstPdf = docs.find(d => d.fileName.toLowerCase().endsWith('.pdf'));
        if (firstPdf) setSelectedDoc(firstPdf);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Load PDF as blob for reliable rendering
  useEffect(() => {
    const loadPdfBlob = async () => {
      if (!selectedDoc?.url) {
        setPdfBlobUrl(null);
        return;
      }

      try {
        const response = await fetch(selectedDoc.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (error) {
        console.error('Failed to load PDF:', error);
        setPdfBlobUrl(null);
      }
    };

    loadPdfBlob();

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [selectedDoc]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  // Navigation
  const goToPrevPage = () => setPageNumber(p => Math.max(1, p - 1));
  const goToNextPage = () => setPageNumber(p => Math.min(numPages || 1, p + 1));

  // Zoom
  const zoomIn = () => setScale(s => Math.min(s + 0.2, 3.0));
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
  const resetZoom = () => setScale(1.0);

  // Rotation
  const rotateLeft = () => setRotation(r => (r - 90 + 360) % 360);
  const rotateRight = () => setRotation(r => (r + 90) % 360);
  const resetRotation = () => setRotation(0);

  if (loading) {
    return <div className="p-6">Loading drawings...</div>;
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Drawing Set Viewer</h2>
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
          <p className="text-gray-500">No drawings uploaded yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Drawing Set Viewer</h2>

        <select
          value={selectedDoc?.id || ''}
          onChange={(e) => {
            const doc = documents.find(d => d.id === e.target.value);
            if (doc) {
              setSelectedDoc(doc);
              setPageNumber(1);
              setScale(1.0);
              setRotation(0);
            }
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {documents
            .filter(d => d.fileName.toLowerCase().endsWith('.pdf'))
            .map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.fileName}</option>
            ))}
        </select>
      </div>

      {selectedDoc && pdfBlobUrl ? (
        <div className="border rounded-lg p-4 bg-gray-50">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <button onClick={zoomOut} className="px-3 py-1 bg-white border rounded hover:bg-gray-100">-</button>
              <span className="text-sm w-14 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={zoomIn} className="px-3 py-1 bg-white border rounded hover:bg-gray-100">+</button>
              <button onClick={resetZoom} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">Reset Zoom</button>
            </div>

            {/* Rotation Controls */}
            <div className="flex items-center gap-2">
              <button onClick={rotateLeft} className="px-3 py-1 bg-white border rounded hover:bg-gray-100">↺</button>
              <button onClick={rotateRight} className="px-3 py-1 bg-white border rounded hover:bg-gray-100">↻</button>
              <button onClick={resetRotation} className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">Reset</button>
              <span className="text-sm text-gray-500 ml-2">{rotation}°</span>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-3">
              <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="px-3 py-1 bg-white border rounded disabled:opacity-50">←</button>
              <span className="text-sm">Page {pageNumber} of {numPages}</span>
              <button onClick={goToNextPage} disabled={pageNumber >= (numPages || 1)} className="px-3 py-1 bg-white border rounded disabled:opacity-50">→</button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex justify-center overflow-auto max-h-[700px] border bg-white rounded p-4">
            <Document file={pdfBlobUrl} onLoadSuccess={onDocumentLoadSuccess}>
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        </div>
      ) : (
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
          <p className="text-gray-500">Select a drawing to view</p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
