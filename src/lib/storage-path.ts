import path from "node:path";

type Env = Record<string, string | undefined>;

export type PersistenceKind = "volume" | "local-file";

export interface PersistenceInfo {
  kind: PersistenceKind;
  ordersPath: string;
  durable: boolean;
}

export function resolveOrdersPath(
  env: Env = process.env,
  cwd = process.cwd(),
): string {
  if (env.ORDERS_PATH?.trim()) {
    return path.resolve(cwd, env.ORDERS_PATH.trim());
  }

  const mount = env.RAILWAY_VOLUME_MOUNT_PATH?.trim() || env.DATA_DIR?.trim();
  if (mount) {
    return path.join(mount, "orders.json");
  }

  return path.join(cwd, "data", "orders.json");
}

export function getPersistenceInfo(
  env: Env = process.env,
  cwd = process.cwd(),
): PersistenceInfo {
  const ordersPath = resolveOrdersPath(env, cwd);
  const durable = Boolean(
    env.ORDERS_PATH?.trim() ||
      env.RAILWAY_VOLUME_MOUNT_PATH?.trim() ||
      env.DATA_DIR?.trim(),
  );

  return {
    kind: durable ? "volume" : "local-file",
    ordersPath,
    durable,
  };
}
