export function resolveVariables(input: string, variables: Record<string, string>): string {
  let result = input;
  
  result = result.replace(/\\\{/g, '\x00ESCAPE_OPEN\x00');
  result = result.replace(/\\\}/g, '\x00ESCAPE_CLOSE\x00');
  
  result = result.replace(/\{\{([^}]+)\}\}/g, (_, varName) => {
    const trimmed = varName.trim();
    if (variables.hasOwnProperty(trimmed)) {
      return variables[trimmed];
    }
    return `{{${trimmed}}}`;
  });
  
  result = result.replace(/\x00ESCAPE_OPEN\x00/g, '{');
  result = result.replace(/\x00ESCAPE_CLOSE\x00/g, '}');
  
  return result;
}

export function resolveDsn(dsnTemplate: string, variables: Record<string, string>): string {
  return resolveVariables(dsnTemplate, variables);
}

export function resolveQuery(query: string, variables: Record<string, string>): string {
  return resolveVariables(query, variables);
}