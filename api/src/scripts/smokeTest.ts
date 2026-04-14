import { initDb } from "../db/initDb";
import pool from "../db/pool";
import { createGrid, getAllFrames, getFrame } from "../services/gridService";

async function run(): Promise<void> {
    await initDb();

    const created = await createGrid({ width: 3, height: 2, name: "smoke-grid" });
    const allFrames = await getAllFrames(created.grid.id);
    const frame = await getFrame(created.grid.id, 1, 1);

    console.log(
        JSON.stringify(
            {
                gridId: created.grid.id,
                totalFrames: allFrames.frames.length,
                sampleFrame: { x: frame.x, y: frame.y, color: frame.color },
            },
            null,
            2,
        ),
    );

    await pool.end();
}

void run();

