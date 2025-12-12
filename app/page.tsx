"use client";

import React, { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

type Cell = "X" | "O" | null;
type Result = "win" | "lose" | "draw" | null;
type Difficulty = "easy" | "smart";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function winner(board: Cell[]): "X" | "O" | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function full(board: Cell[]) {
  return board.every((c) => c !== null);
}

function availableMoves(board: Cell[]) {
  const moves: number[] = [];
  for (let i = 0; i < 9; i++) if (!board[i]) moves.push(i);
  return moves;
}

function minimax(board: Cell[], isMax: boolean, depth: number): number {
  const w = winner(board);
  if (w === "O") return 10 - depth;
  if (w === "X") return depth - 10;
  if (full(board)) return 0;

  const moves = availableMoves(board);

  if (isMax) {
    let best = -Infinity;
    for (const m of moves) {
      board[m] = "O";
      best = Math.max(best, minimax(board, false, depth + 1));
      board[m] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      board[m] = "X";
      best = Math.min(best, minimax(board, true, depth + 1));
      board[m] = null;
    }
    return best;
  }
}

function bestMove(board: Cell[]): number {
  const moves = availableMoves(board);
  let bestScore = -Infinity;
  let move = moves[0];

  for (const m of moves) {
    board[m] = "O";
    const score = minimax(board, false, 0);
    board[m] = null;

    if (score > bestScore) {
      bestScore = score;
      move = m;
    }
  }
  return move;
}

function randomMove(board: Cell[]): number {
  const moves = availableMoves(board);
  return moves[Math.floor(Math.random() * moves.length)];
}

function promoCode5(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}

async function notifyTelegram(result: "win" | "lose", code?: string) {
  const res = await fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, code }),
  });
  if (!res.ok) throw new Error("notify failed");
}

