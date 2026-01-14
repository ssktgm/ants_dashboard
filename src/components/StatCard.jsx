import React from 'react';
import Card from './Card';

const StatCard = ({ title, value, subValue, icon: Icon, color = "blue" }) => (
    <Card className={`flex items-center space-x-4 border-l-4 border-primary-500`}>
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
    </Card>
);

export default StatCard;
