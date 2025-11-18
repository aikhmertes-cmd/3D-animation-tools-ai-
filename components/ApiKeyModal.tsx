import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
    onClear: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, onClear }) => {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        if (isOpen) {
            setApiKey(localStorage.getItem('gemini_api_key') || '');
        }
    }, [isOpen]);

    const handleSave = () => {
        onSave(apiKey);
    };

    const handleClear = () => {
        setApiKey('');
        onClear();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="apiKeyModalTitle">
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h2 id="apiKeyModalTitle" className="text-xl font-bold text-white mb-4">Manage API Key</h2>
                <p className="text-gray-400 mb-4 text-sm">Your API key is stored locally in your browser and is never sent to our servers.</p>
                <label htmlFor="apiKeyInput" className="sr-only">Gemini API Key</label>
                <input
                    id="apiKeyInput"
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API Key"
                    className="w-full bg-gray-700 text-gray-200 placeholder-gray-400 border border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                />
                <div className="flex justify-end items-center gap-4 mt-6">
                    <button onClick={handleClear} className="text-sm text-red-400 hover:text-red-300 transition">Clear Key</button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md transition">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition">Save Key</button>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;