import './style.css'
import { Board, ROWS, COLUMNS } from './board';

// Create 8x8 array of null values.
const board = new Board();
renderBoard();
placeAllPieces();
handleMovingPieces();

function renderBoard(): void {
	const board = document.getElementById('board')!;

	// Create a div for each square. Set top and left position using CSS.
	for(let row of ROWS) {
		let rowIndex = ROWS.indexOf(row);

		for(let column of COLUMNS) {
			let columnIndex = COLUMNS.indexOf(column);

			const square = document.createElement('div');
			// Set id of square to its position on the board.
			square.id = `${column}${row}`;
			square.classList.add('square');
			square.style.top = `${rowIndex * 12.5}%`;
			square.style.left = `${columnIndex * 12.5}%`;

			// Set the background color of the square based on its position.
			if((rowIndex + columnIndex) % 2 === 0) {
				square.classList.add('light');
			} else {
				square.classList.add('dark');
			}

			board.appendChild(square);
		}
	}
}

function placeAllPieces(): void {
	// Iterate over each row and column in the board array. If the value is not null,
	// place the piece on the board. A piece is represented by a div with a class
	// corresponding to its type and color.
	for (let row of board) {
		let rowIndex = board.grid.indexOf(row);

		for (let piece of row) {
			if (piece === null) continue; // Skip null values (empty squares).

			let columnIndex = row.indexOf(piece);

			const pieceElem = document.createElement('div');
			pieceElem.classList.add('piece', piece.type, piece.color);
			pieceElem.addEventListener('click', () => {
				let availableSquares = piece!.availableSquares(board);
				console.log(availableSquares.join(', '));
				document.querySelectorAll('.square.available-square').forEach(square => {
					square.classList.remove('available-square');
				});
				availableSquares.forEach(square => {
					document.getElementById(square.toString())!.classList.add('available-square');
				});
			});

			// Get the square that corresponds to the current piece.
			const square = document.getElementById(`${COLUMNS[columnIndex]}${ROWS[rowIndex]}`)!;
			square.appendChild(pieceElem);
		}
	}
}

function handleMovingPieces(): void {
	let selectedPiece: HTMLElement | null = null;
	let selectedSquare: HTMLElement | null = null;

	document.getElementById('board')!.addEventListener('click', (event) => {
		const target = event.target as HTMLElement;
		let square = target.closest('.square') as HTMLElement;
		if (!square) return; // Maybe something else was clicked.

		let pieceElem = target.closest('.piece') as HTMLElement;

		// If no piece is selected, select the clicked piece.
		if (!selectedPiece) {
			if (!pieceElem) return; // No piece was clicked.
			//if (piece.classList.contains('white')) return; // Can't move white pieces.

			selectedPiece = pieceElem;
			selectedPiece.parentElement!.classList.add('selected');
			selectedSquare = square;
		}
		// If a piece is selected, move the piece to the clicked square if it is a valid move.
		else {
			// Get the instance of the selected piece
			// HTML element id is in the format: "columnRow"
			let piece = board.getPieceAt(selectedPiece.closest('.square')!.id)!;
			let availableSquares = piece.availableSquares(board);

			// If the clicked square is not in the list of available squares, cancel the move.
			if (!availableSquares.map(s => String(s)).includes(square.id)) {
				resetSelection();
				return;
			}

			// Move the piece to the clicked square.
			square.appendChild(selectedPiece);

			// If the piece was moved to a square with a piece of the opposite color, remove it.
			if (pieceElem) {
				pieceElem.remove();
			}

			// Update the board array.
			board.movePiece(piece, square.id);

			resetSelection();
		}
	});

	function resetSelection() {
		if (!selectedPiece) return;
		selectedSquare!.classList.remove('selected');
		selectedPiece = null;
		selectedSquare = null;

		document.querySelectorAll('.square.available-square').forEach(square => {
			square.classList.remove('available-square');
		});
	}
}
