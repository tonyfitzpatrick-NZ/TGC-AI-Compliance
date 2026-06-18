import React from 'react';

const PDFViewer: React.FC<{ projectId: string }> = ({ projectId }) => {

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
