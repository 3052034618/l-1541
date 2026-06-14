import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Camera, Check } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';

const roles: { role: UserRole; label: string; description: string; icon: typeof User }[] = [
  { role: 'director', label: '血站主任', description: '全局调度、审批管理、数据统计', icon: Shield },
  { role: 'nurse', label: '护士', description: '扫码确认、采集操作、设备状态查看', icon: User },
  { role: 'donor', label: '献血者', description: '在线预约、查看分配车次、献血记录', icon: User },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const scanInterval = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
      }
    };
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const startFaceScan = () => {
    if (!selectedRole) return;
    setIsScanning(true);
    setScanProgress(0);

    scanInterval.current = window.setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          if (scanInterval.current) {
            clearInterval(scanInterval.current);
          }
          setTimeout(() => {
            login(selectedRole);
            navigate('/dashboard');
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 40);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-slate-800/50 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-slate-700/30 rounded-full" />
      </div>

      <div className="relative w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg shadow-red-500/25">
              <span className="text-white font-bold text-2xl">血</span>
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">智慧城市献血</h1>
              <p className="text-slate-400">调度与血库联动可视化平台</p>
            </div>
          </div>
          <p className="text-slate-500">人脸识别登录 · 三级权限管理 · 全流程可追溯</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.role;
            return (
              <button
                key={role.role}
                onClick={() => handleRoleSelect(role.role)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 scale-[1.02]'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600 hover:bg-slate-800/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400'
                  }`}
                >
                  <IconComponent size={24} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{role.label}</h3>
                <p className="text-sm text-slate-400">{role.description}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <div className="flex flex-col items-center">
            <div className="relative w-48 h-48 mb-6">
              <div
                className={`w-full h-full rounded-full border-4 flex items-center justify-center overflow-hidden ${
                  isScanning
                    ? 'border-green-500 shadow-lg shadow-green-500/30'
                    : selectedRole
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-slate-600'
                } transition-all duration-300`}
              >
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                  <Camera size={48} className="text-slate-500" />
                </div>

                {isScanning && (
                  <div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                    style={{
                      top: `${scanProgress}%`,
                      boxShadow: '0 0 20px rgba(74, 222, 128, 0.8)',
                    }}
                  />
                )}
              </div>

              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
              </div>
            </div>

            <p className="text-slate-400 mb-4">
              {!selectedRole
                ? '请先选择登录角色'
                : isScanning
                ? '正在进行人脸识别...'
                : '请将面部对准摄像头'}
            </p>

            {isScanning && (
              <div className="w-64 mb-4">
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">{scanProgress}%</p>
              </div>
            )}

            <button
              onClick={startFaceScan}
              disabled={!selectedRole || isScanning}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedRole && !isScanning
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isScanning ? '识别中...' : '开始人脸识别'}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-sm mt-6">
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
}
