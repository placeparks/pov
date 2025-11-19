/** @jsxImportSource hono/jsx */
import { Frog, Button } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';

const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

const app = new Frog({
  basePath: '/api/frame',
  title: 'Proof of Voice',
});

// Root frame – hero + entry point
app.frame('/', (c) => {
  return c.res({
    image: `${ROOT_URL}/blue-hero.png`,
    imageAspectRatio: '1:1',
    // eslint-disable-next-line react/jsx-key
    intents: [
      <Button key="mint" value="mint" action="/mint">🎤 Mint Your Voice</Button>,
      <Button.Link key="open" href={ROOT_URL}>🌐 Open Full App</Button.Link>,
    ],
  });
});

// Mint frame – sends user into full app with optional fid
app.frame('/mint', (c) => {
  const fid = c.frameData?.fid || '';

  return c.res({
    image: `${ROOT_URL}/blue-hero.png`,
    imageAspectRatio: '1:1',
    title: 'Proof of Voice - Mint Your Voice',
    // eslint-disable-next-line react/jsx-key
    intents: [
      <Button.Link key="launch" href={`${ROOT_URL}?fid=${fid}`}>
        🚀 Launch Proof of Voice
      </Button.Link>,
    ],
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

