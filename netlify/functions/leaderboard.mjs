import { getStore } from "@netlify/blobs";

const SEED_SCORES = {
  "imat-mock-01": [23.5,67.2,84.3,78.6,88.1,42.5,44.4,50.1,40.6,63.4,38.7,34.9,52.0,15.9,31.1,12.1,27.3,44.4,19.7,46.3,40.6,33.0,44.4,34.9,67.2,34.9,78.6,71.0,31.1,14.0,40.6,46.3,19.7],
  "imat-mock-02": [50.1,74.8,84.3,84.3,88.1,44.4,48.2,31.1,21.6,55.8,23.5,67.2,36.8,59.6,59.6,65.3,19.7,67.2,67.2,50.1,59.6,12.1,34.7,8.3,57.7,29.2,27.3,14.0,25.4,46.3,29.2,-1.2,40.6],
  "imat-mock-03": [46.3,76.7,88.1,86.2,88.1,65.3,80.5,12.1,52.0,19.7,17.8,36.8,50.1,36.8,52.0,38.7,25.4,46.3,48.2,34.9,33.0,57.7,73.3,27.3,40.6,44.4,38.7,21.6,40.6,36.8,27.3,42.5,27.3]
};

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  },
  body: JSON.stringify(body)
});

function cleanId(value, fallback = "") {
  return String(value ?? fallback)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 120);
}

async function loadRealScores(store, testId) {
  const prefix = `result:${testId}:`;
  const listed = await store.list({ prefix });
  const rows = [];

  for (const blob of listed.blobs || []) {
    try {
      const row = await store.get(blob.key, { type: "json" });
      if (row && Number.isFinite(Number(row.score))) {
        rows.push(row);
      }
    } catch (_) {}
  }

  return rows;
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POST only" }),
      {
        status: 405,
        headers: { "content-type": "application/json" }
      }
    );
  }

  try {
    const body = await req.json();

    const action = body.action === "record" ? "record" : "rank";
    const testId = cleanId(body.test_id);
    const participantId = cleanId(body.participant_id);
    const score = Number(body.score);

    if (!testId || !Number.isFinite(score)) {
      return new Response(
        JSON.stringify({ error: "Invalid test_id or score" }),
        {
          status: 400,
          headers: { "content-type": "application/json" }
        }
      );
    }

    const store = getStore("imat-live-ranking-v1");

    if (action === "record") {
      if (!participantId) {
        return new Response(
          JSON.stringify({ error: "participant_id required" }),
          {
            status: 400,
            headers: { "content-type": "application/json" }
          }
        );
      }

      const key = `result:${testId}:${participantId}`;

      const existing = await store
        .get(key, { type: "json" })
        .catch(() => null);

      const row = {
        record_type: "real_user",
        source: "live_submission",
        test_id: testId,
        participant_id: participantId,
        score,
        correct: Number(body.correct || 0),
        wrong: Number(body.wrong || 0),
        blank: Number(body.blank || 0),
        first_submitted_at:
          existing?.first_submitted_at || new Date().toISOString(),
        latest_submitted_at: new Date().toISOString()
      };

      await store.setJSON(key, row);
    }

    const realRows = await loadRealScores(store, testId);
    const realScores = realRows.map((x) => Number(x.score));
    const seeds = SEED_SCORES[testId] || [];

    const pool = [...seeds, ...realScores];

    const alreadyStored =
      participantId &&
      realRows.some((x) => x.participant_id === participantId);

    const effectivePool = alreadyStored
      ? pool
      : [...pool, score];

    const rank =
      1 + effectivePool.filter((s) => s > score).length;

    const avg = effectivePool.length
      ? effectivePool.reduce((a, b) => a + b, 0) / effectivePool.length
      : score;

    return new Response(
      JSON.stringify({
        rank,
        total: effectivePool.length,
        average_score: Math.round(avg * 10) / 10,
        real_count: realRows.length,
        seed_count: seeds.length,
        data_sources: {
          real: "netlify_blobs",
          seed: "internal_benchmark"
        }
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        }
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Ranking service unavailable" }),
      {
        status: 500,
        headers: { "content-type": "application/json" }
      }
    );
  }
};
