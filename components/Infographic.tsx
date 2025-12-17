/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { GeneratedImage, VideoStyle } from '../types';
import { Download, Sparkles, Edit3, Maximize2, X, ZoomIn, ZoomOut, Share2, Copy, Check, Twitter, Linkedin, Facebook, Film, Loader2, Play } from 'lucide-react';
import { generateVideoFromImage } from '../services/geminiService';

interface InfographicProps {
  image: GeneratedImage;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
}

const Infographic: React.FC<InfographicProps> = ({ image, onEdit, isEditing }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied'>('idle');
  
  // Animation State
  const [isAnimating, setIsAnimating] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoStyle, setVideoStyle] = useState<VideoStyle>('Cinematic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onEdit(editPrompt);
    setEditPrompt('');
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
  }

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], {type: mimeString});
  };

  const handleNativeShare = async () => {
    try {
        const blob = dataURItoBlob(image.data);
        const file = new File([blob], `invest-media-pro-${image.id}.png`, { type: 'image/png' });
        
        const shareData = {
            files: [file],
            title: 'InvestMediaPro Visual',
            text: `Check out this broadcast visual about ${image.prompt}!`,
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
            await navigator.share(shareData);
        } else {
             alert("System sharing is not supported on this device/browser for files.");
        }
    } catch (e) {
        console.error("Sharing failed", e);
    }
  };

  const handleCopyImage = async () => {
      setCopyStatus('copying');
      try {
          const blob = dataURItoBlob(image.data);
          await navigator.clipboard.write([
              new ClipboardItem({
                  [blob.type]: blob
              })
          ]);
          setCopyStatus('copied');
          setTimeout(() => setCopyStatus('idle'), 2000);
      } catch (err) {
          console.error("Copy failed", err);
          setCopyStatus('idle');
          alert("Failed to copy image to clipboard. Try using right-click > Copy Image.");
      }
  };
  
  const handleOpenVideoModal = () => {
    setVideoUrl(null);
    setShowVideoModal(true);
  };
  
  const handleGenerateVideo = async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    try {
        const url = await generateVideoFromImage(image.data, videoStyle);
        setVideoUrl(url);
    } catch (e) {
        console.error("Video generation failed", e);
        alert("Failed to generate animation. Please try again later.");
        // Close modal if failed? or just let user retry
    } finally {
        setIsAnimating(false);
    }
  };
  
  const shareText = encodeURIComponent(`Visualized "${image.prompt}" with InvestMediaPro!`);
  const shareUrl = encodeURIComponent(window.location.href); 
  
  const socialLinks = [
      { name: 'X / Twitter', icon: Twitter, url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, color: 'bg-black text-white' },
      { name: 'LinkedIn', icon: Linkedin, url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, color: 'bg-[#0077b5] text-white' },
      { name: 'Facebook', icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, color: 'bg-[#1877F2] text-white' }
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto animate-in fade-in zoom-in duration-700 mt-4 md:mt-8">
      
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-scale {
          animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Image Container */}
      <div className="relative group w-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700/50">
        {/* Decorative Corner Markers */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-2xl z-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-2xl z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-2xl z-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 rounded-br-2xl z-20 pointer-events-none"></div>

        <img 
          key={image.id}
          src={image.data} 
          alt={image.prompt} 
          onClick={() => setIsFullscreen(true)}
          className="w-full h-auto object-contain max-h-[80vh] bg-checkered relative z-10 cursor-zoom-in animate-fade-scale"
        />
        
        {/* Hover Overlay for Quick Actions (Desktop Only) */}
        <div className="absolute top-6 right-6 hidden md:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <button 
            onClick={handleOpenVideoModal}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 block group/btn"
            title="Animate to Video"
          >
            <Film className="w-5 h-5 group-hover/btn:animate-pulse" />
          </button>
          <button 
            onClick={() => setShowShareModal(true)}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 block"
            title="Share Image"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsFullscreen(true)}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 block"
            title="Fullscreen View"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <a 
            href={image.data} 
            download={`invest-media-pro-${image.id}.png`}
            className="bg-black/60 backdrop-blur-md text-white p-3 rounded-xl shadow-lg hover:bg-cyan-600 transition-colors border border-white/10 block"
            title="Download Image"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Mobile-first Action Bar (Visible below image for easier access on small screens) */}
      <div className="flex md:hidden w-full max-w-3xl justify-between gap-2 px-4 mt-4 mb-2">
         <button 
            onClick={handleOpenVideoModal}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-800 text-white py-3 rounded-xl text-sm font-bold shadow-sm border border-slate-700 active:scale-95 transition-transform"
         >
             <Film className="w-4 h-4 text-cyan-400" />
             Animate
         </button>
         <button 
            onClick={() => setShowShareModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white py-3 rounded-xl text-sm font-bold shadow-sm border border-slate-300 dark:border-slate-700 active:scale-95 transition-transform"
         >
             <Share2 className="w-4 h-4" />
             Share
         </button>
         <a 
            href={image.data}
            download={`invest-media-pro-${image.id}.png`}
            className="flex-none flex items-center justify-center px-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 active:scale-95 transition-transform"
         >
             <Download className="w-4 h-4" />
         </a>
      </div>

      {/* Edit Bar */}
      <div className="w-full max-w-3xl -mt-0 md:-mt-8 relative z-40 px-4 md:pt-0 pt-2">
        <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl p-3 sm:p-2 sm:pr-3 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-2 items-center ring-1 ring-black/5 dark:ring-white/5">
            <div className="pl-4 text-cyan-600 dark:text-cyan-400 hidden sm:block">
                <Edit3 className="w-5 h-5" />
            </div>
            <form onSubmit={handleSubmit} className="flex-1 w-full flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Refine the visual (e.g., 'Make the background stars')..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950/50 sm:bg-transparent border border-slate-200 dark:border-white/5 sm:border-none rounded-xl sm:rounded-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 px-4 py-3 sm:px-2 sm:py-2 font-medium text-base"
                    disabled={isEditing}
                />
                <div className="w-full sm:w-auto" title={!editPrompt.trim() ? "Please enter a prompt to enhance" : "Enhance image"}>
                    <button
                        type="submit"
                        disabled={isEditing || !editPrompt.trim()}
                        className={`w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                            isEditing || !editPrompt.trim() 
                            ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed' 
                            : 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/20'
                        }`}
                    >
                        {isEditing ? (
                            <span className="animate-spin w-5 h-5 block border-2 border-white/30 border-t-white rounded-full"></span>
                        ) : (
                            <>
                                <span>Enhance</span>
                                <Sparkles className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
      </div>
      
      <div className="mt-8 text-center space-y-2 px-4">
        <p className="text-xs text-slate-500 dark:text-slate-500 font-mono max-w-xl mx-auto truncate opacity-60">
            PROMPT: {image.prompt}
        </p>
      </div>

      {/* Video Generation/Playback Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-slate-900 shrink-0">
                    <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                        <Film className="w-5 h-5 text-cyan-600" />
                        Broadcast Animation
                    </h3>
                    <button 
                        onClick={() => setShowVideoModal(false)}
                        className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        disabled={isAnimating}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 md:p-10 flex flex-col items-center justify-center flex-1 overflow-y-auto bg-slate-100 dark:bg-black/50">
                    {isAnimating ? (
                        <div className="text-center space-y-6">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                                <Film className="absolute inset-0 m-auto w-8 h-8 text-cyan-500 animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Generating Video...</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
                                    Creating {videoStyle} animation. This may take a minute.
                                </p>
                            </div>
                        </div>
                    ) : videoUrl ? (
                        <div className="w-full space-y-4 animate-in zoom-in duration-300">
                            <div className="relative w-full aspect-video bg-black rounded-xl shadow-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                                <video 
                                    src={videoUrl} 
                                    controls 
                                    autoPlay 
                                    loop 
                                    playsInline
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex justify-center pt-2">
                                <a 
                                    href={videoUrl} 
                                    download={`invest-media-pro-animation-${image.id}.mp4`}
                                    className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20 transition-all w-full md:w-auto justify-center"
                                >
                                    <Download className="w-5 h-5" />
                                    Download MP4
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full space-y-6 text-center">
                            <div className="space-y-2">
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Choose Animation Style</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Select a motion preset for your broadcast visual.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setVideoStyle('Cinematic')}
                                    className={`p-4 rounded-xl border transition-all ${
                                        videoStyle === 'Cinematic' 
                                        ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 ring-1 ring-cyan-500' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-cyan-500/50'
                                    }`}
                                >
                                    <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">Cinematic</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Slow Pan & Zoom (Ken Burns)</div>
                                </button>
                                <button
                                    onClick={() => setVideoStyle('Dynamic')}
                                    className={`p-4 rounded-xl border transition-all ${
                                        videoStyle === 'Dynamic' 
                                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 ring-1 ring-purple-500' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-500/50'
                                    }`}
                                >
                                    <div className="text-lg font-bold text-slate-900 dark:text-white mb-1">Dynamic</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">Broadcast Motion & Parallax</div>
                                </button>
                            </div>

                            <button 
                                onClick={handleGenerateVideo}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                Generate Video
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-md p-6 relative overflow-hidden">
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-600" />
                Share Visual
              </h3>

              <div className="space-y-4">
                 {/* Copy to Clipboard */}
                 <button 
                   onClick={handleCopyImage}
                   className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-white/5 group"
                 >
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-700 dark:text-slate-200">
                         {copyStatus === 'copied' ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </div>
                      <div className="text-left">
                         <div className="font-bold text-slate-900 dark:text-white text-sm">Copy Image</div>
                         <div className="text-xs text-slate-500">Paste directly into apps</div>
                      </div>
                   </div>
                   <span className="text-xs font-medium text-slate-400 group-hover:text-cyan-600 transition-colors">
                      {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
                   </span>
                 </button>

                 {/* Native Share (Mobile) */}
                 {typeof navigator.canShare === 'function' && (
                    <button 
                      onClick={handleNativeShare}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-white/5 group"
                    >
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-slate-700 dark:text-slate-200">
                             <Share2 className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                             <div className="font-bold text-slate-900 dark:text-white text-sm">System Share</div>
                             <div className="text-xs text-slate-500">Use native share menu</div>
                          </div>
                       </div>
                    </button>
                 )}
                
                <div className="h-px bg-slate-200 dark:bg-white/10 my-4"></div>
                
                <div className="grid grid-cols-3 gap-3">
                    {socialLinks.map((link) => (
                        <a 
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-transform hover:scale-105 ${link.color} shadow-lg`}
                        >
                            <link.icon className="w-5 h-5" />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-center">{link.name}</span>
                        </a>
                    ))}
                </div>

              </div>
           </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 pointer-events-none">
                <div className="flex gap-2 pointer-events-auto bg-white/10 backdrop-blur-md p-1 rounded-lg border border-black/5 dark:border-white/10">
                    <button onClick={handleZoomOut} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-slate-800 dark:text-slate-200 transition-colors" title="Zoom Out">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button onClick={handleResetZoom} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-slate-800 dark:text-slate-200 transition-colors" title="Reset Zoom">
                        <span className="text-xs font-bold">{Math.round(zoomLevel * 100)}%</span>
                    </button>
                    <button onClick={handleZoomIn} className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-md text-slate-800 dark:text-slate-200 transition-colors" title="Zoom In">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>

                <button 
                    onClick={handleCloseFullscreen}
                    className="pointer-events-auto p-3 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shadow-lg"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8">
                <img 
                    src={image.data} 
                    alt={image.prompt}
                    style={{ 
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.2s ease-out'
                    }}
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg origin-center"
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default Infographic;