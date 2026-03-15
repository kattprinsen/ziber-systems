import { describe, it, expect } from 'vitest';
import { selectSbqLeafEmployeesFromSubtree } from '../../../src/services/syncService';
import type { TidigEmployeeNodeRaw } from '../../../src/types/sync';

describe('selectSbqLeafEmployeesFromSubtree', () => {
  it('returns direct child leaf employees of the root when no sbqId is provided', () => {
    const subtree: TidigEmployeeNodeRaw = {
      empId: 'SBQ',
      name: 'SBQ Root',
      children: [
        {
          empId: 'EMP1',
          name: 'Employee 1',
          children: null,
        },
        {
          empId: 'EMP2',
          name: 'Employee 2',
          children: [],
        },
        {
          empId: 'GROUP1',
          name: 'Group 1',
          children: [
            {
              empId: 'EMP3',
              name: 'Employee 3',
              children: null,
            },
          ],
        },
      ],
    };

    const result = selectSbqLeafEmployeesFromSubtree(subtree);

    // SBQ itself plus its direct child leaf employees
    expect(result.map((e) => e.id)).toEqual(['SBQ', 'EMP1', 'EMP2']);
  });

  it('locates a non-root SBQ node when sbqId is provided', () => {
    const subtree: TidigEmployeeNodeRaw = {
      empId: 'ROOT',
      name: 'Root',
      children: [
        {
          empId: 'SBQ',
          name: 'SBQ Node',
          children: [
            {
              empId: 'EMP4',
              name: 'Employee 4',
              children: null,
            },
            {
              empId: 'TEAM',
              name: 'Team Node',
              children: [
                {
                  empId: 'EMP5',
                  name: 'Employee 5',
                  children: null,
                },
              ],
            },
          ],
        },
      ],
    };

    const result = selectSbqLeafEmployeesFromSubtree(subtree, 'SBQ');

    // SBQ node itself plus its direct child leaf employees
    expect(result.map((e) => e.id)).toEqual(['SBQ', 'EMP4']);
  });
});
