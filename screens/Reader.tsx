import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { generateStorySession, RitualResponse, updateLocalProfile, abortRitual } from '../services/ritualService';
import { useAuth } from '../contexts/AuthContext';

const Reader: React.FC = () => {
  const navigate = useNavigate();
  const { caseId } = useParams<{ caseId: string }>();
  const { profile, retry, loading: authLoading } = useAuth();
  
  const [ritualData, setRitualData] = useState<RitualResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingCase, setIsLoadingCase] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("INITIALIZING");
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  
  const processingRef = useRef<boolean>(false);

  useEffect(() => {
    if (authLoading) return;
    if (!profile) {
      setError({ code: 'AUTH', message: 'Uplink identity required.' });
      return;
    }

    const init = async () => {
      if (processingRef.current) return;
      if (ritualData) return;

      setIsLoadingCase(true);
      setError(null);
      processingRef.current = true;

      try {
        const targetId = (!caseId || caseId === 'new') ? undefined : caseId;
        const data = await generateStorySession(targetId, (status) => {
          setLoadingStatus(status);
        });
        setRitualData(data);
        retry(); 
      } catch (err: any) {
        setError({ code: 'SESSION_FAIL', message: err.message || "Signal Lost" });
      } finally {
        setIsLoadingCase(false);
        processingRef.current = false;
      }
    };

    init();
  }, [caseId, authLoading, profile?.citizenId]);

  const handleNext = () => {
    if (!ritualData) return;
    if (currentPage < ritualData.pages.length - 1) {
      setIsChanging(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsChanging(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    } else {
      // Case Closed Logic
      const newTotalCases = (profile?.total_cases || 0) + 1;
      const newCompletedList = [...(profile?.completedStories || []), ritualData.id];
      
      updateLocalProfile({ 
        activeCaseId: undefined,
        total_cases: newTotalCases,
        completedStories: newCompletedList
      });
      
      retry();
      navigate('/');
    }
  };

  const handleBack = () => {
    if (currentPage > 0) {
      setIsChanging(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsChanging(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  };

  const handleAbort = () => {
    abortRitual();
    updateLocalProfile({ activeCaseId: undefined });
    retry();
    navigate('/');
  };

  if (isLoadingCase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center animate-in fade-in duration-500">
        <div className="w-8 h-8 border-t border-[#76F3FF] rounded-full animate-spin mb-8" />
        <p className="text-[10px] uppercase tracking-[0.5em] text-[#76F3FF] font-bold animate-pulse mb-4">Stabilizing Signal Frequency</p>
        <p className="text-[9px] uppercase tracking-[0.3em] opacity-40 mb-12 font-mono">{loadingStatus}</p>
        <button 
          onClick={handleAbort}
          className="text-[9px] uppercase tracking-[0.4em] opacity-30 hover:opacity-100 transition-all underline underline-offset-8"
        >
          Abort Uplink
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-8 text-center mt-20 space-y-8 animate-in fade-in duration-300">
        <h3 className="text-xl font-bold uppercase tracking-widest text-[#76F3FF]">Frequency Jammed</h3>
        <p className="text-white/40 text-xs leading-relaxed max-w-xs mx-auto">{error.message}</p>
        <button onClick={() => navigate('/')} className="w-full py-5 bg-white text-black text-[10px] uppercase tracking-[0.4em] font-black hover:bg-[#76F3FF] transition-all shadow-xl">
          Return to Terminal
        </button>
      </div>
    );
  }

  if (!ritualData) return null;

  const currentImage = ritualData.images[currentPage];
  const isImageFailed = !currentImage || failedImages[currentPage];

  return (
    <div className="px-6 pb-40 max-w-2xl mx-auto animate-in fade-in duration-700">
      <div className="mb-8 flex justify-between items-center border-b border-white/5 pb-6">
        <button 
          onClick={handleAbort}
          className="text-[9px] uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-all"
        >
          ← EXIT
        </button>
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-[0.4em] text-[#76F3FF] mb-1 font-bold">{ritualData.archetype}</p>
          <h2 className="text-xl font-bold uppercase tracking-tighter leading-none truncate max-w-[180px]">{ritualData.title}</h2>
        </div>
        <span className="mono text-[10px] opacity-20 uppercase">PANEL {currentPage + 1}/5</span>
      </div>

      <div className="aspect-square bg-zinc-950 border-0 rounded-sm overflow-hidden mb-12 relative shadow-[0_0_40px_rgba(0,0,0,1)]">
        {isImageFailed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
             <p className="text-[8px] uppercase tracking-[0.3em] text-red-500/40 font-bold">Corrupted Signal Panel</p>
          </div>
        ) : (
          <img 
            src={currentImage} 
            alt="Noir Panel" 
            className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-1000"
            onError={() => setFailedImages(prev => ({ ...prev, [currentPage]: true }))}
          />
        )}
      </div>

      <div className={`space-y-10 transition-all duration-500 ${isChanging ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
        <p className="text-lg leading-[1.8] text-white/90 font-light tracking-tight selection:bg-[#76F3FF] selection:text-black">
          {ritualData.pages[currentPage].text}
        </p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleNext} 
            disabled={isChanging}
            className="w-full py-6 bg-white text-black text-[10px] uppercase tracking-[0.4em] font-black active:bg-[#76F3FF] hover:bg-[#76F3FF] transition-all shadow-xl"
          >
            {currentPage === 4 ? 'File Completed Case' : 'Continue Investigation'}
          </button>
          
          {currentPage > 0 && (
            <button 
              onClick={handleBack}
              disabled={isChanging}
              className="w-full py-4 border border-white/10 text-white/40 text-[9px] uppercase tracking-[0.4em] font-bold hover:text-white transition-all"
            >
              Previous Panel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reader;