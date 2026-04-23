import { useState, useEffect } from "react";

/*
  Este componente principal representa TODA la aplicación.
  En React, un componente es como una función que devuelve
  lo que se va a mostrar en pantalla (HTML dinámico).

  Aquí se maneja:
  - El estado del juego
  - La lógica (turnos, ganador, IA)
  - La interfaz visual
*/

/*
  Creamos objetos de audio.

  Estos permiten reproducir sonidos en momentos específicos del juego.

  IMPORTANTE:
  - Se colocan FUERA del componente para que no se creen de nuevo en cada render
  - Esto mejora rendimiento y evita bugs de audio duplicado
*/
const sonidoMovimiento = new Audio("/sounds/domino_pieza.mp3");
const sonidoVictoria = new Audio("/sounds/cerveza_victoria.mp3");
const sonidoDerrota = new Audio("/sounds/tsk_tsk_derrota.mp3");

export default function App() {

  // ======================================================
  // ESTADOS PRINCIPALES DEL JUEGO
  // ======================================================

  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);

  const [mode, setMode] = useState("menu");
  const [coin, setCoin] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);

  /*
    ❌ ANIMACIÓN DE MONEDA ELIMINADA

    Decidiste quitarla porque visualmente no era buena.
    Dejamos el estado para no romper lógica previa,
    pero ya NO se usa en la interfaz.
  */
  const [flipping, setFlipping] = useState(false);

  /*
    🆕 NUEVO ESTADO: CELDAS GANADORAS

    Este arreglo guarda las posiciones que forman
    la combinación ganadora.

    Ejemplo:
    [0,1,2] → fila superior

    Esto se usará para aplicar animaciones visuales
    (resaltar las casillas ganadoras).
  */
  const [winningCells, setWinningCells] = useState([]);

  // ======================================================
  // MARCADOR (PERSISTENTE)
  // ======================================================

  const [score, setScore] = useState({
    rojo: 0,
    azul: 0,
    empate: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem("score");
    if (saved) setScore(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("score", JSON.stringify(score));
  }, [score]);

  // ======================================================
  // CAMBIO DE MODO
  // ======================================================

  const changeMode = (newMode) => {
    setMode(newMode);

    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsDraw(false);
    setTurn(null);
    setCoin(null);
    setPlayerColor(null);
    setFlipping(false);
    setWinningCells([]); // limpiar animaciones
  };

  // ======================================================
  // COMBINACIONES GANADORAS
  // ======================================================

  const winCombos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  // ======================================================
  // IA MEJORADA (INTELIGENTE)
  // ======================================================

  /*
    🧠 NUEVA FUNCIÓN: IA CON LÓGICA

    Esta función hace que la máquina:

    1. Intente GANAR si puede
    2. Si no puede, BLOQUEA al jugador
    3. Si no, juega aleatorio

    Esto evita que el jugador gane fácilmente.
  */
  const getBestMove = (boardState, cpuColor, humanColor) => {

    /*
      1. INTENTAR GANAR
    */
    for (let combo of winCombos) {
      const [a, b, c] = combo;
      const values = [boardState[a], boardState[b], boardState[c]];

      if (values.filter(v => v === cpuColor).length === 2 &&
          values.includes(null)) {

        return combo[values.indexOf(null)];
      }
    }

    /*
      2. BLOQUEAR AL JUGADOR
    */
    for (let combo of winCombos) {
      const [a, b, c] = combo;
      const values = [boardState[a], boardState[b], boardState[c]];

      if (values.filter(v => v === humanColor).length === 2 &&
          values.includes(null)) {

        return combo[values.indexOf(null)];
      }
    }

    /*
      3. MOVIMIENTO ALEATORIO
    */
    const empty = boardState
      .map((v, i) => (v === null ? i : null))
      .filter(v => v !== null);

    return empty[Math.floor(Math.random() * empty.length)];
  };

  // ======================================================
  // LANZAR MONEDA
  // ======================================================

  const flipCoin = () => {

    if (mode === "cpu" && playerColor === null) return;

    const result = Math.random() < 0.5 ? "rojo" : "azul";

    setCoin(result);
    setTurn(result);
  };

  // ======================================================
  // CLICK EN CASILLA
  // ======================================================

  const handleClick = (index) => {

    if (!turn || board[index] || winner || isDraw) return;

    const newBoard = [...board];
    newBoard[index] = turn;

    setBoard(newBoard);

    sonidoMovimiento.currentTime = 0;
    sonidoMovimiento.play();

    checkGameState(newBoard);

    setTurn(turn === "rojo" ? "azul" : "rojo");
  };

  // ======================================================
  // IA ACTUALIZADA
  // ======================================================

  useEffect(() => {

    if (mode !== "cpu") return;

    if (turn && turn !== playerColor && !winner && !isDraw) {

      setTimeout(() => {

        /*
          🧠 USAMOS LA IA INTELIGENTE

          - cpuColor → turno actual (máquina)
          - humanColor → jugador

          Esto reemplaza el random anterior.
        */
        const bestMove = getBestMove(board, turn, playerColor);

        if (bestMove !== undefined) {
          handleClick(bestMove);
        }

      }, 500);
    }

  }, [turn, mode]);

  // ======================================================
  // GANADOR / EMPATE
  // ======================================================

  const checkGameState = (board) => {

    for (let combo of winCombos) {
      const [a, b, c] = combo;

      if (board[a] && board[a] === board[b] && board[a] === board[c]) {

        setWinner(board[a]);

        /*
          🆕 GUARDAMOS CELDAS GANADORAS

          Esto permite aplicar animaciones visuales
          (por ejemplo: brillo, escala, etc).
        */
        setWinningCells(combo);

        sonidoVictoria.currentTime = 0;
        sonidoVictoria.play();

        if (mode === "cpu" && board[a] !== playerColor) {
          sonidoDerrota.currentTime = 0;
          sonidoDerrota.play();
        }

        setScore(prev => ({
          ...prev,
          [board[a]]: prev[board[a]] + 1
        }));

        return;
      }
    }

    const isBoardFull = board.every(cell => cell !== null);

    if (isBoardFull) {
      setIsDraw(true);

      setScore(prev => ({
        ...prev,
        empate: prev.empate + 1
      }));
    }
  };

  // ======================================================
  // REINICIAR PARTIDA
  // ======================================================

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setIsDraw(false);
    setTurn(null);
    setCoin(null);
    setFlipping(false);
    setWinningCells([]); // limpiar animación
  };

  // ======================================================
  // MENÚ
  // ======================================================

  if (mode === "menu") {
    return (
      <div className="app">

        <div className="flag">
          <div className="blue"></div>
          <div className="red"></div>
          <div className="red"></div>
          <div className="blue"></div>
        </div>

        <div className="cross"></div>

        <div className="content">
          <h1>🇩🇴 Tres en Raya</h1>

          <button onClick={() => changeMode("pvp")}>
            2 Jugadores
          </button>

          <button onClick={() => changeMode("cpu")}>
            1 Jugador vs Máquina
          </button>
        </div>

      </div>
    );
  }

  // ======================================================
  // INTERFAZ DEL JUEGO
  // ======================================================

  return (
    <div className="app">

      <div className="flag">
        <div className="blue"></div>
        <div className="red"></div>
        <div className="red"></div>
        <div className="blue"></div>
      </div>

      <div className="cross"></div>

      <div className="content">

        <h1>🇩🇴 Guerra 🔴 vs Paz 🔵</h1>

        {mode === "cpu" && !playerColor && (
          <div>
            <h3>Elige tu equipo</h3>
            <button onClick={() => setPlayerColor("rojo")}>Guerra 🔴</button>
            <button onClick={() => setPlayerColor("azul")}>Paz 🔵</button>
          </div>
        )}

        {!coin && (
          (mode === "pvp" || (mode === "cpu" && playerColor !== null)) && (
            <button onClick={flipCoin}>
              Lanzar moneda 🪙
            </button>
          )
        )}

        {coin && (
          <h3>
            Empieza: {coin === "rojo" ? "Guerra 🔴" : "Paz 🔵"}
          </h3>
        )}

        {/* ======================================================
   MARCADOR VISUAL MEJORADO
   ====================================================== */}

<div className="score">

  {/* Equipo rojo (Guerra) */}
  <span className="rojo-text">
    Guerra 🔴: {score.rojo}
  </span>

  {" | "}

  {/* Equipo azul (Paz) */}
  <span className="azul-text">
    Paz 🔵: {score.azul}
  </span>

  {" | "}

  {/* Empates */}
  <span className="empate-text">
    Empates 🤝: {score.empate}
  </span>

</div>

        <div className="board">
          {board.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`cell ${winningCells.includes(i) ? "win" : ""}`}
            >
              {cell === "rojo" && <img src="/img/tapa_roja.png" width="60" />}
              {cell === "azul" && <img src="/img/tapa_azul.png" width="60" />}
            </button>
          ))}
        </div>

        {winner && <h2>Ganó: {winner}</h2>}
        {isDraw && <h2>Empate 🤝</h2>}
        {!winner && !isDraw && turn && <h3>Turno: {turn}</h3>}

        <button onClick={resetGame}>Reiniciar</button>
        <button onClick={() => changeMode("menu")}>Menú</button>

      </div>
    </div>
  );
}