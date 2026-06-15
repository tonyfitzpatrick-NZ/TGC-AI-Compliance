import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Drawing Set Viewer</h2>
      <div className="border rounded-lg p-4 bg-gray-50">
        {/* Placeholder for actual PDF */}
        <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
          <p className="text-gray-500">Upload drawings to view pages here</p>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
