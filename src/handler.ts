import scanner from './scanner/index.js'

export const scan = async (event: any) => {

  let url;

  try {
    url = new URL(event.url);
  } catch (error) {
    console.error('Invalid URL:', event.url);
    return;
  }

  const urlReachable = await fetch(url.origin, { method: 'HEAD' })
    .then(response => response.ok)
    .catch(() => false);

  if (!urlReachable) return;

  const results = await scanner(url);

  return await fetch('https://doodadlabs.org/scan/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: event.email,
      url: url.origin,
      results,
    }),
  }).catch(error => {
    console.error('Error submitting scan results:', error);
  });

};
