import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { Upload } from 'lucide-react';

interface UploadFormProps {
  projectId: string;
  onUploadComplete?: () => void;
}

const UploadForm = ({ projectId, onUploadComplete }: UploadFormProps) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (let file of Array.from(files)) {
      const storageRef = ref(storage, `projects/${projectId}/${file.name}`);
      
      try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'documents'), {
          projectId,
          fileName: file.name,
          url,
          uploadedAt: new Date(),
          status: 'pending'
        });
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }

    setUploading(false);
    onUploadComplete?.();
    alert('Files uploaded successfully!');
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 transition">
      <Upload className="w-12 h-12 mx-auto text-gray-400" />
      <p className="mt-4 font-medium">Drop your architectural PDF set here</p>
      <p className="text-sm text-gray-500 mt-1">or</p>
      
      <label className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg cursor-pointer font-medium">
        {uploading ? 'Uploading...' : 'Select PDF Files'}
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>
      <p className="text-xs text-gray-500 mt-4">Supports multi-page consent drawings</p>
    </div>
  );
};

export default UploadForm;
