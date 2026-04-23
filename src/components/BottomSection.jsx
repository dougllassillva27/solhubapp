import { useState } from 'react';
import { Newspaper, Trophy } from 'lucide-react';
import NewsFeed from './NewsFeed';
import FutebolTab from './FutebolTab';

const tabs = [
  { id: 'news', label: 'Notícias', icon: Newspaper },
  { id: 'futebol', label: 'Futebol', icon: Trophy },
];

export default function BottomSection() {
  const [activeTab, setActiveTab] = useState('news');

  return (
    <div className="container mx-auto px-4 pb-16 pt-8 border-t border-border">
      {/* Tab Buttons */}
      <div className="w-full max-w-6xl mx-auto flex items-center gap-2 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus:outline-none ${
                isActive ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-text'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'news' && <NewsFeed />}
      {activeTab === 'futebol' && <FutebolTab />}
    </div>
  );
}