export default function Page() {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"player" | "cpu">("player");
  const [result, setResult] = useState<Result>(null);
  const [promo, setPromo] = useState<string | null>(null);
  const [tgStatus, setTgStatus] = useState<"idle" | "sent" | "fail">("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("smart");

  const statusText = useMemo(() => {
    if (result === "win") return "Ты выиграла 🎉";
    if (result === "lose") return "Упс… в этот раз не получилось";
    if (result === "draw") return "Ничья. Ещё раунд?";
    return turn === "player" ? "Твой ход" : "Ход компьютера…";
  }, [result, turn]);

  function reset() {
    setBoard(Array(9).fill(null));
    setTurn("player");
    setResult(null);
    setPromo(null);
    setTgStatus("idle");
  }

  async function finish(res: Result, code?: string) {
    setResult(res);
    if (res === "win" && code) setPromo(code);

    try {
      if (res === "win") await notifyTelegram("win", code);
      if (res === "lose") await notifyTelegram("lose");
      setTgStatus("sent");
    } catch {
      setTgStatus("fail");
    }
  }

  async function onPlayerClick(i: number) {
    if (result) return;
    if (turn !== "player") return;
    if (board[i]) return;

    const next = [...board];
    next[i] = "X";
    setBoard(next);

    const w1 = winner(next);
    if (w1 === "X") {
      const code = promoCode5();
      confetti({ particleCount: 140, spread: 70, origin: { y: 0.7 } });
      await finish("win", code);
      return;
    }
    if (full(next)) {
      setResult("draw");
      return;
    }

    setTurn("cpu");

    setTimeout(async () => {
      const cpuBoard = [...next];

      const m =
        difficulty === "easy" && Math.random() < 0.65
          ? randomMove(cpuBoard)
          : bestMove(cpuBoard);

      cpuBoard[m] = "O";
      setBoard(cpuBoard);

      const w2 = winner(cpuBoard);
      if (w2 === "O") {
        await finish("lose");
        return;
      }
      if (full(cpuBoard)) {
        setResult("draw");
        return;
      }
      setTurn("player");
    }, 350);
  }

  return (
    <main className="min-h-screen w-full text-zinc-900 bg-gradient-to-b from-rose-50 via-pink-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="rounded-3xl bg-white/85 backdrop-blur shadow-xl border border-pink-100 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900">
                Крестики-нолики 💗
              </h1>
              <p className="text-sm md:text-base text-zinc-700 mt-1">
                Играй против компьютера. Победа = промокод 🎁
              </p>
            </div>

            <button
              onClick={reset}
              className="shrink-0 rounded-2xl px-4 py-2 text-sm font-medium bg-zinc-900 text-white hover:opacity-90 active:opacity-80"
            >
              Сбросить
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-zinc-700">
              Сложность:{" "}
              <span className="font-semibold text-zinc-900">
                {difficulty === "easy" ? "Новичок" : "Гроссмейстер"}
              </span>
            </div>

            <div className="flex rounded-2xl bg-white border border-zinc-200 shadow-sm p-1">
              <button
                onClick={() => setDifficulty("easy")}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                  difficulty === "easy"
                    ? "bg-rose-500 text-white"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Новичок
              </button>
              <button
                onClick={() => setDifficulty("smart")}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                  difficulty === "smart"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                Гроссмейстер
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {board.map((cell, i) => (
              <button
                key={i}
                onClick={() => onPlayerClick(i)}
                className="aspect-square rounded-3xl bg-gradient-to-b from-white to-pink-50 border border-pink-200 shadow-sm hover:shadow transition flex items-center justify-center"
              >
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: cell ? 1 : 0.6, opacity: cell ? 1 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className={`text-4xl md:text-5xl font-semibold ${
                    cell === "X" ? "text-rose-500" : "text-indigo-500"
                  }`}
                >
                  {cell ?? ""}
                </motion.span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-base md:text-lg font-semibold text-zinc-900">
              {statusText}
            </div>
            <div className="text-xs text-zinc-600">
              Telegram:{" "}
              <span className="font-medium text-zinc-800">
                {tgStatus === "idle"
                  ? "—"
                  : tgStatus === "sent"
                  ? "сообщение отправлено ✅"
                  : "ошибка отправки ⚠️"}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {(result === "win" || result === "lose" || result === "draw") && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-6 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm"
              >
                {result === "win" && (
                  <>
                    <div className="text-lg font-semibold text-zinc-900">
                      Твой промокод 🎁
                    </div>
                    <div className="mt-2 text-3xl font-bold tracking-widest text-zinc-900">
                      {promo}
                    </div>
                    <p className="mt-2 text-sm text-zinc-700">
                      Сохрани его — он пригодится при оплате.
                    </p>
                  </>
                )}

                {result === "lose" && (
                  <>
                    <div className="text-lg font-semibold text-zinc-900">
                      Попробуешь ещё раз?
                    </div>
                    <p className="mt-2 text-sm text-zinc-700">
                      Иногда компьютеру просто везёт 😌
                    </p>
                  </>
                )}

                {result === "draw" && (
                  <>
                    <div className="text-lg font-semibold text-zinc-900">
                      Ничья 🤝
                    </div>
                    <p className="mt-2 text-sm text-zinc-700">
                      Давай ещё одну — победа близко.
                    </p>
                  </>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={reset}
                    className="rounded-2xl px-5 py-2.5 font-medium bg-rose-500 text-white hover:opacity-90 active:opacity-80"
                  >
                    Играть ещё
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(promo ?? "")}
                    disabled={!promo}
                    className="rounded-2xl px-5 py-2.5 font-medium bg-zinc-100 text-zinc-900 disabled:opacity-50"
                  >
                    Скопировать код
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 text-xs text-zinc-600">
            💡 Победа выдаёт промокод и отправляет уведомление в Telegram. Токен хранится в ENV и не попадает в браузер.
          </div>
        </div>
      </div>
    </main>
  );
}
