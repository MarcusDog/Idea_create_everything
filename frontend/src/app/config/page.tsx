'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Save,
  Key,
  Server,
  TestTube
} from 'lucide-react';
import Link from 'next/link';

interface APIConfig {
  id: string;
  name: string;
  provider: string;
  base_url?: string;
  model?: string;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
}

export default function ConfigPage() {
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'nvidia',
    api_key: '',
    base_url: 'https://integrate.api.nvidia.com/v1',
    model: 'nvidia/moonshotai/kimi-k2.5',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/configs/`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      } else {
        console.warn('Failed to load configs, using empty list');
        setConfigs([]);
      }
    } catch (error) {
      console.warn('API not available, using empty list:', error);
      setConfigs([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = editingId
        ? `${apiUrl}/api/v1/configs/${editingId}`
        : `${apiUrl}/api/v1/configs/`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadConfigs();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          provider: 'nvidia',
          api_key: '',
          base_url: 'https://integrate.api.nvidia.com/v1',
          model: 'nvidia/moonshotai/kimi-k2.5',
          is_active: true,
          is_default: false,
        });
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (configId: string) => {
    setTestingId(configId);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/configs/${configId}/test`,
        { method: 'POST' }
      );
      const data = await response.json();
      alert(data.success 
        ? `✅ 连接成功！延迟: ${data.latency_ms}ms` 
        : `❌ 连接失败: ${data.message}`
      );
    } catch (error) {
      alert('❌ 测试失败');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (configId: string) => {
    if (!confirm('确定要删除这个配置吗？')) return;
    
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/configs/${configId}`,
        { method: 'DELETE' }
      );
      if (response.ok) {
        await loadConfigs();
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  };

  const handleSetDefault = async (configId: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/configs/${configId}/set-default`,
        { method: 'POST' }
      );
      if (response.ok) {
        await loadConfigs();
      }
    } catch (error) {
      console.error('Failed to set default:', error);
    }
  };

  const startEdit = (config: APIConfig) => {
    setEditingId(config.id);
    setFormData({
      name: config.name,
      provider: config.provider,
      api_key: '', // Don't show existing key
      base_url: config.base_url || '',
      model: config.model || '',
      is_active: config.is_active,
      is_default: config.is_default,
    });
    setShowForm(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Settings className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">
                API配置中心
              </span>
            </div>
            <nav className="flex items-center space-x-6">
              <Link
                href="/"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                首页
              </Link>
              <Link
                href="/projects"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                我的项目
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              API配置管理
            </h1>
            <p className="text-slate-600">
              管理您的AI API密钥，支持NVIDIA、OpenAI等多种提供商
            </p>
          </div>

          {/* Add Button */}
          <div className="mb-6">
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: '',
                  provider: 'nvidia',
                  api_key: '',
                  base_url: 'https://integrate.api.nvidia.com/v1',
                  model: 'nvidia/moonshotai/kimi-k2.5',
                  is_active: true,
                  is_default: false,
                });
                setShowForm(!showForm);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>添加配置</span>
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {editingId ? '编辑配置' : '添加新配置'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      配置名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="例如：NVIDIA主账号"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      提供商 *
                    </label>
                    <select
                      value={formData.provider}
                      onChange={(e) => setFormData({...formData, provider: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="nvidia">NVIDIA</option>
                      <option value="openai">OpenAI</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      API密钥 {editingId ? '(留空表示不修改)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                      placeholder="输入API密钥"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={!editingId}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      基础URL
                    </label>
                    <input
                      type="text"
                      value={formData.base_url}
                      onChange={(e) => setFormData({...formData, base_url: e.target.value})}
                      placeholder="https://integrate.api.nvidia.com/v1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      模型
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      placeholder="nvidia/moonshotai/kimi-k2.5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">启用</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">设为默认</span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>保存中...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>保存</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Config List */}
          <div className="space-y-4">
            {configs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <Key className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  暂无API配置
                </h3>
                <p className="text-slate-600 mb-4">
                  添加您的第一个API配置以开始使用AI功能
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  添加配置
                </button>
              </div>
            ) : (
              configs.map((config) => (
                <div
                  key={config.id}
                  className={`bg-white rounded-xl border p-6 transition-shadow hover:shadow-md ${
                    config.is_default ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {config.name}
                        </h3>
                        {config.is_default && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            默认
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          config.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {config.is_active ? '启用' : '禁用'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-slate-600">
                        <p className="flex items-center space-x-2">
                          <Server className="w-4 h-4" />
                          <span>提供商: {config.provider}</span>
                        </p>
                        <p>模型: {config.model || '默认'}</p>
                        <p>URL: {config.base_url || '默认'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTest(config.id)}
                        disabled={testingId === config.id || !config.is_active}
                        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="测试连接"
                      >
                        <TestTube className={`w-5 h-5 ${testingId === config.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => startEdit(config)}
                        className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      {!config.is_default && (
                        <button
                          onClick={() => handleSetDefault(config.id)}
                          disabled={!config.is_active}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="设为默认"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              使用说明
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>添加至少一个API配置才能使用AI功能</li>
              <li>可以添加多个配置，系统会自动选择可用的配置</li>
              <li>点击测试按钮可验证API密钥是否有效</li>
              <li>API密钥会被加密存储，确保安全性</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
