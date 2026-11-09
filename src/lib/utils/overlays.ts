// The single OBS browser source. Every on-air graphic is a layer on this one page.
export const OVERLAY_PATH = '/overlay';

export const OVERLAY_GRID_TRACKS = 12;

export type OverlayAnchor = 'start' | 'center' | 'end';

export const OVERLAY_ANCHORS: readonly OverlayAnchor[] = ['start', 'center', 'end'];

// A zero-based area of the overlay grid, measured in tracks.
export interface GridRect {
	column: number;
	row: number;
	columns: number;
	rows: number;
}

export function formatShowClock(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds % 60);
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Where a span of tracks starts when placed at an anchor.
export function getGridOffset(anchor: OverlayAnchor, span: number): number {
	const freeTracks = OVERLAY_GRID_TRACKS - span;
	const offsets: Record<OverlayAnchor, number> = {
		start: 0,
		center: Math.floor(freeTracks / 2),
		end: freeTracks
	};
	return offsets[anchor];
}

function getCells(rect: GridRect): string[] {
	const cells: string[] = [];
	for (let column = rect.column; column < rect.column + rect.columns; column += 1) {
		for (let row = rect.row; row < rect.row + rect.rows; row += 1) {
			cells.push(`${column}:${row}`);
		}
	}
	return cells;
}

// The tracks lying directly between two rects that share rows or columns.
function getCorridors(a: GridRect, b: GridRect): GridRect[] {
	const corridors: GridRect[] = [];
	const column = Math.max(a.column, b.column);
	const columnEnd = Math.min(a.column + a.columns, b.column + b.columns);
	const row = Math.max(a.row, b.row);
	const rowEnd = Math.min(a.row + a.rows, b.row + b.rows);
	if (columnEnd > column) {
		const gapStart = Math.min(a.row + a.rows, b.row + b.rows);
		const gapEnd = Math.max(a.row, b.row);
		if (gapEnd > gapStart) {
			corridors.push({
				column,
				row: gapStart,
				columns: columnEnd - column,
				rows: gapEnd - gapStart
			});
		}
	}
	if (rowEnd > row) {
		const gapStart = Math.min(a.column + a.columns, b.column + b.columns);
		const gapEnd = Math.max(a.column, b.column);
		if (gapEnd > gapStart) {
			corridors.push({ column: gapStart, row, columns: gapEnd - gapStart, rows: rowEnd - row });
		}
	}
	return corridors;
}

// Each way a rect can grow by one track: the new line of cells and the resulting rect.
const GROWTH_STEPS: readonly ((rect: GridRect) => { line: GridRect; grown: GridRect })[] = [
	(rect) => ({
		line: { ...rect, row: rect.row - 1, rows: 1 },
		grown: { ...rect, row: rect.row - 1, rows: rect.rows + 1 }
	}),
	(rect) => ({
		line: { ...rect, row: rect.row + rect.rows, rows: 1 },
		grown: { ...rect, rows: rect.rows + 1 }
	}),
	(rect) => ({
		line: { ...rect, column: rect.column - 1, columns: 1 },
		grown: { ...rect, column: rect.column - 1, columns: rect.columns + 1 }
	}),
	(rect) => ({
		line: { ...rect, column: rect.column + rect.columns, columns: 1 },
		grown: { ...rect, columns: rect.columns + 1 }
	})
];

// Grows visible rects into the space hidden rects vacated, one track at a time so neighbours
// share it evenly. Space that was never occupied by a hidden rect stays empty.
export function fillVacatedSpace<T extends string>(
	rects: Record<T, GridRect>,
	visible: readonly T[]
): Record<T, GridRect> {
	const ids = Object.keys(rects) as T[];
	const hidden = ids.filter((id) => !visible.includes(id));
	const filled = { ...rects };
	const vacated = new Set<string>();

	for (const hiddenId of hidden) {
		getCells(rects[hiddenId]).forEach((cell) => vacated.add(cell));
		for (const visibleId of visible) {
			getCorridors(rects[hiddenId], rects[visibleId])
				.flatMap(getCells)
				.forEach((cell) => vacated.add(cell));
		}
	}
	for (const visibleId of visible) {
		getCells(rects[visibleId]).forEach((cell) => vacated.delete(cell));
	}

	let didGrow = true;
	while (didGrow) {
		didGrow = false;
		for (const id of visible) {
			for (const step of GROWTH_STEPS) {
				const { line, grown } = step(filled[id]);
				const cells = getCells(line);
				if (cells.every((cell) => vacated.has(cell))) {
					cells.forEach((cell) => vacated.delete(cell));
					filled[id] = grown;
					didGrow = true;
				}
			}
		}
	}

	return filled;
}
