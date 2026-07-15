import { logger } from "./logger";

export async function seedIfEmpty(): Promise<void> {
  logger.info("Seed skipped — farms require an authenticated owner");
}
