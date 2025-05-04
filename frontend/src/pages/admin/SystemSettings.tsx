import React, { useState } from 'react';
import usePermissions from '../../hooks/usePermissions';

interface SystemSettingOption {
  id: string;
  name: string;
  description: string;
  value: boolean | string | number;
  type: 'boolean' | 'text' | 'number' | 'select';
  options?: string[];
}

const SystemSettings: React.FC = () => {
  const { can } = usePermissions();
  const canManageSettings = can('manage:settings');
  
  // Mock settings - would come from an API in a real app
  const [settings, setSettings] = useState<SystemSettingOption[]>([
    {
      id: 'enableRegistration',
      name: 'Enable Public Registration',
      description: 'Allow new users to register without an invite',
      value: true,
      type: 'boolean'
    },
    {
      id: 'defaultUserRole',
      name: 'Default User Role',
      description: 'Role assigned to new users upon registration',
      value: 'staff',
      type: 'select',
      options: ['admin', 'producer', 'staff']
    },
    {
      id: 'sessionTimeout',
      name: 'Session Timeout (minutes)',
      description: 'Time before users are automatically logged out',
      value: 60,
      type: 'number'
    },
    {
      id: 'companyName',
      name: 'Company Name',
      description: 'Your company name used in emails and documentation',
      value: 'Order Management System',
      type: 'text'
    },
    {
      id: 'supportEmail',
      name: 'Support Email',
      description: 'Email address for user support inquiries',
      value: 'support@example.com',
      type: 'text'
    }
  ]);

  const handleSettingChange = (id: string, newValue: boolean | string | number) => {
    if (!canManageSettings) return;
    
    // Update settings locally - would be an API call in a real app
    setSettings(settings.map(setting => 
      setting.id === id ? { ...setting, value: newValue } : setting
    ));
  };

  const handleSaveSettings = () => {
    if (!canManageSettings) return;
    
    // This would save to backend in a real application
    alert('Settings saved successfully!');
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSaveSettings}
          disabled={!canManageSettings}
        >
          Save Settings
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
        <div className="grid gap-6">
          {settings.map((setting) => (
            <div key={setting.id} className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{setting.name}</h3>
                  <p className="text-sm text-gray-500">{setting.description}</p>
                </div>
                <div className="min-w-[200px]">
                  {setting.type === 'boolean' && (
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={setting.value as boolean}
                        onChange={(e) => handleSettingChange(setting.id, e.target.checked)}
                        disabled={!canManageSettings}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  )}
                  
                  {setting.type === 'text' && (
                    <input
                      type="text"
                      className="w-full border rounded p-2"
                      value={setting.value as string}
                      onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                      disabled={!canManageSettings}
                    />
                  )}
                  
                  {setting.type === 'number' && (
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={setting.value as number}
                      onChange={(e) => handleSettingChange(setting.id, parseInt(e.target.value, 10))}
                      disabled={!canManageSettings}
                    />
                  )}
                  
                  {setting.type === 'select' && (
                    <select
                      className="w-full border rounded p-2"
                      value={setting.value as string}
                      onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                      disabled={!canManageSettings}
                    >
                      {setting.options?.map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings; 