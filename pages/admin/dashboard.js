// pages/admin/dashboard.js

import React from 'react';
import InventoryManagement from './InventoryManagement';
import RentalLogging from './RentalLogging';
import Reports from './Reports';

const Dashboard = () => {
    return (
        <div>
            <h1>Admin Dashboard</h1>
            <InventoryManagement />
            <RentalLogging />
            <Reports />
        </div>
    );
};

export default Dashboard;
