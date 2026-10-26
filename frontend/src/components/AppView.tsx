import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Copy,
  Check,
  Volume2,
  Trash2,
  Sparkles,
  ChevronRight,
  Info,
  Search,
  BookOpen,
  Home,
  ArrowLeft,
  X,
  Activity,
  Delete,
  CornerDownLeft
} from 'lucide-react';
import { eelBridge } from '../services/eelService';
import { dictionaryService } from '../services/dictionaryService';
import { ml2en } from '../utils/ml2en';
import { ALPHABET_SIGNS, INDEX_TO_CHAR_MAP, SignCharacter } from '../data/alphabet';

interface AppViewProps {
  onGoBack: () => void;
}

interface DetectedSign {
  id: number;
  char: string;
  phonetic: string;
}

export const AppView: React.FC<AppViewProps> = ({ onGoBack }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'learn'>('home');
  const [status, setStatus] = useState<'idle' | 'starting' | 'running' | 'stopping'>('idle');
  const [cameraFrame, setCameraFrame] = useState<string | null>(null);

  // Live real-time detected gesture from current frame
  const [liveSign, setLiveSign] = useState<DetectedSign | null>(null);
  const [streakCount, setStreakCount] = useState<number>(0);

  // Word & sentence composition
  const [currentWord, setCurrentWord] = useState<string>('');
  const [sentence, setSentence] = useState<string>('');
  const [predictions, setPredictions] = useState<string[]>([]);

  // UI helpers
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [selectedSign, setSelectedSign] = useState<SignCharacter | null>(null);
  const [learnCategory, setLearnCategory] = useState<'all' | 'independent_vowel' | 'dependent_vowel' | 'consonant'>('all');

  // Tracking refs for steady frame detection & Malayalam character connections
  const streakCharRef = useRef<string>('');
  const streakRef = useRef<number>(0);
  const committedCharRef = useRef<string>('');
  const inactivityTimerRef = useRef<any>(null);

  const currentWordRef = useRef<string>('');
  const sentenceWordsRef = useRef<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Listen to status updates from Eel
    const unsubStatus = eelBridge.onStatus((newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'idle') {
        setCameraFrame(null);
        setLiveSign(null);
        setStreakCount(0);
      }
    });

    // Listen to incoming base64 video frames from Python
    const unsubImage = eelBridge.onImage((imgData) => {
      setCameraFrame(imgData);
    });

    // Listen to incoming predicted gesture labels from Python
    const unsubLabel = eelBridge.onLabel((labelStr) => {
      handleDetectedLabel(labelStr);
    });

    // Initialize the SQLite dictionary
    dictionaryService.init();

    return () => {
      unsubStatus();
      unsubImage();
      unsubLabel();
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const handleDetectedLabel = (labelStr: string) => {
    // Inactivity timeout: If no sign is received for 450ms (hand lowered), reset streak & allow re-typing
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setLiveSign(null);
      setStreakCount(0);
      streakCharRef.current = '';
      committedCharRef.current = '';
    }, 450);

    if (!labelStr || labelStr === 'null' || labelStr === 'None') {
      setLiveSign(null);
      setStreakCount(0);
      streakCharRef.current = '';
      committedCharRef.current = '';
      return;
    }

    const labelIdx = parseInt(labelStr, 10);
    if (isNaN(labelIdx)) return;

    const signObj = ALPHABET_SIGNS.find(s => s.id === labelIdx);
    const char = signObj ? signObj.char : INDEX_TO_CHAR_MAP.get(labelIdx);
    if (!char) return;

    // 1. Immediately update the LIVE LETTER for instant visual feedback on EVERY frame
    setLiveSign({
      id: labelIdx,
      char,
      phonetic: signObj?.phonetic || ''
    });

    // 2. Track consecutive steady frame count (streak)
    if (streakCharRef.current === char) {
      streakRef.current += 1;
    } else {
      streakCharRef.current = char;
      streakRef.current = 1;
    }

    const currentStreak = streakRef.current;
    setStreakCount(Math.min(currentStreak, 3));

    // 3. When held steadily for 3 consecutive frames, commit the letter into the connected word!
    if (currentStreak === 3) {
      if (committedCharRef.current !== char) {
        committedCharRef.current = char;

        // Apply Malayalam character connection / dependent vowel joining rules
        let s = char;
        const curWord = currentWordRef.current;
        if (curWord.length > 0) {
          if (s === '\u0D06') s = '\u0D3E';      // aa -> vowel sign aa
          else if (s === '\u0D05') s = '';        // a -> inherent sound
          else if (s === '\u0D07') s = '\u0D3F';  // i -> vowel sign i
          else if (s === '\u0D08') s = '\u0D40';  // ii -> vowel sign ii
          else if (s === '\u0D09') s = '\u0D41';  // u -> vowel sign u
          else if (s === '\u0D0A') s = '\u0D42';  // uu -> vowel sign uu
        }

        if (s) {
          const updatedWord = curWord + s;
          currentWordRef.current = updatedWord;
          setCurrentWord(updatedWord);

          const fullSentence = [...sentenceWordsRef.current, updatedWord].filter(Boolean).join(' ');
          setSentence(fullSentence);

          // Query dictionary predictions for the composed word
          const preds = dictionaryService.getPredictions(updatedWord);
          setPredictions(preds);

          if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
        }
      }
    }
  };

  const handleToggleCapture = () => {
    if (status === 'running') {
      eelBridge.stop();
    } else if (status === 'idle') {
      eelBridge.start();
    }
  };

  // Space action: finalize current word into sentence
  const handleSpace = () => {
    if (currentWordRef.current.trim()) {
      sentenceWordsRef.current.push(currentWordRef.current);
      currentWordRef.current = '';
      setCurrentWord('');
      setSentence(sentenceWordsRef.current.join(' ') + ' ');
      setPredictions([]);
    }
  };

  // Backspace action: delete last letter in current word (or last word in sentence)
  const handleBackspace = () => {
    if (currentWordRef.current.length > 0) {
      const updated = currentWordRef.current.slice(0, -1);
      currentWordRef.current = updated;
      setCurrentWord(updated);
      const fullSentence = [...sentenceWordsRef.current, updated].filter(Boolean).join(' ');
      setSentence(fullSentence);
      setPredictions(updated ? dictionaryService.getPredictions(updated) : []);
    } else if (sentenceWordsRef.current.length > 0) {
      const lastWord = sentenceWordsRef.current.pop() || '';
      currentWordRef.current = lastWord;
      setCurrentWord(lastWord);
      const fullSentence = [...sentenceWordsRef.current, lastWord].filter(Boolean).join(' ');
      setSentence(fullSentence);
      setPredictions(lastWord ? dictionaryService.getPredictions(lastWord) : []);
    }
  };

  const handleSelectPrediction = (word: string) => {
    sentenceWordsRef.current.push(word);
    currentWordRef.current = '';
    setCurrentWord('');
    setSentence(sentenceWordsRef.current.join(' ') + ' ');
    setPredictions([]);
  };

  const handleClear = () => {
    sentenceWordsRef.current = [];
    currentWordRef.current = '';
    streakCharRef.current = '';
    streakRef.current = 0;
    committedCharRef.current = '';
    setSentence('');
    setCurrentWord('');
    setPredictions([]);
    setLiveSign(null);
    setStreakCount(0);
  };

  const handleCopy = () => {
    if (!sentence) return;
    navigator.clipboard.writeText(sentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!sentence || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = 'ml-IN';
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const pronunciation = ml2en(sentence);

  // Group signs for the Learn tab
  const independentVowels = ALPHABET_SIGNS.filter(s => s.category === 'independent_vowel');
  const dependentVowels = ALPHABET_SIGNS.filter(s => s.category === 'dependent_vowel');
  const consonants = ALPHABET_SIGNS.filter(s => s.category === 'consonant');

  const filterSign = (s: SignCharacter) => {
    const matchesCategory = learnCategory === 'all' || s.category === learnCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return s.char.includes(q) || s.phonetic.toLowerCase().includes(q);
  };

  return (
    <div className="flex w-full min-h-screen bg-[#191823] text-[#808191] font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar */}
      <aside className="w-20 md:w-60 bg-[#1f1d2b] border-r border-white/5 flex flex-col justify-between p-4 shrink-0 select-none">
        <div>
          {/* Logo */}
          <div className="flex items-center space-x-3 py-3 px-2">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/30">
              S
            </span>
            <div className="hidden md:flex flex-col">
              <span className="font-extrabold text-lg text-white tracking-widest leading-none">
                MSLAT
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-tight mt-1">
                Malayalam Sign AI
              </span>
            </div>
          </div>

          {/* Menu Title */}
          <div className="hidden md:block text-[11px] uppercase tracking-wider font-bold text-gray-500 mt-8 mb-3 px-3">
            Navigation
          </div>

          {/* Menu Links */}
          <nav className="w-full flex flex-col space-y-1.5">
            <button
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-[#252936] text-white shadow-md border border-white/5'
                  : 'text-[#808191] hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('learn')}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'learn'
                  ? 'bg-[#252936] text-white shadow-md border border-white/5'
                  : 'text-[#808191] hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">Learn Signs</span>
              <span className="hidden md:inline-block ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold">
                63
              </span>
            </button>

            <button
              onClick={onGoBack}
              className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-[#808191] hover:text-white hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline">Go Back</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="hidden md:block p-3 rounded-2xl bg-[#252936]/50 border border-white/5 text-[11px]">
          <div className="flex items-center space-x-2 text-white font-medium mb-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Model Status</span>
          </div>
          <div className="text-gray-400">
            {status === 'running' ? (
              <span className="text-emerald-400 font-semibold">Live stream active</span>
            ) : (
              <span>Engine loaded & ready</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 px-6 lg:px-10 border-b border-white/5 flex items-center justify-between bg-[#1f1d2b]/90 backdrop-blur-md sticky top-0 z-40">
          <div className="w-full max-w-md relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search signs e.g. 'ka', 'aa', 'tha'..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() && activeTab !== 'learn') {
                  setActiveTab('learn');
                }
              }}
              className="w-full bg-[#252936] text-white placeholder-[#808191] text-sm pl-10 pr-4 py-2 rounded-xl border border-white/5 focus:border-blue-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center space-x-4">
            <div className="text-xs text-[#808191] font-medium flex items-center space-x-2 bg-[#252936] px-3 py-1.5 rounded-full border border-white/5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  status === 'running'
                    ? 'bg-emerald-400 animate-pulse shadow-md shadow-emerald-400/50'
                    : 'bg-gray-500'
                }`}
              />
              <span className="text-gray-300 font-semibold">
                {status === 'running' ? 'Camera Live' : 'Camera Standby'}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
          {activeTab === 'home' && (
            <div className="max-w-6xl w-full mx-auto my-auto space-y-6">
              {/* Centered Main Stream Area: Video feed + Messages */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left: Video Stream Box (7 columns) */}
                <div className="lg:col-span-7 flex flex-col bg-[#252936] rounded-3xl border border-white/5 p-4 sm:p-5 shadow-2xl justify-between">
                  {/* Video Top Bar */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Live Video Input</span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium">
                      MediaPipe Hands &bull; 63 Signs
                    </div>
                  </div>

                  {/* Video Viewport Container */}
                  <div className="relative w-full aspect-[4/3] bg-[#191823] rounded-2xl overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
                    <img
                      id="wimg"
                      src={cameraFrame || 'https://media4.giphy.com/media/xTkcEQACH24SMPxIQg/giphy.gif'}
                      alt="Camera Feed"
                      className="w-full h-full object-cover"
                    />

                    {/* Prominent Live Letter Badge Overlay on Video (Only when camera is actively running) */}
                    {liveSign && status === 'running' && (
                      <div className="absolute top-4 left-4 bg-black/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-blue-500/30 flex items-center space-x-3.5 shadow-2xl animate-fade-in ring-1 ring-blue-500/20">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">
                            Live Letter
                          </span>
                          <span className="text-4xl font-black text-white leading-none mt-0.5">
                            {liveSign.char}
                          </span>
                        </div>
                        <div className="border-l border-white/10 pl-3 flex flex-col">
                          <span className="text-xs text-blue-300 font-bold">
                            {liveSign.phonetic}
                          </span>
                          {/* Streak lock indicator dots */}
                          <div className="flex items-center space-x-1 mt-1.5">
                            {[1, 2, 3].map((step) => (
                              <span
                                key={step}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  streakCount >= step
                                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                                    : 'bg-white/20'
                                }`}
                              />
                            ))}
                            <span className="text-[9px] text-gray-400 font-medium ml-1">
                              {streakCount >= 3 ? 'Locked!' : 'Hold...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls Bar */}
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="text-xs text-gray-400 font-medium">
                      {status === 'running' ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                          <span>AI Recognition Active</span>
                        </span>
                      ) : (
                        <span>Ready to capture</span>
                      )}
                    </div>

                    <button
                      id="startstop"
                      onClick={handleToggleCapture}
                      disabled={status === 'starting' || status === 'stopping'}
                      className={`px-8 py-2.5 rounded-full font-bold text-sm text-white transition-all shadow-lg flex items-center space-x-2 ${
                        status === 'running'
                          ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      } disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      {status === 'running' ? (
                        <>
                          <Square className="w-4 h-4 fill-current" />
                          <span>Stop Camera</span>
                        </>
                      ) : status === 'starting' ? (
                        <span>Starting...</span>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start Camera</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right: Messages Panel with Live Letter & Connected Word (5 columns) */}
                <div className="lg:col-span-5 bg-[#252936] rounded-3xl border border-white/5 p-4 sm:p-5 flex flex-col justify-between shadow-2xl">
                  <div className="space-y-4">
                    {/* Header with Quick Actions */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="text-sm font-bold text-white flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Translation & Messages</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={handleSpeak}
                          disabled={!sentence || speaking}
                          title="Read aloud (Text-to-Speech)"
                          className="p-2 rounded-xl hover:bg-white/5 text-[#808191] hover:text-blue-400 transition-colors disabled:opacity-30"
                        >
                          <Volume2 className={`w-4 h-4 ${speaking ? 'animate-pulse text-blue-400' : ''}`} />
                        </button>
                        <button
                          onClick={handleCopy}
                          disabled={!sentence}
                          title="Copy Malayalam text"
                          className="p-2 rounded-xl hover:bg-white/5 text-[#808191] hover:text-white transition-colors disabled:opacity-30"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={handleClear}
                          disabled={!sentence && !currentWord}
                          title="Clear text"
                          className="p-2 rounded-xl hover:bg-white/5 text-[#808191] hover:text-rose-400 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* LIVE LETTER & CONNECTED WORD DISPLAY */}
                    <div className="p-3.5 bg-[#191823] rounded-2xl border border-white/5 space-y-3">
                      {/* Top Row: Live Letter indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                            <span className="text-2xl font-black text-blue-400">
                              {liveSign ? liveSign.char : '—'}
                            </span>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                              Live Letter
                            </div>
                            <div className="text-xs font-semibold text-white">
                              {liveSign ? `${liveSign.phonetic} (Sign #${liveSign.id})` : 'Show hand to camera'}
                            </div>
                          </div>
                        </div>

                        {/* Streak dots */}
                        {liveSign && (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-400 font-medium mb-1">
                              {streakCount >= 3 ? 'Committed!' : 'Hold steady'}
                            </span>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3].map((step) => (
                                <span
                                  key={step}
                                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                                    streakCount >= step
                                      ? 'bg-emerald-400 shadow-md shadow-emerald-400/50'
                                      : 'bg-white/10'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Row: Connected Word Composing Display */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">
                            Current Word (Connected Letters)
                          </div>
                          <div className="text-xl font-black text-white tracking-wide min-h-[28px] flex items-center">
                            {currentWord ? (
                              <span className="text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                                {currentWord}
                              </span>
                            ) : (
                              <span className="text-gray-500 text-xs font-normal">
                                Letters connect here automatically...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Composing Actions: Space & Backspace */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={handleBackspace}
                            disabled={!currentWord && sentenceWordsRef.current.length === 0}
                            title="Backspace (Delete last character)"
                            className="px-2.5 py-1.5 rounded-lg bg-[#353340] hover:bg-[#474556] text-white text-xs font-semibold flex items-center space-x-1 transition-colors disabled:opacity-30"
                          >
                            <Delete className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Delete</span>
                          </button>
                          <button
                            onClick={handleSpace}
                            disabled={!currentWord}
                            title="Space (Complete word into sentence)"
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1 transition-colors disabled:opacity-30 shadow-md shadow-blue-600/20"
                          >
                            <CornerDownLeft className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Space</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chat Item & Textarea */}
                    <div className="flex items-start space-x-3">
                      <img
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10 shadow-md"
                        src="https://images.unsplash.com/photo-1560941001-d4b52ad00ecc?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1650&q=80"
                        alt="Signer Avatar"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-white/90 mb-1.5 flex items-center justify-between">
                          <span>Complete Sentence</span>
                        </div>
                        <textarea
                          id="w3"
                          ref={textareaRef}
                          value={sentence}
                          readOnly
                          placeholder="Translated text will appear here as you sign..."
                          rows={3}
                          className="w-full bg-[#191823] text-white p-3 rounded-2xl border border-white/5 text-base font-medium leading-relaxed resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* English Phonetic Pronunciation Box */}
                    {pronunciation && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs transition-all">
                        <div className="text-blue-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center justify-between">
                          <span>English Pronunciation:</span>
                          <span className="text-[10px] lowercase text-blue-300 font-normal">phonetic</span>
                        </div>
                        <div className="text-blue-200 font-semibold text-sm tracking-wide">
                          {pronunciation}
                        </div>
                      </div>
                    )}

                    {/* Autocomplete Predictions from Dictionary */}
                    {predictions.length > 0 && (
                      <div>
                        <div className="text-xs text-[#808191] font-semibold mb-2 flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          <span>Suggested Words (tap to insert):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {predictions.map((p, i) => (
                            <button
                              key={i}
                              onClick={() => handleSelectPrediction(p)}
                              className="px-3 py-1 bg-[#353340] hover:bg-blue-600 text-white rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-white/5 flex gap-2">
                    <button
                      id="clearall"
                      onClick={handleClear}
                      disabled={!sentence && !currentWord}
                      className="w-full py-2.5 bg-[#353340] hover:bg-[#474556] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                    >
                      Clear All Text
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Tips Bar */}
              <div className="bg-[#252936] rounded-2xl border border-white/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    <strong className="text-white font-semibold">How it works:</strong> Live Letter detects immediately &bull; Hold gesture steady for 3 frames to connect the letter into your word &bull; Tap Space to finalize words.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('learn')}
                  className="shrink-0 text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 transition-colors"
                >
                  <span>Browse Signs Dictionary (63)</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'learn' && (
            <div className="max-w-6xl w-full mx-auto space-y-6">
              {/* Top Banner with Category Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-wide">Signs Dictionary</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Comprehensive visual guide to all 63 Malayalam Sign Language alphabets & vowels
                  </p>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setLearnCategory('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      learnCategory === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#252936] text-[#808191] hover:text-white'
                    }`}
                  >
                    All ({ALPHABET_SIGNS.length})
                  </button>
                  <button
                    onClick={() => setLearnCategory('independent_vowel')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      learnCategory === 'independent_vowel'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#252936] text-[#808191] hover:text-white'
                    }`}
                  >
                    Independent Vowels ({independentVowels.length})
                  </button>
                  <button
                    onClick={() => setLearnCategory('dependent_vowel')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      learnCategory === 'dependent_vowel'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#252936] text-[#808191] hover:text-white'
                    }`}
                  >
                    Dependent Vowels ({dependentVowels.length})
                  </button>
                  <button
                    onClick={() => setLearnCategory('consonant')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      learnCategory === 'consonant'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-[#252936] text-[#808191] hover:text-white'
                    }`}
                  >
                    Consonants ({consonants.length})
                  </button>
                </div>
              </div>

              {/* Signs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {ALPHABET_SIGNS.filter(filterSign).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSign(s)}
                    className="bg-[#252936] rounded-2xl p-3.5 flex flex-col items-center border border-white/5 shadow-md hover:border-blue-500/40 hover:scale-[1.02] cursor-pointer transition-all group"
                  >
                    <div className="text-3xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {s.char}
                    </div>
                    <div className="w-full aspect-square bg-[#191823] rounded-xl overflow-hidden p-2 flex items-center justify-center border border-white/5">
                      <img src={s.image} alt={s.char} className="w-full h-full object-contain" />
                    </div>
                    <div className="text-xs text-gray-300 font-semibold mt-2.5 text-center">
                      {s.phonetic}
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium capitalize mt-0.5">
                      {s.category.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sign Detail Modal */}
      {selectedSign && (
        <div
          onClick={() => setSelectedSign(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#252936] border border-white/10 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedSign(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="text-5xl font-black text-white mb-2">{selectedSign.char}</div>
              <div className="text-sm text-blue-400 font-bold">{selectedSign.phonetic}</div>
              <div className="text-xs text-gray-400 capitalize mt-0.5">
                {selectedSign.category.replace('_', ' ')} &bull; Sign #{selectedSign.id}
              </div>
            </div>

            <div className="w-full aspect-square bg-[#191823] rounded-2xl overflow-hidden p-4 flex items-center justify-center border border-white/5">
              <img
                src={selectedSign.image}
                alt={selectedSign.char}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedSign.char);
                  alert(`Copied "${selectedSign.char}" to clipboard!`);
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wider transition-all"
              >
                Copy Character
              </button>
              <button
                onClick={() => setSelectedSign(null)}
                className="px-6 py-2.5 rounded-xl bg-[#353340] hover:bg-[#474556] text-white font-semibold text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
