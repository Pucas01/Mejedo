"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAchievements } from '../../../hooks/useAchievements';
import { useTheme } from '../../../hooks/useTheme';
import Button from '../../ui/Button';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 6;
const INITIAL_BALL_SPEED = 4;

export default function PongWidget({ isMinimized }) {
  const canvasRef = useRef(null);
  const { updateStats } = useAchievements();
  const { theme } = useTheme();
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'paused', 'gameOver'
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [highScore, setHighScore] = useState(0);

  const gameStateRef = useRef({
    playerY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    aiY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: CANVAS_WIDTH / 2,
    ballY: CANVAS_HEIGHT / 2,
    ballVelX: INITIAL_BALL_SPEED,
    ballVelY: INITIAL_BALL_SPEED,
    keys: {},
    animationId: null
  });

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pong_high_score');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Save high score
  useEffect(() => {
    if (score.player > highScore) {
      setHighScore(score.player);
      localStorage.setItem('pong_high_score', score.player.toString());
      updateStats("pongHighScore", score.player);
    }
  }, [score.player, highScore, updateStats]);

  // Auto-start game when minimized
  useEffect(() => {
    if (isMinimized && gameState === 'menu') {
      startGame();
    }
  }, [isMinimized]);

  const resetBall = useCallback(() => {
    const state = gameStateRef.current;
    state.ballX = CANVAS_WIDTH / 2;
    state.ballY = CANVAS_HEIGHT / 2;

    // Random direction
    const angle = (Math.random() - 0.5) * Math.PI / 3; // -30 to 30 degrees
    const direction = Math.random() < 0.5 ? 1 : -1;
    state.ballVelX = Math.cos(angle) * INITIAL_BALL_SPEED * direction;
    state.ballVelY = Math.sin(angle) * INITIAL_BALL_SPEED;
  }, []);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore({ player: 0, ai: 0 });
    resetBall();
    gameStateRef.current.playerY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    gameStateRef.current.aiY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
  }, [resetBall]);

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const state = gameStateRef.current;

    // Move player paddle (or AI if minimized)
    if (isMinimized) {
      // AI controls both paddles when minimized
      const playerCenter = state.playerY + PADDLE_HEIGHT / 2;
      const ballCenter = state.ballY;
      const playerAiSpeed = PADDLE_SPEED * 0.5; // Slower AI for left paddle

      if (ballCenter < playerCenter - 15 && state.playerY > 0) {
        state.playerY -= playerAiSpeed;
      } else if (ballCenter > playerCenter + 15 && state.playerY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        state.playerY += playerAiSpeed;
      }
    } else {
      // Player controls left paddle when not minimized
      if (state.keys['ArrowUp'] && state.playerY > 0) {
        state.playerY -= PADDLE_SPEED;
      }
      if (state.keys['ArrowDown'] && state.playerY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        state.playerY += PADDLE_SPEED;
      }
    }

    // AI paddle movement (right paddle - simple tracking)
    const aiCenter = state.aiY + PADDLE_HEIGHT / 2;
    const ballCenter = state.ballY;
    const aiSpeed = PADDLE_SPEED * 0.55; // Slower AI

    if (ballCenter < aiCenter - 15 && state.aiY > 0) {
      state.aiY -= aiSpeed;
    } else if (ballCenter > aiCenter + 15 && state.aiY < CANVAS_HEIGHT - PADDLE_HEIGHT) {
      state.aiY += aiSpeed;
    }

    // Move ball
    state.ballX += state.ballVelX;
    state.ballY += state.ballVelY;

    // Ball collision with top/bottom walls
    if (state.ballY <= 0 || state.ballY >= CANVAS_HEIGHT - BALL_SIZE) {
      state.ballVelY *= -1;
    }

    // Ball collision with player paddle (left)
    if (
      state.ballX <= PADDLE_WIDTH &&
      state.ballY + BALL_SIZE >= state.playerY &&
      state.ballY <= state.playerY + PADDLE_HEIGHT
    ) {
      state.ballVelX *= -1.05; // Speed up slightly
      const hitPos = (state.ballY - state.playerY) / PADDLE_HEIGHT;
      state.ballVelY = (hitPos - 0.5) * 8;
    }

    // Ball collision with AI paddle (right)
    if (
      state.ballX >= CANVAS_WIDTH - PADDLE_WIDTH - BALL_SIZE &&
      state.ballY + BALL_SIZE >= state.aiY &&
      state.ballY <= state.aiY + PADDLE_HEIGHT
    ) {
      state.ballVelX *= -1.05; // Speed up slightly
      const hitPos = (state.ballY - state.aiY) / PADDLE_HEIGHT;
      state.ballVelY = (hitPos - 0.5) * 8;
    }

    // Ball out of bounds (scoring)
    if (state.ballX < 0) {
      // AI scores
      setScore(prev => ({ ...prev, ai: prev.ai + 1 }));
      resetBall();
    } else if (state.ballX > CANVAS_WIDTH) {
      // Player scores
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      updateStats("scoredPongPoint", true);
      resetBall();
    }

    // Check for game over (first to 10)
    if (score.player >= 10 || score.ai >= 10) {
      setGameState('gameOver');
      return;
    }

    // Draw everything
    ctx.fillStyle = '#121217';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line
    ctx.strokeStyle = theme.colors.primary;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw player paddle (left)
    ctx.fillStyle = theme.colors.primary;
    ctx.fillRect(0, state.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw AI paddle (right)
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH, state.aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw ball
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE);

    // Draw scores
    ctx.font = '48px monospace';
    ctx.fillStyle = theme.colors.primary;
    ctx.fillText(score.player.toString(), CANVAS_WIDTH / 4, 60);
    ctx.fillStyle = '#ff5555';
    ctx.fillText(score.ai.toString(), (CANVAS_WIDTH / 4) * 3, 60);

    state.animationId = requestAnimationFrame(gameLoop);
  }, [gameState, score, resetBall, isMinimized]);

  // Start/stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameStateRef.current.animationId = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (gameStateRef.current.animationId) {
        cancelAnimationFrame(gameStateRef.current.animationId);
      }
    };
  }, [gameState, gameLoop]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        gameStateRef.current.keys[e.key] = true;
      }
      if (e.key === ' ' && gameState === 'playing') {
        e.preventDefault();
        setGameState('paused');
      } else if (e.key === ' ' && gameState === 'paused') {
        e.preventDefault();
        setGameState('playing');
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        gameStateRef.current.keys[e.key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Minimized view
  if (isMinimized) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white gap-1">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`border ${theme.colors.border} bg-[#121217]`}
          style={{ width: '270px', height: '180px' }}
        />
        <p className="text-gray-500 text-xs">{score.player} - {score.ai}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start h-full gap-4 text-white pt-4">
      {gameState === 'menu' && (
        <div className="text-center space-y-4">
          <h2 className={`text-4xl ${theme.colors.text} font-bold`}>PONG</h2>
          <p className="text-gray-400 text-lg">Use Arrow Keys to move</p>
          <p className="text-gray-400 text-lg">First to 10 wins!</p>
          {highScore > 0 && (
            <p className={`${theme.colors.text} text-xl`}>High Score: {highScore}</p>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={startGame}
          >
            START GAME
          </Button>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center space-y-4">
            <h2 className={`text-4xl ${theme.colors.text} font-bold`}>PAUSED</h2>
            <p className="text-gray-400 text-lg">Press SPACE to resume</p>
            <Button
              variant="danger"
              size="md"
              onClick={() => setGameState('menu')}
            >
              QUIT
            </Button>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center space-y-4">
            <h2 className={`text-4xl ${theme.colors.text} font-bold`}>GAME OVER</h2>
            <p className="text-2xl">
              {score.player > score.ai ? (
                <span className={theme.colors.text}>YOU WIN!</span>
              ) : (
                <span className="text-[#ff5555]">YOU LOSE!</span>
              )}
            </p>
            <p className="text-xl text-white">Final Score: {score.player} - {score.ai}</p>
            {score.player === highScore && score.player > 0 && (
              <p className={`${theme.colors.text} text-xl font-bold`}>NEW HIGH SCORE!</p>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={startGame}
            >
              PLAY AGAIN
            </Button>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={`border-2 ${theme.colors.border} bg-[#121217]`}
      />

      {gameState === 'playing' && (
        <p className="text-gray-500 text-sm">Press SPACE to pause</p>
      )}
    </div>
  );
}
