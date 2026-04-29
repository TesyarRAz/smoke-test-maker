import type { CustomComment } from '../src/types/hurl';
import { filterCommentsByAction } from '../src/processor/comment-processor';

describe('filterCommentsByAction', () => {
  test('filters by action', () => {
    const comments: CustomComment[] = [
      { action: 'output', dbType: 'postgres', dsnVariable: '{{DB1}}', query: 'SELECT 1' },
      { action: 'screenshot', dbType: 'postgres', dsnVariable: '{{DB2}}', query: '' },
      { action: 'pre-output', dbType: 'postgres', dsnVariable: '{{DB3}}', query: 'SELECT 2' },
    ];
    const filtered = filterCommentsByAction(comments, 'output');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].action).toBe('output');
  });

  test('returns empty array when none match', () => {
    const comments: CustomComment[] = [
      { action: 'screenshot', dbType: 'postgres', dsnVariable: '{{DB2}}', query: '' },
      { action: 'pre-output', dbType: 'postgres', dsnVariable: '{{DB3}}', query: 'SELECT 2' },
    ];
    const filtered = filterCommentsByAction(comments, 'output');
    expect(filtered).toHaveLength(0);
  });
});
