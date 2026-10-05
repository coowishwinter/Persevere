import React, { useState } from 'react';
import { X, Plus, Sparkles, Moon, Sun, Droplets, Heart, Smile } from 'lucide-react';
import { HabitDefinition } from '../types';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: HabitDefinition) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Sparkles', icon: Sparkles, label: '冥想/发光' },
  { name: 'Moon', icon: Moon, label: '早睡' },
  { name: 'Sun', icon: Sun, label: '早起' },
  { name: 'Droplets', icon: Droplets, label: '喝水' },
  { name: 'Heart', icon: Heart, label: '健康' },
  { name: 'Smile', icon: Smile, label: '心情' },
];

const PRESET_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

export const AddHabitModal: React.FC<AddHabitModalProps> = ({
  isOpen,
  onClose,
  onAddHabit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('分钟');
  const [defaultTarget, setDefaultTarget] = useState(15);
  const [selectedIcon, setSelectedIcon] = useState('Sparkles');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[2]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newHabit: HabitDefinition = {
      id: `habit_${Date.now()}`,
      name: name.trim(),
      category: 'custom',
      unit: unit.trim() || '次',
      defaultTarget: Number(defaultTarget) || 1,
      iconName: selectedIcon,
      description: description.trim(),
      enabled: true,
      color: selectedColor,
    };

    onAddHabit(newHabit);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-neutral-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="font-semibold text-neutral-900">添加自定义打卡目标</h3>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              习惯名称 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如：每日冥想、晨间写日记、八杯水"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              简要描述 / 达成动机
            </label>
            <input
              type="text"
              placeholder="一两句话说明这项习惯的意义"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                衡量单位
              </label>
              <input
                type="text"
                placeholder="例如：分钟、次、杯、页"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                每日推荐目标
              </label>
              <input
                type="number"
                min="1"
                value={defaultTarget}
                onChange={(e) => setDefaultTarget(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-2">
              主题色
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    selectedColor === c ? 'scale-110 border-neutral-900 shadow-xs' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              添加并启用
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
