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
  const [uploadTaskRef, setUploadTaskRef] = useState<any>(null);

  const uploadFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `projects/${projectId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      setUploadTaskRef(uploadTask);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progressPercent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(progressPercent);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (const file of files) {
        setCurrentFile(file.name);
        setProgress(0);

        const downloadURL = await uploadFile(file);

        // Save to Firestore
        await addDoc(collection(db, 'documents'), {
          projectId,
          fileName: file.name,
          url: downloadURL,
          size: file.size,
          uploadedAt: new Date(),
          status: 'uploaded'
        });
      }

      alert(`${files.length} file(s) uploaded successfully!`);
      if (onUploadComplete) onUploadComplete();
    } catch (error: any) {
      if (error.code === 'storage/canceled') {
        alert('Upload was canceled.');
      } else {
        console.error('Upload failed:', error);
        alert('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
      setProgress(0);
      setCurrentFile('');
      setUploadTaskRef(null);
    }
  };

  const cancelUpload = () => {
    if (uploadTaskRef) {
      uploadTaskRef.cancel();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="border-2 border-dashed border-gray-,300 rounded-2xl p-12 text-center hover:border-blue-400 transition">
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="font-medium text-gray-700">Drop your architectural PDF set here</p>
        <p className="text-sm text-gray-500 mt-1">or</p>

        <label className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg cursor-pointer font-medium transition">
          {uploading ? `Uploading... ${progress}%` : 'Select PDF Files'}
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

      {uploading && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 truncate max-w-[280px]">
              {currentFile}
            </span>
            <span className="text-sm font-medium text-blue-600">{progress}%</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={cancelUpload}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <X size={16} /> Cancel Upload
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
