import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DailyCheckIn } from './components/DailyCheckIn/DailyCheckIn';
import { WeeklyReport } from './components/WeeklyReport/WeeklyReport';
import { MonthlyStatistics } from './components/MonthlyStatistics/MonthlyStatistics';
import { AddHabitModal } from './components/AddHabitModal';
import { DataManagementModal } from './components/DataManagementModal';
import { SettingsModal } from './components/SettingsModal';
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

  const handleUpdateRecord = (updated: DailyRecord) => {
    const newRecords = {
      ...records,
      [updated.date]: updated,
    };
    setRecords(newRecords);
    saveDailyRecords(newRecords);
  };

  const handleGoToToday = () => {
    const today = getTodayString();
    setCurrentDate(today);
    setActiveTab('daily');
  };

  const handleSelectDateFromReport = (dateStr: string) => {
    setCurrentDate(dateStr);
    setActiveTab('daily');
  };

  const handleAddHabit = (newHabit: HabitDefinition) => {
    const updated = [...habits, newHabit];
    setHabits(updated);
    saveHabits(updated);
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
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onGoToToday={handleGoToToday}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        currentStreak={currentStreak}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">日砺知行</span>
            <span aria-hidden="true">·</span>
            <span>锻炼与读书打卡系统</span>
            <span aria-hidden="true">·</span>
            <span>Docker 容器支持</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-neutral-900 transition-colors"
            >
              个人头像设置
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsDataModalOpen(true)}
              className="hover:text-neutral-900 transition-colors"
            >
              数据备份与恢复
            </button>
          </div>
        </div>
      </footer>

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
