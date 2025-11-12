// src/components/dashboard/RecentActivity.jsx
import React from 'react';
import { Activity } from 'lucide-react';
import Card from '../common/Card';

const RecentActivity = ({ activities }) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
        <Activity className="text-primary-600" />
      </div>

      <div className="space-y-4">
        {activities.map((activity, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2" />
            <div className="flex-1">
              <p className="text-sm text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentActivity;