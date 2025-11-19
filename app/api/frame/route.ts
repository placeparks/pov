import { Frog, Button } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';

const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

// Initialize Frog
export const app = new Frog({
  basePath: '/api/frame',
  title: 'Proof of Voice',
  // Hub API for Frame validation (optional but recommended)
  // hub: {
  //   apiUrl: 'https://hubs.airstack.xyz',
  //   fetchOptions: {
  //     headers: {
  //       'x-airstack-hubs': process.env.AIRSTACK_API_KEY || '',
  //     },
  //   },
  // },
});

// Frame image - shows the initial preview
app.frame('/', (c) => {
  return c.res({
    image: `${ROOT_URL}/blue-hero.png`, // Your hero image
    imageAspectRatio: '1:1',
    intents: [
      <Button value="mint" action="/api/frame/mint">🎤 Mint Your Voice</Button>,
      <Button.Link href={ROOT_URL}>🌐 Open Full App</Button.Link>,
    ] as any,
  });
});

// Handle the mint button click
app.frame('/mint', (c) => {
  const { buttonValue } = c;
  const fid = c.frameData?.fid || '';
  
  // Redirect to the main app for minting
  return c.res({
    image: `${ROOT_URL}/blue-hero.png`,
    imageAspectRatio: '1:1',
    intents: [
      <Button.Link href={`${ROOT_URL}?fid=${fid}`}>🚀 Launch Proof of Voice</Button.Link>,
    ] as any,
    title: 'Proof of Voice - Mint Your Voice',
  });
});

// Serve static files
app.use('/*', serveStatic({ root: './public' }));

// Export the handler for Next.js
export const GET = (req: Request) => app.fetch(req);
export const POST = (req: Request) => app.fetch(req);

// Enable devtools in development
if (process.env.NODE_ENV === 'development') {
  devtools(app, { serveStatic });
}

