const API_BASE = '/api/presage';
const API_KEY = import.meta.env.VITE_PRESAGE_API_KEY;
const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export async function uploadVideo(videoBlob) {
  const headers = { 'x-api-key': API_KEY, 'Content-Type': 'application/json' };

  // Step 1: Request upload URLs
  const uploadUrlRes = await fetch(`${API_BASE}/v1/upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      file_size: videoBlob.size,
      hr_br: { to_process: true },
    }),
  });

  if (!uploadUrlRes.ok) {
    const text = await uploadUrlRes.text();
    throw new Error(`Upload URL request failed (${uploadUrlRes.status}): ${text}`);
  }

  const { id: vidId, urls, upload_id: uploadId } = await uploadUrlRes.json();

  // Step 2: Upload video chunks to presigned URLs
  const parts = [];
  let offset = 0;

  for (let i = 0; i < urls.length; i++) {
    const end = Math.min(offset + MAX_CHUNK_SIZE, videoBlob.size);
    const chunk = videoBlob.slice(offset, end);

    const putRes = await fetch(urls[i], {
      method: 'PUT',
      body: chunk,
    });

    if (!putRes.ok) {
      throw new Error(`Chunk upload failed (part ${i + 1}, status ${putRes.status})`);
    }

    const etag = putRes.headers.get('ETag');
    parts.push({ ETag: etag, PartNumber: i + 1 });
    offset = end;
  }

  // Step 3: Complete the upload
  const completeRes = await fetch(`${API_BASE}/v1/complete`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: vidId, upload_id: uploadId, parts }),
  });

  if (!completeRes.ok) {
    const text = await completeRes.text();
    throw new Error(`Upload complete failed (${completeRes.status}): ${text}`);
  }

  return vidId;
}

export async function pollForResults(vidId, { interval = 2000, timeout = 300000 } = {}) {
  const headers = { 'x-api-key': API_KEY, 'Content-Type': 'application/json' };
  const stopAt = Date.now() + timeout;

  while (Date.now() < stopAt) {
    const res = await fetch(`${API_BASE}/retrieve-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ id: vidId, reshape: false }),
    });

    if (res.status === 200) {
      return res.json();
    }

    if (res.status === 401) {
      throw new Error('Unauthorized — check your API key');
    }

    // 201 means still processing, any other status we retry
    if (res.status !== 201) {
      const text = await res.text();
      throw new Error(`Retrieve failed (${res.status}): ${text}`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Processing timed out (5 min)');
}
