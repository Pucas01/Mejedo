"use client";
import { useState, useEffect, useRef } from "react";
import { useCurrentUser } from "../../../hooks/CurrentUser";
import { useAchievements } from "../../../hooks/useAchievements";
import Button from "../../ui/Button";

export default function MusicPlayerWidget({ isMinimized }) {
  const { isAdmin } = useCurrentUser();
  const { updateStats } = useAchievements();
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  // Fetch songs list
  const fetchSongs = async () => {
    try {
      const res = await fetch('/api/music');
      const data = await res.json();
      setSongs(data.songs || []);
    } catch (err) {
      console.error('Failed to fetch songs:', err);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  // Audio visualizer setup
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || audioContextRef.current) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);

    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.7;

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentSong]);

  // Visualizer animation loop
  useEffect(() => {
    if (!isPlaying || isMinimized || !analyserRef.current || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const barCount = 32; // Half the bars (will be mirrored)
    const barWidth = (canvas.width / 2) / barCount - 1;
    const bars = new Array(barCount).fill(0);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#121217';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;

      for (let i = 0; i < barCount; i++) {
        // Logarithmic frequency distribution
        // Bass (low frequencies) in center, highs on edges
        const index = Math.floor(Math.pow(i / barCount, 1.5) * bufferLength * 0.5);
        const value = dataArray[index];

        // Smooth bar heights (gravity effect)
        const targetHeight = (value / 255) * canvas.height * 0.95;
        bars[i] = bars[i] * 0.85 + targetHeight * 0.15;

        const barHeight = bars[i];

        // Green color
        const green = Math.floor((barHeight / canvas.height) * 100 + 100);
        ctx.fillStyle = `rgb(${green}, ${155 + green}, ${green})`;

        // Draw bar on the right side (from center outward)
        const xRight = centerX + (barCount - i - 1) * (barWidth + 1);
        ctx.fillRect(xRight, canvas.height - barHeight, barWidth, barHeight);

        // Mirror: Draw bar on the left side (from center outward)
        const xLeft = centerX - (barCount - i) * (barWidth + 1);
        ctx.fillRect(xLeft, canvas.height - barHeight, barWidth, barHeight);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isMinimized]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Apply scaled volume when audio loads
    audio.volume = volume * 0.7;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      // Auto-play next song
      const currentIndex = songs.indexOf(currentSong);
      if (currentIndex !== -1 && currentIndex < songs.length - 1) {
        // Play next song
        const nextSong = songs[currentIndex + 1];
        setCurrentSong(nextSong);
        setCurrentTime(0);
        setTimeout(() => {
          audioRef.current?.play();
          setIsPlaying(true);
          updateStats("playedSong", true);
        }, 100);
      } else {
        // End of playlist
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong, volume, songs, updateStats]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('music', file);

    try {
      const res = await fetch('/api/music/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchSongs();
        e.target.value = '';
      } else {
        alert('Failed to upload song');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload song');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSong = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      const res = await fetch(`/api/music/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (currentSong === filename) {
          setCurrentSong(null);
          setIsPlaying(false);
        }
        await fetchSongs();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const playSong = (filename) => {
    if (currentSong === filename && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else if (currentSong === filename) {
      audioRef.current?.play();
      setIsPlaying(true);
      // Trigger music listener achievement
      updateStats("playedSong", true);
    } else {
      setCurrentSong(filename);
      setCurrentTime(0);
      setTimeout(() => {
        audioRef.current?.play();
        setIsPlaying(true);
        // Trigger music listener achievement
        updateStats("playedSong", true);
      }, 100);
    }
  };

  const handleVolumeChange = (e) => {
    const sliderValue = parseFloat(e.target.value);
    setVolume(sliderValue);
    if (audioRef.current) {
      // Scale volume: 100% on slider = 70% actual volume
      audioRef.current.volume = sliderValue * 0.7;
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Minimized view - only show player controls
  if (isMinimized && currentSong) {
    return (
      <div className="flex flex-col h-full gap-2 text-white">
        {/* Compact Now Playing */}
        <div className="text-sm text-[#39ff14] truncate">
          {currentSong.replace(/\.[^/.]+$/, '')}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white text-[10px]">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 retro-slider"
          />
          <span className="text-white text-[10px]">{formatTime(duration)}</span>
        </div>

        {/* Play/Pause button */}
        <Button
          variant="primary"
          size="sm"
          onClick={() => playSong(currentSong)}
          className="w-full"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </Button>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={`/api/music/${encodeURIComponent(currentSong)}`}
        />
      </div>
    );
  }

  // Minimized view without song playing
  if (isMinimized) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No song playing
      </div>
    );
  }

  // Full view
  return (
    <div className="flex flex-col h-full gap-3 text-white">
      {/* Upload section (admin only) */}
      {isAdmin && (
        <div className="border border-[#39ff14] p-2">
          <label className="text-[#39ff14] text-sm mb-1 block">Upload Music (Admin)</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="text-sm text-white file:mr-2 file:py-1 file:px-2 file:border-0 file:bg-[#39ff14] file:text-black file:cursor-pointer"
          />
          {uploading && <p className="text-xs text-[#39ff14] mt-1">Uploading...</p>}
        </div>
      )}

      {/* Song list */}
      <div className="flex-1 overflow-auto border border-[#39ff14] p-2">
        <div className="text-[#39ff14] text-sm mb-2">Playlist ({songs.length})</div>
        {songs.length === 0 ? (
          <p className="text-gray-400 text-sm">No songs available</p>
        ) : (
          <div className="space-y-1">
            {songs.map((song) => (
              <div
                key={song}
                className={`flex items-center justify-between p-1 text-sm border border-[#39ff14] ${
                  currentSong === song ? 'bg-[#39ff14]/20' : 'hover:bg-[#39ff14]/10'
                }`}
              >
                <button
                  onClick={() => playSong(song)}
                  className="flex-1 text-left truncate"
                >
                  <span className="mr-2">{currentSong === song && isPlaying ? '▶' : '⏸'}</span>
                  {song.replace(/\.[^/.]+$/, '')}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteSong(song)}
                    className="ml-2 text-red-500 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player controls */}
      {currentSong && (
        <div className="border border-[#39ff14] p-2 space-y-2">
          <div className="text-sm text-[#39ff14]">
            Now Playing: {currentSong.replace(/\.[^/.]+$/, '')}
          </div>

          {/* Audio Visualizer */}
          <canvas
            ref={canvasRef}
            width={400}
            height={60}
            className="w-full border border-[#39ff14] bg-[#121217]"
          />

          {/* Progress bar */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 retro-slider"
            />
            <span className="text-white">{formatTime(duration)}</span>
          </div>

          {/* Volume control */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#39ff14]">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 retro-slider"
            />
            <span className="text-white">{Math.round(volume * 100)}%</span>
          </div>

          {/* Play/Pause button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => playSong(currentSong)}
            className="w-full"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </Button>
        </div>
      )}

      {/* Hidden audio element */}
      {currentSong && (
        <audio
          ref={audioRef}
          src={`/api/music/${encodeURIComponent(currentSong)}`}
        />
      )}
    </div>
  );
}
