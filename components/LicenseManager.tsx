
import React, { useState, useEffect, useMemo } from 'react';
import { KeyAuthAPI } from '../services/keyauthService.ts';
import { useAuth } from './AuthContext.tsx';

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const LicenseManager: React.FC = () => {
    const api = useMemo(() => new KeyAuthAPI(), []);
    const { setIsLicensed } = useAuth();
    const [isInitialized, setIsInitialized] = useState(false);
    const [username, setUsername] = useState('');
    const [licenseKey, setLicenseKey] = useState('');
    const [hwid, setHwid] = useState('');
    const [isHwidVisible, setIsHwidVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [responseMessage, setResponseMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userInfo, setUserInfo] = useState<any | null>(null);

    useEffect(() => {
        const initialize = async () => {
            const initRes = await api.init();
            if (!initRes.success) {
                setResponseMessage({ type: 'error', text: initRes.message });
                setIsLoading(false);
                return;
            }
            setIsInitialized(true);
            setHwid(api.getHwid());

            const savedUsername = localStorage.getItem('username');
            const savedKey = localStorage.getItem('license_key');

            if (savedUsername && savedKey) {
                setUsername(savedUsername);
                setLicenseKey(savedKey);
                const loginRes = await api.login(savedUsername, savedKey);
                if (loginRes.success) {
                    setIsLoggedIn(true);
                    setIsLicensed(true);
                    setUserInfo(loginRes.info || null);
                    setResponseMessage({ type: 'success', text: `Welcome back! ${loginRes.message}` });
                } else {
                    localStorage.removeItem('username');
                    localStorage.removeItem('license_key');
                    setIsLicensed(false);
                    setResponseMessage({ type: 'error', text: 'Your saved session is invalid. Please log in again.' });
                }
            } else {
                 setResponseMessage({ type: 'success', text: initRes.message });
                 setIsLicensed(false);
            }
            setIsLoading(false);
        };
        initialize();
    }, [api, setIsLicensed]);

    const handleRegister = async () => {
        setIsLoading(true);
        setResponseMessage(null);
        const registerRes = await api.register(username, licenseKey);
        if (registerRes.success) {
            setResponseMessage({ type: 'success', text: `${registerRes.message} Automatically logging in...` });
            // Auto-login after successful registration
            const loginRes = await api.login(username, licenseKey);
            if (loginRes.success) {
                setIsLoggedIn(true);
                setIsLicensed(true);
                setUserInfo(loginRes.info || null);
                localStorage.setItem('username', username);
                localStorage.setItem('license_key', licenseKey);
                setResponseMessage({ type: 'success', text: `Welcome! Login successful.` });
            } else {
                setIsLicensed(false);
                setResponseMessage({ type: 'error', text: `Registration succeeded, but auto-login failed: ${loginRes.message}` });
            }
        } else {
            setIsLicensed(false);
            setResponseMessage({ type: 'error', text: registerRes.message });
        }
        setIsLoading(false);
    };
    
    const handleLogout = () => {
        setIsLoggedIn(false);
        setIsLicensed(false);
        setUserInfo(null);
        setUsername('');
        setLicenseKey('');
        localStorage.removeItem('username');
        localStorage.removeItem('license_key');
        setResponseMessage({ type: 'success', text: 'Logged out successfully.' });
    };

    const handleCopyHwid = () => {
        navigator.clipboard.writeText(hwid);
    };

    const inputClasses = "bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full p-3 placeholder-slate-400 disabled:opacity-50 transition-all duration-300";
    const hwidButtonClasses = "px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors";

    if (isLoggedIn && userInfo) {
        return (
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
                <div className="w-full bg-[#0d121d] p-8 rounded-xl border border-slate-700/50 shadow-2xl shadow-slate-900/50 space-y-6">
                     <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Account Details</h2>
                     <div className="p-4 bg-slate-800/50 rounded-lg space-y-2 text-slate-300 font-mono text-sm border border-slate-700">
                         <p><strong>Username:</strong> <span className="text-cyan-400">{userInfo.username}</span></p>
                         <p><strong>Subscription:</strong> <span className="text-cyan-400">{userInfo.subscriptions?.[0]?.subscription}</span></p>
                         <p><strong>Expiry Date:</strong> <span className="text-cyan-400">{userInfo.subscriptions?.[0]?.expiry}</span></p>
                         <p><strong>Days Remaining:</strong> <span className="text-cyan-400">{userInfo.subscriptions?.[0]?.daysLeft} days</span></p>
                         <p><strong>Last Login:</strong> <span className="text-cyan-400">{new Date(parseInt(userInfo.lastlogin) * 1000).toLocaleString()}</span></p>
                         <p><strong>HWID:</strong> <span className="text-cyan-400">{userInfo.hwid}</span></p>
                     </div>
                     {responseMessage && (
                        <div className={`p-3 text-center rounded-lg ${
                            responseMessage.type === 'success' 
                                ? 'bg-green-900/50 border border-green-700 text-green-300' 
                                : 'bg-red-950/60 border border-red-700 text-red-300'
                        }`}>
                            {responseMessage.text}
                        </div>
                     )}
                     <button onClick={handleLogout} className="w-full flex items-center justify-center px-6 py-3 font-semibold text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-700 transform transition">
                        Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center">
            <div className="w-full bg-[#0d121d] p-8 rounded-xl border border-slate-700/50 shadow-2xl shadow-slate-900/50 space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">License Manager</h2>
                    <p className="text-slate-400 mt-1">Manage your license key and account access.</p>
                </div>

                <div className="space-y-4">
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className={inputClasses} disabled={isLoading || !isInitialized} aria-label="Username" />
                    <input type="text" value={licenseKey} onChange={e => setLicenseKey(e.target.value)} placeholder="License Key" className={inputClasses} disabled={isLoading || !isInitialized} aria-label="License Key" />
                    
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-slate-300">Your HWID</label>
                        <div className="flex items-center gap-2">
                            <input type={isHwidVisible ? 'text' : 'password'} value={hwid} readOnly className={`${inputClasses} font-mono`} aria-label="Your HWID" />
                            <button onClick={handleCopyHwid} className={hwidButtonClasses}>Copy</button>
                            <button onClick={() => setIsHwidVisible(v => !v)} className={hwidButtonClasses}>
                                {isHwidVisible ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                </div>

                {responseMessage && (
                    <div className={`p-3 text-center rounded-lg ${
                        responseMessage.type === 'success' 
                            ? 'bg-green-900/50 border border-green-700 text-green-300' 
                            : 'bg-red-950/60 border border-red-700 text-red-300'
                    }`}>
                        {responseMessage.text}
                    </div>
                )}

                <div>
                    <button onClick={handleRegister} disabled={isLoading || !isInitialized} className="w-full flex items-center justify-center px-6 py-4 font-bold text-white bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-lg shadow-lg hover:from-fuchsia-700 hover:to-purple-700 transform transition-all duration-300 disabled:opacity-50 active:scale-95">
                       {isLoading ? <Spinner /> : 'Register'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LicenseManager;
