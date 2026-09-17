/** @type {import('next').NextConfig} */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

module.exports = {
  async rewrites() {
    return {
      // /api/* always goes to the Express server.
      beforeFiles: [
        { source: '/api/:path*', destination: `${BACKEND}/api/:path*` },
      ],
      // Anything Next.js doesn't have a page for (e.g. a short code like
      // /aB3xQ1, /aB3xQ1/verify, /aB3xQ1/go) falls through to the Express
      // redirect engine instead of 404-ing.
      fallback: [
        { source: '/:path*', destination: `${BACKEND}/:path*` },
      ],
    };
  },
};
