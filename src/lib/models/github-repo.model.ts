import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxJsonSchema,
} from "rxdb";

export const githubRepoSchemaLiteral = {
  title: "Github repository details",
  primaryKey: "id",
  type: "object",
  version: 1,
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    stargazers_count: {
      type: "number",
    },
  },
} as const;

const schemaTyped = toTypedRxJsonSchema(githubRepoSchemaLiteral);

export type GithubDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

export const githubRepoSchema: RxJsonSchema<GithubDocType> =
  githubRepoSchemaLiteral;
