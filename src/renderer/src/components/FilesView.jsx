import React, { useState, useEffect } from 'react';
import { FolderOpen, File, RefreshCw, Home, ChevronRight, HardDrive } from 'lucide-react';

export default function FilesView() {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDirectory = async (dirPath) => {
    setLoading(true);
    setError(null);
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.listDirectory(dirPath);
        if (result.success) {
          setFiles(result.data);
          setCurrentPath(dirPath);
        } else {
          setError(result.error);
        }
      } else {
        // Demo mode - show mock files
        const mockFiles = [
          { name: 'Documents', isDirectory: true, path: '/home/user/Documents' },
          { name: 'Downloads', isDirectory: true, path: '/home/user/Downloads' },
          { name: 'Pictures', isDirectory: true, path: '/home/user/Pictures' },
          { name: 'notes.txt', isDirectory: false, path: '/home/user/notes.txt' },
          { name: 'project.pdf', isDirectory: false, path: '/home/user/project.pdf' },
        ];
        setFiles(mockFiles);
        setCurrentPath(dirPath || '/home/user');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory('/home/user');
  }, []);

  const handleItemClick = (item) => {
    if (item.isDirectory) {
      loadDirectory(item.path);
    }
  };

  const goUp = () => {
    if (!currentPath) return;
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDirectory(parent);
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-surface-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FolderOpen size={20} className="text-blue-400" />
          File Manager
        </h2>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mt-3 text-sm text-surface-400 overflow-x-auto">
          <button onClick={() => loadDirectory('/')} className="hover:text-white transition-colors shrink-0">
            <HardDrive size={14} />
          </button>
          <ChevronRight size={14} className="shrink-0" />
          {pathParts.map((part, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => loadDirectory('/' + pathParts.slice(0, i + 1).join('/'))}
                className="hover:text-white transition-colors truncate max-w-[120px]"
              >
                {part}
              </button>
              {i < pathParts.length - 1 && <ChevronRight size={14} className="shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-surface-800">
        <button onClick={goUp} className="p-1.5 hover:bg-surface-800 rounded-lg transition-colors" title="Go up">
          <Home size={16} className="text-surface-400" />
        </button>
        <button onClick={() => loadDirectory(currentPath)} className="p-1.5 hover:bg-surface-800 rounded-lg transition-colors" title="Refresh">
          <RefreshCw size={16} className={`text-surface-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-2">
        {error && (
          <div className="text-red-400 text-sm p-3 bg-red-600/10 rounded-lg mb-2">{error}</div>
        )}

        {loading ? (
          <div className="text-center text-surface-500 py-12">
            <RefreshCw size={32} className="mx-auto mb-3 animate-spin opacity-40" />
            <p className="text-sm">Loading...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center text-surface-500 py-12">
            <FolderOpen size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">This folder is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {files.map((file, i) => (
              <button
                key={i}
                onClick={() => handleItemClick(file)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-800 transition-colors text-left"
              >
                {file.isDirectory ? (
                  <FolderOpen size={18} className="text-yellow-500 shrink-0" />
                ) : (
                  <File size={18} className="text-surface-500 shrink-0" />
                )}
                <span className="text-sm text-surface-200 truncate">{file.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
