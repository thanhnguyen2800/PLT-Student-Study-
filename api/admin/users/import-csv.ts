import adminHandler from '../[...path]';

export default async function handler(req: any, res: any) {
  req.query = { ...(req.query || {}), path: ['users', 'import-csv'] };
  return adminHandler(req, res);
}