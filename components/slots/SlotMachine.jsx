"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { GoTriangleRight } from "react-icons/go";
import { SlVolume2, SlVolumeOff } from "react-icons/sl";
import { FaInfoCircle } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";

import lemon from "@/public/empl.webp";
import orange from "@/public/emfl.webp";
import diamond from "@/public/emcu.webp";
import bell from "@/public/emcr.webp";
import cherries from "@/public/emph.webp";
import spinIcon from "@/public/spin.webp";

import slotBg from "../public/embg.webp";
import frameOverlay from "../public/embor.webp";

const soundPaths = {
  background: "/sounds/background.mp3",
  spin: '/sounds/spin.mp3',
  win: '/sounds/win.mp3',
  buttonClick: '/sounds/button.mp3',
  symbols: {
    lemon: '/sounds/lemon.mp3',
    cherries: '/sounds/cherries.mp3',
    orange: '/sounds/orange.mp3',
    bell: '/sounds/bell.mp3',
    diamond: '/sounds/diamond.mp3',
  }
};

const symbols = [
  { symbol: lemon, rarity: 0.4, basePayout: 5, sound: 'lemon' },
  { symbol: cherries, rarity: 0.375, basePayout: 7.5, sound: 'cherries' },
  { symbol: orange, rarity: 0.185, basePayout: 10, sound: 'orange' },
  { symbol: bell, rarity: 0.03, basePayout: 20, sound: 'bell' },
  { symbol: diamond, rarity: 0.01, basePayout: 100, sound: 'diamond' },
];

const animationDuration = 1500;

const getRandomSymbol = () => {
  const rand = Math.random();
  let sum = 0;
  for (const { symbol, rarity } of symbols) {
    sum += rarity;
    if (rand < sum) return symbol;
  }
  return symbols[symbols.length - 1].symbol;
};

