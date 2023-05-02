// These are the values that people see and understand
export const COLUMNS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const ROWS = [8, 7, 6, 5, 4, 3, 2, 1];

// These are array indexes from 0 to 7.
const BLACK_PIECE_ROW = 0;
const BLACK_PAWN_ROW = 1;
const WHITE_PAWN_ROW = 6;
const WHITE_PIECE_ROW = 7;

export class Board {
	grid!: (Piece | null)[][];

	constructor() {
		this.initialize();
	}

	[Symbol.iterator]() {
		// Return grid as an iterator
		return this.grid[Symbol.iterator]();
	}

	/**
	 * Initialize the board with pieces in their starting positions.
	 */
	initialize(): void {
		this.grid = Array(8).fill(null).map(() => Array(8).fill(null));
		const pieceOrder: Piece['type'][] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

		// Place pawns.
		for(let column of COLUMNS) {
			let i = COLUMNS.indexOf(column);
			this.grid[BLACK_PAWN_ROW][i] = this.createPiece('pawn', 'black');
			this.grid[WHITE_PAWN_ROW][i] = this.createPiece('pawn', 'white');
		}

		// Place pieces.
		for (let i = 0; i < 8; i++) {
			const piece = pieceOrder[i];
			this.grid[BLACK_PIECE_ROW][i] = this.createPiece(piece, 'black');
			this.grid[WHITE_PIECE_ROW][i] = this.createPiece(piece, 'white');
		}
	}

	/**
	 * Return the piece at the given position.
	 */
	getPieceAt(position: Position | string): Piece | null {
		if (typeof position === 'string') {
			position = Position.fromString(position);
		}

		return this.grid[position.row][position.column];
	}

	createPiece(type: Piece['type'], color: Piece['color']): Piece {
		switch (type) {
			case 'pawn':
				return new Pawn(color);
			case 'rook':
				return new Rook(color);
			case 'knight':
				return new Knight(color);
			case 'bishop':
				return new Bishop(color);
			case 'queen':
				return new Queen(color);
			case 'king':
				return new King(color);
			default:
				throw new Error('Invalid piece type.');
		}
	}

	movePiece(piece: Piece, position: Position | string): void {
		if (typeof position === 'string') {
			position = Position.fromString(position);
		}

		const currentPosition = piece.getPosition(this);
		this.grid[currentPosition.row][currentPosition.column] = null;
		this.grid[position.row][position.column] = piece;
	}
}

abstract class Piece {
	type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
	color: 'black' | 'white';

	constructor(type: Piece['type'], color: Piece['color']) {
		this.type = type;
		this.color = color;
	}

	getPosition(board: Board): Position {
		// Trace rows and columns and return the position of the piece when found.
		for (let row of board.grid) {
			let rowIndex = board.grid.indexOf(row);

			for (let piece of row) {
				let columnIndex = row.indexOf(piece);

				// If found, return its position.
				if (piece === this) {
					return new Position(rowIndex, columnIndex);
				}
			}
		}

		throw new Error('Piece not found on board.');
	}

	/**
	 * Return an array of positions that the piece can move to.
	 */
	abstract availableSquares(board: Board): Position[];

	protected getAvaiableSquaresInDirections(board: Board, directions: [number, number][], loop = true): Position[] {
		let squares: Position[] = [];

		for (let [rowOffset, columnOffset] of directions) {
			// Initialize loop variables with current position of the piece.
			let nextSquare = this.getPosition(board);
			let otherPiece = null;

			while (otherPiece === null) {
				nextSquare = nextSquare.addOffset(rowOffset, columnOffset);
				if (!nextSquare.isOnBoard()) break;

				otherPiece = board.getPieceAt(nextSquare);

				// If the square is empty, or the piece on the square is of the opposite color,
				// add the square to the list of available squares.
				if (otherPiece?.color !== this.color) {
					squares.push(nextSquare);
				}

				// If the square is not empty, stop looping.
				if (otherPiece) break;

				// If the piece can't move in a loop, stop looping.
				if (!loop) break;
			}
		}

		return squares;
	}
}

class Pawn extends Piece {
	constructor(color: Piece['color']) {
		super('pawn', color);
	}

