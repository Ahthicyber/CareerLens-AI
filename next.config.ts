import type { NextConfig } from 'next';
const config: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  outputFileTracingIncludes: {
    '/api/extract': [
      // PDF.js loads its worker and Node canvas implementation at runtime.
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/@napi-rs/canvas/**/*',
      './node_modules/@napi-rs/canvas-*/**/*',
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    }];
  },
};
export default config;
