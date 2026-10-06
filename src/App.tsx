import React, { useState, useEffect } from 'react';
import { DailyCheckIn } from './components/DailyCheckIn/DailyCheckIn';
import { WeeklyReport } from './components/WeeklyReport/WeeklyReport';
import { MonthlyStatistics } from './components/MonthlyStatistics/MonthlyStatistics';
import { AddHabitModal } from './components/AddHabitModal';
import { DataManagementModal } from './components/DataManagementModal';
import { SettingsModal } from './components/SettingsModal';
import { CosmicLogo } from './components/CosmicLogo';
import { DailyRecord, HabitDefinition } from './types';
import {
  calculateStreaks,
  getTodayString,
} from './utils/dateUtils';
import {
  loadDailyRecords,
  loadHabits,
  resetToDemoData,
  saveDailyRecords,
  saveHabits,
  getDailyRecord,
  syncFromServer,
  loadUserProfile,
  saveUserProfile,
  UserProfile,
} from './utils/storage';
import { Database, Flame, Settings } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayString());
  const [habits, setHabits] = useState<HabitDefinition[]>(() => loadHabits());
  const [records, setRecords] = useState<Record<string, DailyRecord>>(() => loadDailyRecords());
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());

  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync with backend database on mount
  useEffect(() => {
    syncFromServer().then((data) => {
      if (data && data.records && Object.keys(data.records).length > 0) {
        setRecords((prev) => ({ ...data.records, ...prev }));
      } else {
        // Initial seed push to backend database
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ habits, records }),
        }).catch(() => {});
      }
    });
  }, []);

  // Streak calculation
  const todayStr = getTodayString();
  const streakRecords: Record<string, { completedHabitsCount: number; totalEnabledHabits: number }> = {};
  const enabledCount = habits.filter((h) => h.enabled).length;

  for (const [date, rec] of Object.entries(records)) {
    let completedCount = 0;
    for (const h of habits) {
      if (h.enabled && rec.habits?.[h.id]?.completed) {
        completedCount++;
      }
    }
    streakRecords[date] = {
      completedHabitsCount: completedCount,
      totalEnabledHabits: enabledCount,
    };
  }

  const { currentStreak } = calculateStreaks(streakRecords, todayStr);

  const handleUpdateRecord = (updatedRecord: DailyRecord) => {
    const updated = {
      ...records,
      [updatedRecord.date]: updatedRecord,
    };
    setRecords(updated);
    saveDailyRecords(updated);

    // Sync individual record to server
    fetch('/api/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRecord),
    }).catch(() => {});
  };

  const handleAddHabit = (newHabit: HabitDefinition) => {
    const updated = [...habits, newHabit];
    setHabits(updated);
    saveHabits(updated);
  };

  const handleSelectDateFromReport = (date: string) => {
    setCurrentDate(date);
    setActiveTab('daily');
  };

  const handleGoToToday = () => {
    setCurrentDate(todayStr);
    setActiveTab('daily');
  };

  const handleResetData = () => {
    resetToDemoData();
    setHabits(loadHabits());
    setRecords(loadDailyRecords());
  };

  const handleDataImported = () => {
    setHabits(loadHabits());
    setRecords(loadDailyRecords());
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    saveUserProfile(newProfile);
  };

  const currentRecord = getDailyRecord(currentDate, records);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Seamless Floating Top Bar: Logo + Brand + Tab Pills + Actions (Headerless) */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
        {/* Brand with Cosmic Star Logo */}
        <div className="flex items-center gap-2.5">
          <CosmicLogo size={32} />
          <h1 className="text-base font-bold tracking-wider text-neutral-900 font-serif">
            每日打卡
          </h1>
          {currentStreak > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium ml-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full font-mono">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{currentStreak}天</span>
            </span>
          )}
        </div>

        {/* Minimal Pill Tab Switcher */}
        <nav className="flex items-center p-1 bg-neutral-200/70 rounded-xl shadow-2xs">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'daily'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            打卡
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'weekly'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            周报
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3.5 py-1 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'monthly'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            全景热力
          </button>
        </nav>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleGoToToday}
            className="px-2.5 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors font-medium"
            title="回到今天"
          >
            今日
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors"
            title="个人头像与设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsDataModalOpen(true)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors"
            title="数据备份与恢复"
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas View (No Header/Footer Frame) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'daily' && (
          <DailyCheckIn
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            record={currentRecord}
            onUpdateRecord={handleUpdateRecord}
            habits={habits}
            currentStreak={currentStreak}
            profile={profile}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {activeTab === 'weekly' && (
          <WeeklyReport
            records={records}
            habits={habits}
            currentDate={currentDate}
            onSelectDate={handleSelectDateFromReport}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyStatistics
            records={records}
            habits={habits}
            currentDate={currentDate}
            onSelectDate={handleSelectDateFromReport}
          />
        )}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />

      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => setIsAddHabitModalOpen(false)}
        onAddHabit={handleAddHabit}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onResetData={handleResetData}
        onDataImported={handleDataImported}
      />
    </div>
  );
}
