'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSite } from '@/lib/SiteContext';
import { useLocale } from '@/lib/LocaleContext';
import { ChevronDown, Edit2, X, CheckCircle, AlertCircle, Bell, BellRing } from 'lucide-react';

interface DeviceNotification {
  no?: number;
  deviceID?: number;
  name?: string;
  type?: string;
  owner?: string;
  alarm?: boolean;
  highActive?: boolean;
  lowActive?: boolean;
  message?: boolean;
  email?: boolean;
  output?: boolean;
  lastUpdate?: string;
}

export default function NotificationsPage() {
  const { selectedSite } = useSite();
  const { t } = useLocale();
  const [notifications, setNotifications] = useState<DeviceNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCriteria, setSearchCriteria] = useState('');
  const [searchText, setSearchText] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceNotification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Fetch notification settings from API
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/kenergy/device-notifications?site=${selectedSite}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        setError(data.error || 'Failed to fetch notification settings');
      }
    } catch (err: unknown) {
      console.error('Fetch notifications error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function handleSaveSettings() {
    if (!editingDevice || !editingDevice.deviceID) {
      setSubmitStatus({ type: 'error', message: 'Invalid device data' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/kenergy/device-notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: editingDevice.deviceID,
          alarm_enabled: editingDevice.alarm,
          high_active_enabled: editingDevice.highActive,
          low_active_enabled: editingDevice.lowActive,
          message_enabled: editingDevice.message,
          email_enabled: editingDevice.email,
          output_enabled: editingDevice.output
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus({ type: 'success', message: 'Notification settings updated successfully!' });
        setTimeout(() => {
          setShowEditModal(false);
          setEditingDevice(null);
          setSubmitStatus(null);
          fetchNotifications(); // Refresh the list
        }, 1500);
      } else {
        setSubmitStatus({ type: 'error', message: data.error || 'Failed to update settings' });
      }
    } catch (err: unknown) {
      console.error('Update notification settings error:', err);
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filter notifications by table search
  const filteredNotifications = notifications.filter(notification =>
    (notification.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    (notification.owner || '').toLowerCase().includes(searchText.toLowerCase())
  );

  const StatusBadge = ({ enabled }: { enabled: boolean }) => (
    <span className={`px-3 py-1 rounded text-xs font-medium ${
      enabled 
        ? 'bg-green-100 text-green-700 border border-green-300' 
        : 'bg-gray-100 text-gray-600 border border-gray-300'
    }`}>
      {enabled ? t('enabled') : t('disabled')}
    </span>
  );

  return (
    <div className="p-5 space-y-5 bg-gray-50 min-h-screen">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <BellRing className="w-3.5 h-3.5" /> Notifications
            </div>
            <h1 className="text-3xl font-black text-white mb-1">{t('deviceNotifications') || 'Device Notifications'}</h1>
            <p className="text-purple-100 text-sm">Configure alert channels for each device</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
              <Bell className="w-4 h-4 text-white/70 mb-1" />
              <span className="text-2xl font-black text-white leading-none">{notifications.length}</span>
              <span className="text-purple-100 text-xs mt-0.5">Devices</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* All Roles Dropdown */}
          <div className="relative">
            <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-2 min-w-[140px]">
              {t('allRoles')}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Device Name Dropdown */}
          <div className="relative">
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 min-w-[140px]">
              {t('deviceName')}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Search Criteria */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchCriteria}
              onChange={(e) => setSearchCriteria(e.target.value)}
              placeholder={t('searchCriteria')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Search Button */}
          <button className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md font-medium transition-colors">
            {t('search')}
          </button>
        </div>
      </div>

      {/* Device List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {t('deviceList')}
          </h2>
        </div>

        <div className="p-6">
          {/* Entries selector and search */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <select
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t('search')}:</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent w-48"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-2 text-gray-600">Loading notification settings...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Retry
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No devices found
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('no')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('actions')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('name')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('type')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('owner')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('alarm')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('highActive')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('lowActive')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('message')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('email')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('output')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('lastUpdate')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((device, index) => (
                    <tr key={device.deviceID} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setEditingDevice(device);
                            setShowEditModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit notification settings"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-white border-2 border-blue-500 text-blue-600 rounded-md text-sm font-medium">
                          {device.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 bg-white border border-red-400 text-red-600 rounded-md text-sm">
                          {device.type || 'Energy 3-Ph'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {device.owner || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge enabled={device.alarm || false} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge enabled={device.highActive || false} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge enabled={device.lowActive || false} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge enabled={device.message || false} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge enabled={device.email || false} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge enabled={device.output || false} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {device.lastUpdate || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              {t('showing')} {filteredNotifications.length > 0 ? 1 : 0} {t('to')} {filteredNotifications.length} {t('of')} {filteredNotifications.length} {t('entries')}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Notification Settings Modal */}
      {showEditModal && editingDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {t('editNotificationSettings') || 'Edit Notification Settings'}
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDevice(null);
                  setSubmitStatus(null);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-600">
                  <div><span className="font-medium">Device:</span> {editingDevice.name}</div>
                  <div><span className="font-medium">Owner:</span> {editingDevice.owner}</div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <label className="text-sm font-medium text-gray-700">
                    {t('alarm') || 'Alarm'}
                  </label>
                  <input
                    type="checkbox"
                    checked={editingDevice.alarm || false}
                    onChange={(e) => setEditingDevice({ ...editingDevice, alarm: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <label className="text-sm font-medium text-gray-700">
                    {t('highActive') || 'High Active'}
                  </label>
                  <input
                    type="checkbox"
                    checked={editingDevice.highActive || false}
                    onChange={(e) => setEditingDevice({ ...editingDevice, highActive: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <label className="text-sm font-medium text-gray-700">
                    {t('lowActive') || 'Low Active'}
                  </label>
                  <input
                    type="checkbox"
                    checked={editingDevice.lowActive || false}
                    onChange={(e) => setEditingDevice({ ...editingDevice, lowActive: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <label className="text-sm font-medium text-gray-700">
                    {t('message') || 'Message'}
                  </label>
                  <input
                    type="checkbox"
                    checked={editingDevice.message || false}
                    onChange={(e) => setEditingDevice({ ...editingDevice, message: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <label className="text-sm font-medium text-gray-700">
                    {t('email') || 'Email'}
                  </label>
                  <input
                    type="checkbox"
                    checked={editingDevice.email || false}
                    onChange={(e) => setEditingDevice({ ...editingDevice, email: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <label className="text-sm font-medium text-gray-700">
                    {t('output') || 'Output'}
                  </label>
                  <input
                    type="checkbox"
                    checked={editingDevice.output || false}
                    onChange={(e) => setEditingDevice({ ...editingDevice, output: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Status Message */}
            {submitStatus && (
              <div className={`mx-6 mb-4 p-4 rounded-md ${submitStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex items-center gap-2">
                  {submitStatus.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">{submitStatus.message}</span>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDevice(null);
                  setSubmitStatus(null);
                }}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (t('saving') || 'Saving...') : (t('saveChanges') || 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
