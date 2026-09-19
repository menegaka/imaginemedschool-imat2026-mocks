// netlify/functions/readiness.mjs
// Persistent store for the IMAT Readiness Challenge.
// GET  /.netlify/functions/readiness        -> { counts, total, avg, shares, sources }
// POST /.netlify/functions/readiness        -> { type:"vote", score, source } | { type:"share", network }
//
// Storage: Netlify Blobs (needs "@netlify/blobs" in package.json dependencies).

import { getStore } from "@netlify/blobs";

const KEY = "stats-v1";

// The 46 baseline answers, so the very first visitor never sees an empty chart.
const SEED_COUNTS = { 1: 1, 2: 1, 3: 10, 4: 6, 5: 2, 6: 5, 7: 10, 8: 1, 9: 3, 10: 7 };

const JSON_HEADERS = {
  "content-type": "application/json",
  "cache-control": "no-store",
  "access-control-allow-origin": "*"
};

function blank() {
  return { counts: { ...SEED_COUNTS }, shares: {}, sources: {}, votes: 0, seeded: 46, updated: null };
}

function clean(v, max = 60) {
  if (typeof v !== "string") return "unknown";
  const s = v.trim().toLowerCase().replace(/[^a-z0-9._\-/: ]+/g, "").slice(0, max);
  return s || "unknown";
}

function summary(d) {
  let total = 0;
  let weighted = 0;
  for (let i = 1; i <= 10; i++) {
    const n = d.counts[i] || 0;
    total += n;
    weighted += n * i;
  }
  return {
    counts: d.counts,
    total,
    avg: total ? Math.round((weighted / total) * 10) / 10 : 0,
    realVotes: d.votes || 0,
    shares: d.shares || {},
    sources: d.sources || {},
    updated: d.updated
  };
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 204,
      headers: {
        ...JSON_HEADERS,
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type"
      }
    });
  }

  let store;
  try {
    store = getStore({ name: "imat-readiness", consistency: "strong" });
  } catch (err) {
    return new Response(JSON.stringify({ error: "store-unavailable" }), { status: 500, headers: JSON_HEADERS });
  }

  let data;
  try {
    data = (await store.get(KEY, { type: "json" })) || blank();
  } catch {
    data = blank();
  }
  if (!data.counts) data = blank();

  if (req.method === "GET") {
    return new Response(JSON.stringify(summary(data)), { headers: JSON_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method-not-allowed" }), { status: 405, headers: JSON_HEADERS });
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "bad-json" }), { status: 400, headers: JSON_HEADERS });
  }

  if (body.type === "vote") {
    const score = Math.round(Number(body.score));
    if (!(score >= 1 && score <= 10)) {
      return new Response(JSON.stringify({ error: "bad-score" }), { status: 400, headers: JSON_HEADERS });
    }
    data.counts[score] = (data.counts[score] || 0) + 1;
    data.votes = (data.votes || 0) + 1;
    const src = clean(body.source);
    data.sources[src] = (data.sources[src] || 0) + 1;
  } else if (body.type === "share") {
    const net = clean(body.network, 20);
    data.shares[net] = (data.shares[net] || 0) + 1;
  } else {
    return new Response(JSON.stringify({ error: "bad-type" }), { status: 400, headers: JSON_HEADERS });
  }

  data.updated = new Date().toISOString();

  try {
    await store.setJSON(KEY, data);
  } catch {
    return new Response(JSON.stringify({ error: "write-failed", ...summary(data) }), { status: 500, headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify(summary(data)), { headers: JSON_HEADERS });
};