const SlotMachine = () => {
  const [balance, setBalance] = useState(100000);
  const [bet, setBet] = useState(100);
  const [reels, setReels] = useState(() => 
    Array.from({ length: 5 }, () => Array(3).fill(null).map(() => getRandomSymbol()))
  );
  const [spinning, setSpinning] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [winningLines, setWinningLines] = useState([]);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [autoSpin, setAutoSpin] = useState(false);
  const [remainingAutoSpins, setRemainingAutoSpins] = useState(0);
  const [tempAutoSpinCount, setTempAutoSpinCount] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showPayouts, setShowPayouts] = useState(false);
  
  const reelRefs = useRef([]);
  const audioRefs = useRef({});
  const backgroundAudioRef = useRef(null);
  const volumeTimeoutRef = useRef(null);
  const hasInteracted = useRef(false);

  const adjustedAnimationDuration = animationDuration / speedMultiplier;
  const adjustedSpinDuration = adjustedAnimationDuration * 1.1;

  // Payout information sorted by highest multiplier first, without names
  const payouts = [
    {
      symbol: diamond,
      combinations: [
        { count: 5, multiplier: 50 },
        { count: 4, multiplier: 30 },
        { count: 3, multiplier: 20 }
      ]
    },
    {
      symbol: bell,
      combinations: [
        { count: 5, multiplier: 10 },
        { count: 4, multiplier: 6 },
        { count: 3, multiplier: 4 }
      ]
    },
    {
      symbol: orange,
      combinations: [
        { count: 5, multiplier: 5 },
        { count: 4, multiplier: 3 },
        { count: 3, multiplier: 2 }
      ]
    },
    {
      symbol: cherries,
      combinations: [
        { count: 5, multiplier: 3 },
        { count: 4, multiplier: 2 },
        { count: 3, multiplier: 1.5 }
      ]
    },
    {
      symbol: lemon,
      combinations: [
        { count: 5, multiplier: 2 },
        { count: 4, multiplier: 1.5 },
        { count: 3, multiplier: 1 }
      ]
    }
  ].sort((a, b) => b.combinations[0].multiplier - a.combinations[0].multiplier);

  useEffect(() => {
    const bgAudio = new Audio(soundPaths.background);
    bgAudio.loop = true;
    bgAudio.volume = isMuted ? 0 : volume;
    backgroundAudioRef.current = bgAudio;

    Object.entries(soundPaths).forEach(([key, path]) => {
      if (key === 'background') return;
      
      if (typeof path === 'object') {
        Object.entries(path).forEach(([symbolKey, symbolPath]) => {
          const audio = new Audio(symbolPath);
          audio.preload = 'auto';
          audio.playbackRate = 1;
          audioRefs.current[`symbol_${symbolKey}`] = audio;
        });
      } else {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.playbackRate = 1;
        audioRefs.current[key] = audio;
      }
    });

    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = isMuted ? 0 : volume;
    }
    
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.volume = isMuted ? 0 : volume;
      }
    });
  }, [volume, isMuted]);

  const handleFirstInteraction = () => {
    if (!hasInteracted.current && backgroundAudioRef.current) {
      backgroundAudioRef.current.play()
        .then(() => {
          hasInteracted.current = true;
        })
        .catch(e => console.log("Autoplay blocked:", e));
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    
    setShowVolumeSlider(true);
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 2000);
  };

  const handleVolumeIconHover = () => {
    setShowVolumeSlider(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
  };

  const handleVolumeIconLeave = () => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 2000);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    setShowVolumeSlider(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
  };

  const playSound = (soundKey, playbackRate = 1) => {
    if (!hasInteracted.current) return;
    
    const audio = audioRefs.current[soundKey];
    if (audio) {
      audio.currentTime = 0;
      audio.playbackRate = playbackRate;
      audio.play().catch(e => console.error("Audio play failed:", e));
    }
  };

  const spinReels = () => {
    if (balance < bet || spinning || bet < 100 || bet > 10000) return;
    
    handleFirstInteraction();
    playSound('buttonClick');
    playSound('spin', speedMultiplier); 
    
    setSpinning(true);
    setBalance(prev => prev - bet);
    setWinAmount(0);
    setWinningLines([]);
  
    let finalReels = Array(5).fill(null).map(() => Array(3).fill(null));
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        let newSymbol;
    
        if (
          col >= 2 &&
          finalReels[col - 1][row] === finalReels[col - 2][row] &&
          Math.random() > 0.5
        ) {
          const bannedSymbol = finalReels[col - 1][row];
          const filteredSymbols = symbols.filter(s => s.symbol !== bannedSymbol);
          newSymbol = filteredSymbols[Math.floor(Math.random() * filteredSymbols.length)].symbol;
        } else {
          newSymbol = getRandomSymbol();
        }
    
        finalReels[col][row] = newSymbol;
      }
    }      
    setReels(finalReels);
  
    const isMobile = window.innerWidth < 1280;
    const isXS = window.innerWidth < 640;
    const symbolHeight = isXS ? 63 : isMobile ? 75 : 150;
    const totalSpinDistance = isXS ? (symbolHeight * 15) + 15 : isMobile ? (symbolHeight * 15) + 15 : (symbolHeight * 15) + 17;
    
    reelRefs.current.forEach((reel, i) => {
      const reelElement = reel;
      if (!reelElement) return;
      
      reelElement.style.transition = 'none';
      reelElement.style.transform = 'translateY(0)';
      
      void reelElement.offsetHeight;
      
      reelElement.style.transition = `transform ${adjustedAnimationDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
      reelElement.style.transform = `translateY(${-totalSpinDistance}px)`;
    });
  
    setTimeout(() => {
      const { payout, winningLines } = checkWin(finalReels, bet);
      setBalance(prev => prev + payout);
      setWinAmount(payout);
      setWinningLines(winningLines);
      setSpinning(false);
  
      if (autoSpin && remainingAutoSpins > 0) {
        setRemainingAutoSpins(prev => prev - 1);
        if (remainingAutoSpins <= 1) {
          setAutoSpin(false);
        }
      }
    }, adjustedAnimationDuration);
  };

  const checkWin = (reels, bet) => {
    let payout = 0;
    let winningLines = [];
    const playedSymbols = new Set();

    for (const { symbol, basePayout, sound } of symbols) {
      const value = (basePayout / 5) * bet;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col <= 2; col++) {
          if (
            reels[col][row] === symbol &&
            reels[col + 1][row] === symbol &&
            reels[col + 2][row] === symbol
          ) {
            if (!playedSymbols.has(sound)) {
              playSound(`symbol_${sound}`);
              playedSymbols.add(sound);
            }
            
            let positions = [
              { col, row },
              { col: col + 1, row },
              { col: col + 2, row },
            ];
            payout += value;

            if (col + 3 < 5 && reels[col + 3][row] === symbol) {
              payout += value * 0.5;
              positions.push({ col: col + 3, row });
            }
            if (
              col + 4 < 5 &&
              reels[col + 3][row] === symbol &&
              reels[col + 4][row] === symbol
            ) {
              payout += value;
              positions.push({ col: col + 4, row });
            }
            winningLines.push(positions);
          }
        }
      }
    }

    return { payout, winningLines };
  };

  useEffect(() => {
    if (autoSpin && remainingAutoSpins > 0 && !spinning) {
      const interval = setInterval(() => {
        if (!spinning && remainingAutoSpins > 0) {
          spinReels();
        }
      }, adjustedSpinDuration);
      return () => clearInterval(interval);
    }
  }, [autoSpin, spinning, remainingAutoSpins]);

  const presetBets = [100, 500, 1000, 5000];
  const handleSpeedButtonClick = () => {
    const newMultiplier = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 3 : 1;
    setSpeedMultiplier(newMultiplier);
    playSound('buttonClick');
    playSound('spin', newMultiplier); 
  };

  const isWinningPosition = (colIndex, rowIndex) => {
    return winningLines.some(line =>
      line.some(pos => pos.col === colIndex && pos.row === rowIndex)
    );
  };

  return (
    <div 
      className="bg-black overflow-hidden min-h-screen"
      onClick={handleFirstInteraction}
    >
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src={slotBg} 
          alt="Slot Background" 
          layout="fill"
          objectFit="cover"
          quality={100}
        />
      </div>

      {/* Left controls - Info and Volume */}
      <div className="fixed top-4 left-2 xl:pl-12 xl:pt-3 pt-2 pl-8 flex items-start gap-4 z-50">
        {/* Info button (hidden when payouts are shown) */}
        {!showPayouts && (
          <button 
            onClick={() => {
              playSound('buttonClick');
              setShowPayouts(true);
            }}
            className="text-white hover:text-yellow-400 transition-colors"
          >
            <FaInfoCircle size={36} />
          </button>
        )}

        {/* Volume mixer (hidden when payouts are shown) */}
        {!showPayouts && (
          <div 
            className="flex flex-col items-center gap-2"
            onMouseEnter={handleVolumeIconHover}
            onMouseLeave={handleVolumeIconLeave}
          >
            <button 
              onClick={toggleMute}
              className="text-white hover:text-yellow-400 transition-colors"
            >
              {isMuted ? <SlVolumeOff size={36} /> : <SlVolume2 size={36} />}
            </button>
            {!isMuted && showVolumeSlider && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="h-24 max-w-[36px] accent-yellow-400 [&::-webkit-slider-thumb]:appearance-none"
                style={{
                  writingMode: 'bt-lr',
                  WebkitAppearance: 'slider-vertical',
                  MozAppearance: 'slider-vertical',
                  appearance: 'slider-vertical',
                  transform: 'rotate(0deg)',
                  transition: 'opacity 0.3s ease'
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Payouts panel (left side) */}
      <div 
        className={`fixed top-0 left-0 h-full w-full sm:w-96 bg-black bg-opacity-90 backdrop-blur-sm z-40 transition-transform duration-300 ease-in-out ${
          showPayouts ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-yellow-400">Payouts</h2>
            <button
              onClick={() => {
                playSound('buttonClick');
                setShowPayouts(false);
              }}
              className="text-white hover:text-yellow-400 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-6">
            {payouts.map((item, index) => (
              <div key={index} className="bg-gray-800 bg-opacity-50 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-12 h-12 mr-3 flex-shrink-0">
                    <Image 
                      src={item.symbol} 
                      alt="symbol"
                      width={48} 
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  {item.combinations.map((combo, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center">
                        {Array.from({ length: combo.count }).map((_, j) => (
                          <div key={j} className="w-8 h-8 mx-0.5">
                            <Image 
                              src={item.symbol} 
                              alt="symbol"
                              width={32} 
                              height={32}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-yellow-400 font-bold text-lg">
                        {combo.multiplier}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-gray-800 bg-opacity-50 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-white mb-3">How to Play</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Match 3+ symbols horizontally to win</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>More symbols = higher payout</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Payouts are multiplied by your bet</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-xl xl:text-2xl fixed top-2 left-2 xl:top-2 text-white z-20 w-full text-right xl:pr-12 xl:pt-3 pt-2 pr-8">
        Balance: <span className="text-yellow-400">${balance.toLocaleString()}</span>
        {winAmount > 0 && <span className="text-lime-500 ml-2">(+${winAmount.toLocaleString()})</span>}
      </p>
      
      <div className="flex flex-col items-center xl:justify-center gap-8 text-center min-h-screen relative overflow-x-hidden z-10">
        <div className="absolute xl:mt-[-70px] sm:mt-[120px] mt-[160px]">
          <div className="relative flex justify-center items-center w-[95vw] h-[205px] sm:h-[242px] xl:w-[800px] max-w-[340px] sm:max-w-[400px] xl:max-w-[800px] xl:h-[470px] overflow-hidden p-2 rounded-xl">
            {reels.map((col, colIndex) => (
              <div 
                key={colIndex} 
                className="flex flex-col items-center h-full w-full xl:w-[250px] overflow-hidden relative mx-1 z-10"
              >
                <div 
                  ref={el => reelRefs.current[colIndex] = el}
                  className="flex flex-col absolute xl:top-0 gap-[1px] w-full"
                >
                  {[...Array(15)].map((_, i) => {
                    const rowIndex = i % 3;
                    const symbol = col[rowIndex];
                    const isWinning = isWinningPosition(colIndex, rowIndex);
                    
                    return (
                      <div 
                        key={`pre-${colIndex}-${i}`} 
                        className={`flex justify-center items-center w-full sm:h-[75px] xl:h-[150px] h-[63px] transition-all duration-300 ${
                          isWinning ? "bg-yellow-400 bg-opacity-30 border-2 xl:border-4 border-yellow-400 rounded-lg" : ""
                        }`}
                      >
                        <Image 
                          src={symbol} 
                          alt="symbol" 
                          width={110} 
                          height={110}
                          className="w-auto h-[80%] object-contain"
                        />
                      </div>
                    );
                  })}
                  
                  {col.map((symbol, rowIndex) => {
                    const isWinning = isWinningPosition(colIndex, rowIndex);

                    return (
                      <div
                        className={`flex justify-center items-center w-full sm:h-[75px] xl:h-[150px] h-[63px] transition-all duration-300 ${
                          isWinning ? "bg-yellow-400 bg-opacity-30 border-2 xl:border-4 border-yellow-400 rounded-lg" : ""
                        }`}
                        key={`${colIndex}-${rowIndex}`}
                      >
                        <Image 
                          src={symbol} 
                          alt="symbol" 
                          width={110} 
                          height={110}
                          className="w-auto h-[80%] object-contain"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 w-full h-full z-1 xl:top-[60px] top-[30px] sm:top-[35px] -translate-y-1/2 sm:max-w-[400px] xl:max-w-[800px]">
            <Image 
              width={800}
              src={frameOverlay} 
              alt="Frame Overlay" 
              objectFit="cover"
            /> 
          </div>
        </div>

        <button
          onClick={spinReels}
          disabled={spinning || autoSpin} 
          className={`absolute bottom-0 mb-[100px] sm:mb-[180px] xl:mb-0 xl:inset-y-auto flex items-center justify-center xl:w-[220px] w-[150px] xl:h-56 border-2 border-white rounded-full transition-all duration-300 xl:right-[150px] xl:mt-[-110px] cursor-pointer z-20 ${
            spinning ? "animate-pulse" : ""
          }`}
          style={{
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.7)",
            transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
            transition: spinning ? `transform ${adjustedAnimationDuration}ms ease-out` : "transform 0.3s ease"
          }}
        >
          <Image src={spinIcon} alt="Spin" width={200} height={128} />
        </button>

        {/* Mobile controls toggle button */}
        <div className="sm:hidden fixed bottom-[90px] left-3  z-20">
          <button
            onClick={() => {
              playSound('buttonClick');
              setShowMobileControls(!showMobileControls);
            }}
            className={`bg-black bg-opacity-30 border-2 border-white rounded-full p-2 transition-all duration-300 rotate-180 ${
              showMobileControls ? 'rotate-0 mb-20' : ''
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col fixed w-full bottom-0 left-0 border-t-2 border-white sm:py-4 px-8 bg-black bg-opacity-30 backdrop-blur-sm z-20 pb-4 xl:pb-4">
          <div className="flex flex-col xl:flex-row justify-between relative items-center xl:gap-8 gap-3">
            {/* Mobile controls (hidden on desktop) */}
            <div
              className={`sm:hidden w-full flex flex-col gap-4 overflow-hidden transition-all duration-500 ${
                showMobileControls ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="flex justify-center gap-4 pt-4">
                <button
                  className="flex border-2 border-white rounded-full py-1 px-2 hover:bg-gray-700 transition duration-300 hover:scale-105"
                  onClick={handleSpeedButtonClick}
                >
                  <GoTriangleRight size={50} color={speedMultiplier >= 1 ? "white" : "gray"} />
                  <GoTriangleRight className="ml-[-25px] mr-[-25px]" size={50} color={speedMultiplier >= 2 ? "white" : "gray"} />
                  <GoTriangleRight size={50} color={speedMultiplier >= 3 ? "white" : "gray"} />
                </button>
                
                <div className="flex">
                  {autoSpin && remainingAutoSpins > 0 ? (
                    <button
                      onClick={() => {
                        playSound('buttonClick');
                        setAutoSpin(false);
                      }}
                      className="relative w-[110px] py-2.5 px-5 text-2xl bg-red-600 text-white border-none rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-red-700 hover:shadow-md"
                    >
                      Stop
                      <span className="absolute -top-2 -right-2 bg-green-400 text-black text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {remainingAutoSpins}
                      </span>
                    </button>
                  ) : (
                    <Dialog>
                      <DialogTrigger>
                        <div
                          className="relative flex border-2 border-white rounded-full py-2 px-6 hover:bg-gray-700 transition duration-300 hover:scale-105 text-4xl"
                          onClick={() => {
                            playSound('buttonClick');
                          }}
                        >
                          Auto
                        </div>
                      </DialogTrigger>
                      <DialogContent className="text-white max-w-[350px] flex flex-col items-center py-10">
                        <DialogTitle className="text-4xl text-white">
                          How many spins?
                        </DialogTitle>
                        <DialogFooter className="mt-2 flex justify-center gap-4">
                          <div className="grid grid-cols-2 gap-y-3 gap-x-5">
                            <Button
                              onClick={() => {
                                playSound('buttonClick');
                                setRemainingAutoSpins(5)
                                setAutoSpin(true);
                              }}
                              className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                            >
                              5
                            </Button>
                            <Button
                              onClick={() => {
                                playSound('buttonClick');
                                setRemainingAutoSpins(10)
                                setAutoSpin(true);
                              }}
                              className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                            >
                              10
                            </Button>
                            <Button
                              onClick={() => {
                                playSound('buttonClick');
                                setRemainingAutoSpins(20)
                                setAutoSpin(true);
                              }}
                              className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                            >
                              20
                            </Button>
                            <Button
                              onClick={() => {
                                playSound('buttonClick');
                                setRemainingAutoSpins(50)
                                setAutoSpin(true);
                              }}
                              className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                            >
                              50
                            </Button>
                            <Button
                              onClick={() => {
                                playSound('buttonClick');
                                setRemainingAutoSpins(100)
                                setAutoSpin(true);
                              }}
                              className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                            >
                              100
                            </Button>
                            <Button
                              onClick={() => {
                                playSound('buttonClick');
                                setRemainingAutoSpins(1000)
                                setAutoSpin(true);
                              }}
                              className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                            >
                              1000
                            </Button>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop preset bets (hidden on mobile) */}
            <div className="xl:flex gap-3 hidden">
              {presetBets.map((amount) => (
                <Button 
                  key={amount} 
                  onClick={() => {
                    playSound('buttonClick');
                    setBet(amount);
                  }} 
                  disabled={spinning || autoSpin} 
                  className="text-3xl py-2.5 px-6 hover:scale-105 transition-transform"
                >
                  {amount}
                </Button>
              ))}
            </div>

            {/* Bet input (always visible) */}
            <div className="w-full">
              <Input
                className="bg-white text-black text-3xl px-4 py-2 text-center hover:scale-105 transition-transform"
                type="number"
                value={bet}
                min={100}
                max={10000}
                onChange={(e) => setBet(Math.min(10000, Math.max(100, Number(e.target.value))))}
                disabled={spinning || autoSpin}
              />
            </div>

            {/* Desktop controls (hidden on mobile) */}
            <div className="sm:flex gap-4 hidden">
              <button
                className="flex border-2 border-white rounded-full py-1 px-2 hover:bg-gray-700 transition duration-300 hover:scale-105"
                onClick={handleSpeedButtonClick}
              >
                <GoTriangleRight size={50} color={speedMultiplier >= 1 ? "white" : "gray"} />
                <GoTriangleRight className="ml-[-25px] mr-[-25px]" size={50} color={speedMultiplier >= 2 ? "white" : "gray"} />
                <GoTriangleRight size={50} color={speedMultiplier >= 3 ? "white" : "gray"} />
              </button>
              <div className="flex">
                {autoSpin && remainingAutoSpins > 0 ? (
                  <button
                    onClick={() => {
                      playSound('buttonClick');
                      setAutoSpin(false);
                    }}
                    className="relative w-[110px] py-2.5 px-5 text-2xl bg-red-600 text-white border-none rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-red-700 hover:shadow-md"
                  >
                    Stop
                    <span className="absolute -top-2 -right-2 bg-green-400 text-black text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {remainingAutoSpins}
                    </span>
                  </button>
                ) : (
                  <Dialog>
                    <DialogTrigger>
                      <div
                        className="relative flex border-2 border-white rounded-full py-2 px-6 hover:bg-gray-700 transition duration-300 hover:scale-105 text-4xl"
                        onClick={() => {
                          playSound('buttonClick');
                        }}
                      >
                        Auto
                      </div>
                    </DialogTrigger>
                    <DialogContent className="text-white max-w-[350px] flex flex-col items-center py-10">
                      <DialogTitle className="text-4xl text-white">
                        How many spins?
                      </DialogTitle>
                      <DialogFooter className="mt-2 flex justify-center gap-4">
                        <div className="grid grid-cols-2 gap-y-3 gap-x-5">
                          <Button
                            onClick={() => {
                              playSound('buttonClick');
                              setRemainingAutoSpins(5)
                              setAutoSpin(true);
                            }}
                            className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                          >
                            5
                          </Button>
                          <Button
                            onClick={() => {
                              playSound('buttonClick');
                              setRemainingAutoSpins(10)
                              setAutoSpin(true);
                            }}
                            className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                          >
                            10
                          </Button>
                          <Button
                            onClick={() => {
                              playSound('buttonClick');
                              setRemainingAutoSpins(20)
                              setAutoSpin(true);
                            }}
                            className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                          >
                            20
                          </Button>
                          <Button
                            onClick={() => {
                              playSound('buttonClick');
                              setRemainingAutoSpins(50)
                              setAutoSpin(true);
                            }}
                            className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                          >
                            50
                          </Button>
                          <Button
                            onClick={() => {
                              playSound('buttonClick');
                              setRemainingAutoSpins(100)
                              setAutoSpin(true);
                            }}
                            className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                          >
                            100
                          </Button>
                          <Button
                            onClick={() => {
                              playSound('buttonClick');
                              setRemainingAutoSpins(1000)
                              setAutoSpin(true);
                            }}
                            className="flex border-2 border-white rounded-full py-1 px-4 hover:bg-gray-200 transition duration-300 hover:scale-105 text-3xl"
                          >
                            1000
                          </Button>
                        </div>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotMachine;