import React, { useState } from 'react';
import { ANDROID_FILES } from '../androidSources';
import { Check, Copy, Download, FileCode, FolderArchive, Layers } from 'lucide-react';
import JSZip from 'jszip';

export const SourceCodeViewer: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState(ANDROID_FILES[0].path);
  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const selectedFile = ANDROID_FILES.find((f) => f.path === selectedPath) || ANDROID_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();

      // Add all project files
      for (const file of ANDROID_FILES) {
        zip.file(file.path, file.content);
      }

      // Add README and Gradle properties
      zip.file(
        'gradle.properties',
        'org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\n'
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Nexora-AI-Keyboard-Android.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip', err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-slate-100 tracking-wider uppercase">
            Android Studio Project Files
          </h3>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
            {ANDROID_FILES.length} files
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={downloadingZip}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded font-medium flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingZip ? 'Packaging...' : 'Download Android Studio .ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: File Tree on left, Code on right */}
      <div className="flex flex-1 min-h-0">
        {/* File List */}
        <div className="w-56 border-r border-slate-800/80 bg-slate-900/30 overflow-y-auto p-2 flex flex-col gap-1 shrink-0">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 tracking-wider">
            Files &amp; Services
          </div>
          {ANDROID_FILES.map((file) => {
            const isSelected = file.path === selectedPath;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedPath(file.path)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-start gap-2 ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[11px]">{file.name}</div>
                  <div className="text-[9px] text-slate-500 truncate">{file.path.split('/')[0]}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Code Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
          {/* File description banner */}
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between text-[11px]">
            <span className="font-mono text-blue-300 text-xs">{selectedFile.path}</span>
            <span className="text-slate-400 text-right">{selectedFile.description}</span>
          </div>

          {/* Code Body */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed whitespace-pre selection:bg-blue-600 selection:text-white">
            {selectedFile.content}
          </div>
        </div>
      </div>
    </div>
  );
};
