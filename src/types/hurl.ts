export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface HurlHeader {
  name: string;
  value: string;
}

export interface HurlRequest {
  method: HttpMethod;
  url: string;
  headers?: HurlHeader[];
  body?: string;
  queryParams?: Record<string, string>;
}

export interface HurlResponse {
  status: number;
  headers?: HurlHeader[];
  body?: string;
}

export interface HurlCapture {
  name: string;
  query: string;
}

export interface HurlAssert {
  query: string;
  predicate: string;
  value?: unknown;
}

export interface HurlOptions {
  skip?: boolean;
  retry?: number;
  [key: string]: unknown;
}

export interface CustomComment {
  action: 'output' | 'screenshot' | 'pre-output' | 'post-output';
  dbType: 'postgresdb' | 'mysql' | 'mongodb' | 'testdb';
  dsnVariable: string;
  query: string;
}

export interface HurlEntry {
  index: number;
  request: HurlRequest;
  response?: HurlResponse;
  captures?: HurlCapture[];
  asserts?: HurlAssert[];
  options?: HurlOptions;
  customComments?: CustomComment[];
  skip?: boolean;
  rawContent: string;
}

export interface HurlFile {
  filename: string;
  entries: HurlEntry[];
  variables: Record<string, string>;
}
