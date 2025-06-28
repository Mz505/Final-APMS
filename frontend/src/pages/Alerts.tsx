
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Package, RefreshCw, Eye, CheckCircle, X } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import { alertsAPI, medicineAPI } from '../services/api';
import { Alert, Medicine } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AddMedicineModal from '../components/Modals/AddMedicineModal';

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lowStockMedicines, setLowStockMedicines] = useState<Medicine[]>([]);
  const [expiringMedicines, setExpiringMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMedicineOpen, setAddMedicineOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllAlerts();
  }, []);

  const fetchAllAlerts = async () => {
    try {
      setLoading(true);
      const [alertsData, lowStockData, expiringData] = await Promise.all([
        alertsAPI.getAll({ limit: 50 }),
        medicineAPI.getLowStock(),
        medicineAPI.getExpiring()
      ]);

      setAlerts(alertsData.alerts || []);
      setLowStockMedicines(lowStockData);
      setExpiringMedicines(expiringData);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast.error('Failed to refresh alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRedirect = async (alert: Alert) => {
    try {
      await alertsAPI.markAsRead(alert._id);
      setAlerts(prev => prev.map(a => a._id === alert._id ? { ...a, isRead: true } : a));
      switch (alert.type) {
        case 'stock_low':
        case 'medicine_expiring':
        case 'medicine_expired':
        case 'medicine_added':
          navigate('/medicines');
          break;
        case 'medicine_issued':
          navigate('/issuances');
          break;
        case 'user_added':
        case 'user_deleted':
          navigate('/users');
          break;
        case 'stock_entry':
          navigate('/stock-entries');
          break;
        default:
          toast('No specific page for this alert type.');
          break;
      }
    } catch (error) {
      console.error('Failed to review alert:', error);
      toast.error('Failed to review alert');
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await alertsAPI.delete(alertId);
      setAlerts(prev => prev.filter(a => a._id !== alertId));
      toast.success('Alert dismissed');
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      toast.error('Failed to dismiss alert');
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'danger': return 'danger';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'stock_low': return '⚠️';
      case 'medicine_expiring': return '📅';
      case 'medicine_expired': return '🚨';
      case 'user_added': return '👤';
      case 'user_deleted': return '🗑️';
      case 'medicine_added': return '💊';
      case 'stock_entry': return '📦';
      case 'medicine_issued': return '📋';
      default: return '📢';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Alerts & Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor critical inventory alerts and system notifications
          </p>
        </div>
        <Button onClick={fetchAllAlerts} className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Low Stock Alerts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {lowStockMedicines.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Expiring Soon
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {expiringMedicines.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-300" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Alerts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {alerts.filter(a => a.isActive).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Alerts ({alerts.filter(a => a.isActive).length})
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.filter(a => a.isActive).length > 0 ? (
            <div className="space-y-4">
              {alerts.filter(a => a.isActive).map((alert) => (
                <div
                  key={alert._id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${alert.isRead
                    ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {format(new Date(alert.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={getSeverityBadgeVariant(alert.severity) as any}>
                      {alert.severity}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReviewRedirect(alert)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDismissAlert(alert._id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No active alerts at the moment
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Low Stock Medicines ({lowStockMedicines.length})
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          {lowStockMedicines.length > 0 ? (
            <div className="space-y-4">
              {lowStockMedicines.map((medicine) => (
                <div
                  key={medicine._id}
                  className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {medicine.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {medicine.category} • Current Stock: {medicine.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="danger">
                      Min: {medicine.minQuantity}
                    </Badge>

                    <Button size="sm" onClick={() => {
                      setSelectedMedicine(medicine);
                      setAddMedicineOpen(true);
                    }}>
                      Restock
                    </Button>
                    <AddMedicineModal
                      isOpen={isAddMedicineOpen}
                      onClose={() => setAddMedicineOpen(false)}
                      onSuccess={() => {
                        setAddMedicineOpen(false);
                        fetchAllAlerts();
                      }}
                      selectedMedicine={selectedMedicine}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No low stock alerts at the moment
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;


