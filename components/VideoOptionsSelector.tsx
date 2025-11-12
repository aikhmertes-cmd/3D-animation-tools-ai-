import React from 'react';

export type VideoAspectRatio = '16:9' | '9:16';
export type Resolution = '720p' | '1080p';

interface VideoOptionsSelectorProps {
    aspectRatio: VideoAspectRatio;
    setAspectRatio: (ratio: VideoAspectRatio) => void;
    resolution: Resolution;
    setResolution: (res: Resolution) => void;
    isDisabled: boolean;
}

const SelectorButton: React.FC<{ onClick: () => void; isActive: boolean; children: React.ReactNode; disabled: boolean; }> = 
({ onClick, isActive, children, disabled }) => {
    const baseClasses = "px-3 py-1 text-sm font-semibold rounded-md transition-all duration-200 disabled:opacity-50";
    const activeClasses = "bg-cyan-500/20 text-cyan-300";
    const inactiveClasses = "bg-gray-600 text-gray-300 hover:bg-gray-500";
    
    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {children}
        </button>
    );
};


const VideoOptionsSelector: React.FC<VideoOptionsSelectorProps> = ({
    aspectRatio,
    setAspectRatio,
    resolution,
    setResolution,
    isDisabled,
}) => {
    return (
        <div className="flex items-center gap-4 p-2 bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-1">
                <SelectorButton onClick={() => setAspectRatio('16:9')} isActive={aspectRatio === '16:9'} disabled={isDisabled}>16:9</SelectorButton>
                <SelectorButton onClick={() => setAspectRatio('9:16')} isActive={aspectRatio === '9:16'} disabled={isDisabled}>9:16</SelectorButton>
            </div>
            <div className="w-px h-6 bg-gray-600" />
            <div className="flex items-center gap-1">
                <SelectorButton onClick={() => setResolution('720p')} isActive={resolution === '720p'} disabled={isDisabled}>720p</SelectorButton>
                <SelectorButton onClick={() => setResolution('1080p')} isActive={resolution === '1080p'} disabled={isDisabled}>1080p</SelectorButton>
            </div>
        </div>
    );
};

export default VideoOptionsSelector;
