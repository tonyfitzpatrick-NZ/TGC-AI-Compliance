import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '../lib/firebase';
import { Upload, X } from 'lucide-react';

interface UploadFormProps {
  projectId: string;
  onUploadComplete?: () => void;
}

const UploadForm = ({ projectId, onUploadComplete }: UploadFormProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);

      const storageRef = ref(storage, `projects/${projectId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Track upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progressPercent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(progressPercent));
        },
        (error) => {
          console.error('Upload error:', error);
        },
        async () => {
          // Upload complete - get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save metadata to Firestore
          await addDoc(collection(db, 'documents'), {
            projectId,
            fileName: file.name,
            url: downloadURL,
            size: file.size,
            uploadedAt: new Date(),
            status: 'uploaded'
          });
        }
      );

      // Wait for this file to finish before moving to the next
      await new Promise((resolve) => {
        uploadTask.on('state_changed', null, null, resolve);
      });
    }

    setUploading(false);
    setProgress(0);
    setCurrentFile('');
    
    if (onUploadComplete) onUploadComplete();
    alert(`${files.length} file(s) uploaded successfully!`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 transition">
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="font-medium text-gray-700">Drop your architectural PDF set here</p>
        <p className="text-sm text-gray-500 mt-1">or</p>

        <label className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg cursor-pointer font-medium transition">
          {uploading ? 'Uploading...' : 'Select PDF Files'}
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
        <p className="text-xs text-gray-500 mt-4">Supports multi-page consent drawings</p>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Uploading {currentFile}</span>
            </div>
            <span className="text-sm font-medium text-blue-600">{progress}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
