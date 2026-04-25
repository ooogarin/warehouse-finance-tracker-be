import { sql } from '@/core/db/client';
import type { PlatformAdminRow } from './platform-admin.type';

// Get one platform admin by user ID
export const getOneByUserId = async (userId: string): Promise<PlatformAdminRow | null> => {
  const [result] = await sql<PlatformAdminRow[]>`
    SELECT
      id,
      user_id,
      created_at::text AS created_at
    FROM platform_admins
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  return result ?? null;
};
