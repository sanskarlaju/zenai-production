// src/components/dashboard/StatsCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../common/Card';
import { motion } from 'framer-motion';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  subtitle,
  color = 'primary' 
}) => {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <Card hover className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors[color]} opacity-10 rounded-full -mr-16 -mt-16`} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <div className={`p-3 bg-gradient-to-br ${colors[color]} rounded-lg`}>
            <Icon className="text-white" size={20} />
          </div>
        </div>

        <motion.p 
          className="text-3xl font-bold text-gray-900 mb-2"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {value}
        </motion.p>

        {trend && (
          <div className="flex items-center gap-2">
            {trendUp ? (
              <TrendingUp size={16} className="text-green-500" />
            ) : (
              <TrendingDown size={16} className="text-red-500" />
            )}
            <span className={`text-sm font-medium ${
              trendUp ? 'text-green-500' : 'text-red-500'
            }`}>
              {trend}
            </span>
            <span className="text-sm text-gray-500">vs last month</span>
          </div>
        )}

        {subtitle && (
          <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;