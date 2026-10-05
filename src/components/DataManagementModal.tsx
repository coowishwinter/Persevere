import React, { useRef, useState } from 'react';
import { X, Download, Upload, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { exportDataAsJSON, importDataFromJSON } from '../utils/storage';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onDataImported: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onDataImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const json = exportDataAsJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rili_zhixing_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage({ text: '数据已成功导出为 JSON 文件！' });
    } catch {
      setStatusMessage({ text: '导出数据失败', isError: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataFromJSON(content);
        if (success) {
          setStatusMessage({ text: '数据导入成功！页面即将刷新。' });
          setTimeout(() => {
            onDataImported();
            onClose();
          }, 800);
        } else {
          setStatusMessage({ text: '文件格式不正确，无法导入', isError: true });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('确定要重置并恢复内置的完整示范数据吗？这将覆盖当前本地改动。')) {
      onResetData();
      setStatusMessage({ text: '已重置为系统默认示例数据！' });
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="font-semibold text-neutral-900">数据管理与备份</h3>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-500 leading-relaxed">
            所有打卡与复盘数据均保存在您的本地浏览器中。您可以随时导出 JSON 备份，或迁移至其他设备。
          </p>

          {statusMessage && (
            <div
              className={`p-3 text-xs rounded-lg flex items-center gap-2 ${
                statusMessage.isError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {statusMessage.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-md text-neutral-700">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">导出数据备份 (JSON)</h4>
                  <p className="text-[11px] text-neutral-500">保存全部历史记录与周报复盘</p>
                </div>
              </div>
              <span className="text-xs text-neutral-400 font-mono">.json</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-100 rounded-md text-neutral-700">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-900">导入数据备份</h4>
                  <p className="text-[11px] text-neutral-500">从之前导出的备份文件恢复数据</p>
                </div>
              </div>
              <span className="text-xs text-emerald-600 font-medium">选择文件</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-between p-3 border border-rose-100 bg-rose-50/40 rounded-lg hover:bg-rose-50 hover:border-rose-200 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100/70 rounded-md text-rose-700">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-rose-900">恢复完整示例数据</h4>
                  <p className="text-[11px] text-rose-600">重置并加载示范用的连续打卡与读书笔记</p>
                </div>
              </div>
              <span className="text-xs text-rose-600 font-medium">恢复</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
