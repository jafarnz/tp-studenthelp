import { useState } from 'react';

export default function UploadResource({ onClose }: { onClose: () => void }) {
  const [resource, setResource] = useState({
    title: '',
    description: '',
    subject: '',
    type: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('data', JSON.stringify(resource));

      // Upload to your file storage service (e.g., AWS S3)
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const { fileUrl } = await uploadResponse.json();

      // Create resource in database
      await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...resource,
          fileUrl,
        }),
      });

      onClose();
    } catch (error) {
      console.error('Error uploading resource:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upload Resource</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              value={resource.title}
              onChange={(e) => setResource({ ...resource, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              required
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              rows={3}
              value={resource.description}
              onChange={(e) => setResource({ ...resource, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              required
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              value={resource.subject}
              onChange={(e) => setResource({ ...resource, subject: e.target.value })}
            >
              <option value="">Select Subject</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Business">Business</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              required
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              value={resource.type}
              onChange={(e) => setResource({ ...resource, type: e.target.value })}
            >
              <option value="">Select Type</option>
              <option value="Notes">Notes</option>
              <option value="Past Paper">Past Paper</option>
              <option value="Tutorial">Tutorial</option>
              <option value="Case Study">Case Study</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File
            </label>
            <input
              type="file"
              required
              className="w-full"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="btn-primary"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
