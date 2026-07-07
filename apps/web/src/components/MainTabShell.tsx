import type { ReactNode } from 'react';
import { BottomTabBar, type AppTab } from './BottomTabBar';

export function MainTabShell({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative h-full overflow-hidden bg-[var(--color-bg)]">
      <div className="h-full pb-24">
        {children}
      </div>
      <BottomTabBar activeTab={activeTab} onChange={onTabChange} />
    </div>
  );
}
