import scanner from './scanner/index.mjs'

export const scan = async (event) => {

  let url;

  try {
    url = new URL(event.url);
  } catch (error) {
    console.error('Invalid URL:', event.url);
    return;
  }

  const email = event.email;

  const urlReachable = await fetch(url.origin, { method: 'HEAD' })
    .then(response => response.ok)
    .catch(() => false);

  if (!urlReachable) {
    return;
  }

  const results = await scanner(url);

  return await fetch('http://localhost:5173/scan/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      url: url.origin,
      results,
    }),
  }).catch(error => {
    console.error('Error submitting scan results:', error);
  });

};