	availableSquares(board: Board): Position[] {
		let squares: Position[] = [];

		// Get paws's current position.
		const position = this.getPosition(board);

		// Get the pawn's direction of movement.
		// White pawns move up the board, black pawns move down.
		// Moving up means the row index decreases, moving down means it increases.
		const direction = this.color === 'white' ? -1 : 1;

		// A pawn can move one square forward if the square is empty.
		let nextSquare = position.addOffset(direction, 0);
		if (board.getPieceAt(nextSquare) === null) {
			squares.push(nextSquare);

			// If pawn is in the starting position, it can move two squares forward if the
			// squares are empty.
			if (this.color == 'white' && position.row == WHITE_PAWN_ROW || this.color == 'black' && position.row == BLACK_PAWN_ROW) {
				nextSquare = position.addOffset(direction * 2, 0);
				if (board.getPieceAt(nextSquare) === null) {
					squares.push(nextSquare);
				}
			}

		}

		// If there is an enemy piece diagonally in front of the pawn, it can move
		// diagonally to capture it.
		let leftDiagonal = position.addOffset(direction, -1);
		let otherPiece = board.getPieceAt(leftDiagonal);
		if (otherPiece && otherPiece.color !== this.color) {
			squares.push(leftDiagonal);
		}

		let rightDiagonal = position.addOffset(direction, 1);
		otherPiece = board.getPieceAt(rightDiagonal);
		if (otherPiece && otherPiece.color !== this.color) {
			squares.push(rightDiagonal);
		}

		return squares;
	}
}

class Rook extends Piece {
	constructor(color: Piece['color']) {
		super('rook', color);
	}

	availableSquares(board: Board): Position[] {
		return this.getAvaiableSquaresInDirections(board,  [
			[1, 0], // Down.
			[-1, 0], // Up.
			[0, 1], // Right.
			[0, -1] // Left.
		]);
	}
}

class Knight extends Piece {
	constructor(color: Piece['color']) {
		super('knight', color);
	}

	availableSquares(board: Board): Position[] {
		return this.getAvaiableSquaresInDirections(board, [
			[1, 2],
			[1, -2],
			[-1, 2],
			[-1, -2],
			[2, 1],
			[2, -1],
			[-2, 1],
			[-2, -1]
		], false);
	}
}

class Bishop extends Piece {
	constructor(color: Piece['color']) {
		super('bishop', color);
	}

	availableSquares(board: Board): Position[] {
		return this.getAvaiableSquaresInDirections(board, [
			[1, 1], // Down-right.
			[-1, 1], // Up-right.
			[1, -1], // Down-left.
			[-1, -1] // Up-left.
		]);
	}

}

class Queen extends Piece {
	constructor(color: Piece['color']) {
		super('queen', color);
	}

	availableSquares(board: Board): Position[] {
		return this.getAvaiableSquaresInDirections(board, [
			[1, 0], // Down.
			[-1, 0], // Up.
			[0, 1], // Right.
			[0, -1], // Left.
			[1, 1], // Down-right.
			[-1, 1], // Up-right.
			[1, -1], // Down-left.
			[-1, -1] // Up-left.
		]);
	}
}

class King extends Piece {
	constructor(color: Piece['color']) {
		super('king', color);
	}

	availableSquares(board: Board): Position[] {
		return this.getAvaiableSquaresInDirections(board, [
			[1, 0], // Down.
			[-1, 0], // Up.
			[0, 1], // Right.
			[0, -1], // Left.
			[1, 1], // Down-right.
			[-1, 1], // Up-right.
			[1, -1], // Down-left.
			[-1, -1] // Up-left.
		], false);
	}
}

class Position {
	// 0-indexed column and row.
	constructor(public readonly row: number, public readonly column: number) {}

	static fromString(position: string): Position {
		const column = COLUMNS.indexOf(position[0]);
		const row = ROWS.indexOf(Number(position[1]));
		return new Position(row, column);
	}

	// Return the position as a string, e.g. 'a1'.
	toString(): string {
		return `${COLUMNS[this.column]}${ROWS[this.row]}`;
	}

	addOffset(rowOffset: number, columnOffset: number): Position {
		return new Position(this.row + rowOffset, this.column + columnOffset);
	}

	isOnBoard(): boolean {
		return this.row >= 0 && this.row <= 7 && this.column >= 0 && this.column <= 7;
	}
}
