import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Palette, Globe } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    defaultBranch: 'main',
    defaultFramework: 'REACT',
    defaultRegion: 'us-east-1',
    deploySuccess: true,
    deployFailure: true,
    buildNotifications: false,
    theme: 'dark',
  });

  const handleSave = () => {
    // Phase 1: Local state only
    alert('Settings saved (demo mode)');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-surface-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Account */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <User className="h-5 w-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Account</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Username</label>
            <input className="input-field" value={user?.username || ''} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
            <input className="input-field" value={user?.email || ''} disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">GitHub Account</label>
            <input className="input-field" value="Connected (demo)" disabled />
          </div>
        </div>
      </div>

      {/* Deployment Preferences */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Globe className="h-5 w-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Deployment Preferences</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Default Branch</label>
            <input
              className="input-field"
              value={settings.defaultBranch}
              onChange={(e) => setSettings({ ...settings, defaultBranch: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Default Framework</label>
            <select
              className="select-field"
              value={settings.defaultFramework}
              onChange={(e) => setSettings({ ...settings, defaultFramework: e.target.value })}
            >
              <option value="REACT">React</option>
              <option value="NEXTJS">Next.js</option>
              <option value="VUE">Vue</option>
              <option value="ANGULAR">Angular</option>
              <option value="SVELTE">Svelte</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Default Region</label>
            <select
              className="select-field"
              value={settings.defaultRegion}
              onChange={(e) => setSettings({ ...settings, defaultRegion: e.target.value })}
            >
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">EU (Ireland)</option>
              <option value="ap-south-1">Asia Pacific (Mumbai)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="h-5 w-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'deploySuccess', label: 'Deployment Success' },
            { key: 'deployFailure', label: 'Deployment Failure' },
            { key: 'buildNotifications', label: 'Build Notifications' },
          ].map((item) => (
            <label key={item.key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-surface-300">{item.label}</span>
              <div
                onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  settings[item.key as keyof typeof settings] ? 'bg-brand-500' : 'bg-surface-700'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    settings[item.key as keyof typeof settings] ? 'translate-x-5' : ''
                  }`}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <Palette className="h-5 w-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Appearance</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-300 mb-1.5">Theme</label>
          <select
            className="select-field max-w-xs"
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light (coming soon)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  );
}
