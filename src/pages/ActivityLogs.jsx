import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity,
  Plus, 
  Eye, 
  Trash2, 
  Edit, 
  Lock, 
  LockOpen,
  Shield,
  Calendar,
  TrendingUp,
  StickyNote
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logsAPI } from '../utils/api';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch both summary and detailed logs
      const [summaryData, logsData] = await Promise.all([
        logsAPI.getSummary(),
        logsAPI.getAll()
      ]);


      // Handle summary data
      if (summaryData?.data) {
        setSummary(summaryData.data);
      }

      // Handle logs data
      let logsList = [];
      if (Array.isArray(logsData)) {
        logsList = logsData;
      } else if (logsData?.data && Array.isArray(logsData.data)) {
        logsList = logsData.data;
      }

      setLogs(logsList);
    } catch (error) {
      toast.error('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const iconClass = "w-5 h-5";
    
    if (action === 'Locked Vault') return <Lock className={iconClass} />;
    if (action === 'Unlocked Vault') return <LockOpen className={iconClass} />;
    if (action === 'Decrypted password') return <Eye className={iconClass} />;
    if (action === 'Create new password') return <Plus className={iconClass} />;
    if (action === 'Updated password') return <Edit className={iconClass} />;
    if (action === 'Deleted password') return <Trash2 className={iconClass} />;
    if (action === 'Create new note') return <StickyNote className={iconClass} />;
    if (action === 'Deleted note') return <Trash2 className={iconClass} />;
    if (action === 'Updated note') return <Edit className={iconClass} />;
    
    return <Activity className={iconClass} />;
  };

  const getActionColor = (action) => {
    if (action === 'Locked Vault') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (action === 'Unlocked Vault') return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (action === 'Decrypted password') return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
    if (action === 'Create new password') return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
    if (action === 'Updated password') return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    if (action === 'Deleted password') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (action === 'Create new note') return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    if (action === 'Deleted note') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    if (action === 'Updated note') return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    
    return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getVaultDisplayName = (action, vaultName) => {
    // For lock/unlock actions without vault_name, use static text
    if (action === 'Locked Vault' && !vaultName) {
      return 'Vault secured successfully';
    }
    if (action === 'Unlocked Vault' && !vaultName) {
      return 'Vault accessed';
    }
    
    return vaultName || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
            Activity Logs
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track all vault activities and security events
          </p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Activity Summary Cards */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(summary).map(([action, count]) => (
            <motion.div
              key={action}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${getActionColor(action)}`}>
                {getActionIcon(action)}
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                {count}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {action}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Activity Header */}
      <div className="flex items-center gap-3 pt-4">
        <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          Recent Activity
        </h2>
      </div>

      {/* Activity Timeline */}
      {logs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-12 border border-slate-200 dark:border-slate-700 text-center">
          <Shield className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
            No Activity Yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            Your vault activity will appear here
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-1">
                          {log.action}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {getVaultDisplayName(log.action, log.log_name)}
                        </p>
                      </div>
                      
                      {/* Timestamp */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-primary-800 dark:text-primary-200">
            <p className="font-semibold mb-1">Activity Tracking</p>
            <p className="text-primary-700 dark:text-primary-300">
              All vault activities are logged for security purposes. This helps you monitor access patterns and detect any suspicious activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
