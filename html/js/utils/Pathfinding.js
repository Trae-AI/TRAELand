// Copyright (c) 2026 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT
class Pathfinding {
    constructor(grid) {
        this.grid = grid;
        this.width = grid[0] ? grid[0].length : 0;
        this.height = grid.length;
        this.directions = [
            { x: -1, y: -1, cost: Math.SQRT2 },
            { x: 0, y: -1, cost: 1 },
            { x: 1, y: -1, cost: Math.SQRT2 },
            { x: -1, y: 0, cost: 1 },
            { x: 1, y: 0, cost: 1 },
            { x: -1, y: 1, cost: Math.SQRT2 },
            { x: 0, y: 1, cost: 1 },
            { x: 1, y: 1, cost: Math.SQRT2 }
        ];
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return false;
        }
        return this.grid[y][x] === 0;
    }

    heuristic(a, b) {
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
    }

    findPath(startX, startY, endX, endY) {
        const start = { x: startX, y: startY };
        const end = { x: endX, y: endY };

        if (!this.isWalkable(end.x, end.y)) {
            return null;
        }

        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${start.x},${start.y}`;
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, end));
        openSet.push(start);

        while (openSet.length > 0) {
            openSet.sort((a, b) => {
                const fA = fScore.get(`${a.x},${a.y}`) || Infinity;
                const fB = fScore.get(`${b.x},${b.y}`) || Infinity;
                return fA - fB;
            });

            const current = openSet.shift();
            const currentKey = `${current.x},${current.y}`;

            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }

            closedSet.add(currentKey);

            for (const dir of this.directions) {
                const neighbor = { x: current.x + dir.x, y: current.y + dir.y };
                const neighborKey = `${neighbor.x},${neighbor.y}`;

                if (closedSet.has(neighborKey)) {
                    continue;
                }

                if (!this.isWalkable(neighbor.x, neighbor.y)) {
                    continue;
                }

                if (dir.x !== 0 && dir.y !== 0) {
                    if (!this.isWalkable(current.x + dir.x, current.y) || 
                        !this.isWalkable(current.x, current.y + dir.y)) {
                        continue;
                    }
                }

                const tentativeGScore = (gScore.get(currentKey) || 0) + dir.cost;

                if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }

                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, end));
            }
        }

        return null;
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = `${current.x},${current.y}`;

        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            path.unshift(current);
            currentKey = `${current.x},${current.y}`;
        }

        if (path.length > 1) {
            path.shift();
        }

        return path;
    }
}

export default Pathfinding;
