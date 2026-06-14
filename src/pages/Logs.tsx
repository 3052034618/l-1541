import { useState } from 'react';
import { FileText, User, Clock, Monitor, Filter, Shield } from 'lucide-react';
import { useLogStore } from '@/store/useLogStore';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';

const roleFilterOptions: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: '全部角色' },
  { value: 'director', label: '血站主任' },
  { value: 'nurse', label: '护士' },
  { value: 'donor', label: '献血者' },
];

const roleColors: Record<UserRole, string> = {
  donor: 'bg-blue-500/20 text-blue-400',
  nurse: 'bg-green-500/20 text-green-400',
  director: 'bg-purple-500/20 text-purple-400',
};

const roleText: Record<UserRole, string> = {
  donor: '献血者',
  nurse: '护士',
  director: '血站主任',
};

function getUserRole(userId: string): UserRole | null {
  if (userId === 'u001') return 'director';
  if (userId === 'u002') return 'nurse';
  if (userId === 'u003' || userId.startsWith('donor')) return 'donor';
  return null;
}

export default function Logs() {
  const { logs, getLogsByRole, clearLogs } = useLogStore();
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const displayLogs = roleFilter === 'all' ? logs : getLogsByRole(roleFilter);

  const formatTime = (time: string) => {
    return new Date(time).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const stats = [
    { label: '总操作记录', value: logs.length, icon: FileText, color: 'from-blue-500 to-cyan-500' },
    { label: '血站主任操作', value: getLogsByRole('director').length, icon: Shield, color: 'from-purple-500 to-pink-500' },
    { label: '护士操作', value: getLogsByRole('nurse').length, icon: User, color: 'from-green-500 to-emerald-500' },
    { label: '献血者操作', value: getLogsByRole('donor').length, icon: User, color: 'from-orange-500 to-yellow-500' },
  ];

  return (
    <div className="h-full bg-slate-950 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <FileText className="text-blue-500" />
            操作日志
          </h1>
          <p className="text-slate-400">查看系统所有用户的操作记录</p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => {
              if (confirm('确定要清空所有操作日志吗？此操作不可恢复。')) {
                clearLogs();
              }
            }}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            清空日志
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                >
                  <IconComponent size={24} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <div className="flex bg-slate-800/50 rounded-lg p-1">
            {roleFilterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setRoleFilter(option.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  roleFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-slate-400">
          共 <span className="text-white font-medium">{displayLogs.length}</span> 条记录
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">时间</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">用户</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">角色</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">操作内容</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">IP地址</th>
            </tr>
          </thead>
          <tbody>
            {displayLogs.length > 0 ? (
              displayLogs.map((log) => {
                const role = getUserRole(log.userId);
                return (
                  <tr
                    key={log.id}
                    className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Clock size={14} className="text-slate-500" />
                        {formatTime(log.time)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {log.userName.charAt(0)}
                          </span>
                        </div>
                        <span className="text-sm text-white">{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {role && (
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', roleColors[role])}>
                          {roleText[role]}
                        </span>
                      )}
                      {!role && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
                          未知
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-300 max-w-md truncate">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Monitor size={14} />
                        {log.ip}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5}>
                  <div className="py-12 text-center text-slate-500">
                    <FileText size={48} className="mx-auto mb-3 opacity-50" />
                    <p>暂无操作记录</p>
                    <p className="text-sm mt-1">登录系统或执行操作后，记录将显示在此处</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
