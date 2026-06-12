// Route segment config para optimización de caching
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config

export const dynamic = 'auto'; // Permite ISR donde es posible
export const revalidate = 60; // Revalidate cada 60 segundos
export const fetchCache = 'auto'; // Cache según defaults de Next.js
