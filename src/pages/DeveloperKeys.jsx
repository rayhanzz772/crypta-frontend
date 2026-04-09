import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  AlertTriangle,
  CheckCircle,
  Code,
  RefreshCw,
  Calendar,
  Shield,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const DeveloperKeys = () => {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});
  const [keyToRevoke, setKeyToRevoke] = useState(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/developer/api-keys');
      setApiKeys(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      setIsGenerating(true);
      const response = await api.post('/api/developer/generate-key');
      
      // Handle nested response structure: response.data.data.key
      setNewKeyData({
        key: response.data.data?.key || response.data.key,
        id: response.data.data?.id || response.data.id,
        created_at: response.data.data?.created_at || response.data.created_at
      });
      setShowNewKey(true);
      
      toast.success('API Key generated successfully!');
      fetchApiKeys();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to generate API key';
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeApiKey = async (keyId) => {
    try {
      await api.delete(`/api/developer/revoke-key/${keyId}`);
      toast.success('API Key revoked successfully');
      setKeyToRevoke(null);
      fetchApiKeys();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to revoke API key';
      toast.error(errorMsg);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Developer API Keys
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage your API keys for programmatic access
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                Keep your API keys secure
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                API keys provide full access to your account. Never share them or commit them to public repositories.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/api-docs')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              API Docs
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Generate New Key Button */}
        <div className="mb-6">
          <button
            onClick={generateApiKey}
            disabled={isGenerating}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Generate New API Key
              </>
            )}
          </button>
        </div>

        {/* New Key Modal */}
        {showNewKey && newKeyData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                    API Key Generated Successfully!
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Save this key securely - it won't be shown again
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Your API Key
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-800 dark:text-white break-all">
                    {newKeyData.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newKeyData.key)}
                    className="p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Important:</strong> This is the only time you'll see this key. Make sure to copy and store it securely.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowNewKey(false);
                  setNewKeyData(null);
                }}
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                I've Saved My Key
              </button>
            </div>
          </div>
        )}

        {/* Revoke Confirmation Modal */}
        {keyToRevoke && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                    Revoke API Key?
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    This action cannot be undone. Applications using this key will immediately lose access.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setKeyToRevoke(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => revokeApiKey(keyToRevoke)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Revoke Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="border-b border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5" />
              Active API Keys
            </h2>
          </div>

          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Loading API keys...</p>
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                <Key className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                No API Keys Yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-6">
                Generate your first API key to start using the API programmatically
              </p>
              <button
                onClick={generateApiKey}
                disabled={isGenerating}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Generate API Key
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Key Display */}
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                          API Key
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm font-mono text-slate-800 dark:text-white">
                            {visibleKeys[key.id] ? key.key : maskApiKey(key.key)}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title={visibleKeys[key.id] ? 'Hide key' : 'Show key'}
                          >
                            {visibleKeys[key.id] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(key.key)}
                            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {formatDate(key.created_at)}</span>
                        </div>
                        {key.last_used_at && (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="w-4 h-4" />
                            <span>Last used: {formatDate(key.last_used_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => setKeyToRevoke(key.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Documentation Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/app/api-docs')}
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
          >
            <Code className="w-4 h-4" />
            View API Documentation
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperKeys;
