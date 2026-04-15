import { z } from "zod";

const envSchema = z.object({
  LINE_CHANNEL_SECRET: z.string().min(1, "LINE_CHANNEL_SECRET is required"),
  LINE_CHANNEL_ACCESS_TOKEN: z
    .string()
    .min(1, "LINE_CHANNEL_ACCESS_TOKEN is required"),
  LINE_ALLOWED_USER_IDS: z.string().min(1, "LINE_ALLOWED_USER_IDS is required"),
  TODOIST_API_TOKEN: z.string().min(1, "TODOIST_API_TOKEN is required"),
  TODOIST_PROJECT_ID: z.string().min(1, "TODOIST_PROJECT_ID is required"),
  TODOIST_SECTION_IDS: z.string().min(1, "TODOIST_SECTION_IDS is required"),
  TODOIST_SECTION_NAMES: z.string().min(1, "TODOIST_SECTION_NAMES is required"),
  PORT: z.coerce.number().int().positive().default(3000),
  LIST_STATE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(900)
});

export type AppConfig = {
  line: {
    channelSecret: string;
    channelAccessToken: string;
    allowedUserIds: string[];
  };
  todoist: {
    apiToken: string;
    projectId: string;
    sections: Array<{
      id: string;
      name: string;
    }>;
  };
  server: {
    port: number;
    listStateTtlSeconds: number;
  };
};

const splitCsv = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const formatIssues = (issues: z.core.$ZodIssue[]): string =>
  issues.map((issue) => issue.message).join(", ");

export const createConfig = (rawEnv: Record<string, string | undefined>): AppConfig => {
  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${formatIssues(parsed.error.issues)}`);
  }

  const allowedUserIds = splitCsv(parsed.data.LINE_ALLOWED_USER_IDS);
  const sectionIds = splitCsv(parsed.data.TODOIST_SECTION_IDS);
  const sectionNames = splitCsv(parsed.data.TODOIST_SECTION_NAMES);

  if (allowedUserIds.length === 0) {
    throw new Error("Invalid environment variables: LINE_ALLOWED_USER_IDS must contain at least one user ID");
  }

  if (sectionIds.length === 0) {
    throw new Error("Invalid environment variables: TODOIST_SECTION_IDS must contain at least one section ID");
  }

  if (sectionIds.length !== sectionNames.length) {
    throw new Error("Invalid environment variables: TODOIST_SECTION_NAMES and TODOIST_SECTION_IDS must have the same number of entries");
  }

  return {
    line: {
      channelSecret: parsed.data.LINE_CHANNEL_SECRET,
      channelAccessToken: parsed.data.LINE_CHANNEL_ACCESS_TOKEN,
      allowedUserIds
    },
    todoist: {
      apiToken: parsed.data.TODOIST_API_TOKEN,
      projectId: parsed.data.TODOIST_PROJECT_ID,
      sections: sectionIds.map((id, index) => ({
        id,
        name: sectionNames[index] ?? id
      }))
    },
    server: {
      port: parsed.data.PORT,
      listStateTtlSeconds: parsed.data.LIST_STATE_TTL_SECONDS
    }
  };
};

export const loadConfig = (): AppConfig => createConfig(process.env);
