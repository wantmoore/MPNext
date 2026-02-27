import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SelectionService } from '@/services/selectionService';

const mockCreateTableRecords = vi.fn();

vi.mock('@/lib/providers/ministry-platform', () => {
  return {
    MPHelper: class {
      createTableRecords = mockCreateTableRecords;
    },
  };
});

describe('SelectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SelectionService as any).instance = undefined;
    process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_URL = 'https://my.grangerchurch.com';
  });

  describe('getInstance', () => {
    it('should return a singleton instance', async () => {
      const instance1 = await SelectionService.getInstance();
      const instance2 = await SelectionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createSelection', () => {
    it('should throw when recordIds is empty', async () => {
      const service = await SelectionService.getInstance();
      await expect(
        service.createSelection({
          selectionName: 'Test',
          pageId: 292,
          recordIds: [],
          userId: 1,
        })
      ).rejects.toThrow('recordIds must not be empty');
    });

    it('should call dp_Selections first then dp_Selected_Records', async () => {
      mockCreateTableRecords
        .mockResolvedValueOnce([{ Selection_ID: 138291, Selection_Name: 'Test', Record_Count: 2, Is_Temporary: false, User_ID_Owner: 42 }])
        .mockResolvedValueOnce([{}, {}]);

      const service = await SelectionService.getInstance();
      await service.createSelection({
        selectionName: 'Test Selection',
        pageId: 292,
        recordIds: [10, 20],
        userId: 42,
      });

      expect(mockCreateTableRecords).toHaveBeenCalledTimes(2);
      expect(mockCreateTableRecords).toHaveBeenNthCalledWith(1, 'dp_Selections', [
        {
          Selection_Name: 'Test Selection',
          Record_Count: 2,
          Is_Temporary: false,
          User_ID_Owner: 42,
        },
      ]);
      expect(mockCreateTableRecords).toHaveBeenNthCalledWith(2, 'dp_Selected_Records', [
        { Selection_ID: 138291, Record_ID: 10 },
        { Selection_ID: 138291, Record_ID: 20 },
      ]);
    });

    it('should build the correct selectionUrl from NEXT_PUBLIC_MINISTRY_PLATFORM_URL', async () => {
      mockCreateTableRecords
        .mockResolvedValueOnce([{ Selection_ID: 138291 }])
        .mockResolvedValueOnce([{}]);

      const service = await SelectionService.getInstance();
      const result = await service.createSelection({
        selectionName: 'Test',
        pageId: 292,
        recordIds: [1],
        userId: 1,
      });

      expect(result.selectionUrl).toBe('https://my.grangerchurch.com/mp/292.138291');
      expect(result.pageId).toBe(292);
      expect(result.selectionId).toBe(138291);
    });

    it('should throw when MP returns no Selection_ID', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([{}]);

      const service = await SelectionService.getInstance();
      await expect(
        service.createSelection({
          selectionName: 'Test',
          pageId: 292,
          recordIds: [1],
          userId: 1,
        })
      ).rejects.toThrow('Failed to create selection: no Selection_ID returned');
    });

    it('should throw when MP returns empty array for dp_Selections', async () => {
      mockCreateTableRecords.mockResolvedValueOnce([]);

      const service = await SelectionService.getInstance();
      await expect(
        service.createSelection({
          selectionName: 'Test',
          pageId: 292,
          recordIds: [1],
          userId: 1,
        })
      ).rejects.toThrow('Failed to create selection: no Selection_ID returned');
    });

    it('should propagate errors from the bulk insert call', async () => {
      mockCreateTableRecords
        .mockResolvedValueOnce([{ Selection_ID: 999 }])
        .mockRejectedValueOnce(new Error('Bulk insert failed'));

      const service = await SelectionService.getInstance();
      await expect(
        service.createSelection({
          selectionName: 'Test',
          pageId: 292,
          recordIds: [1, 2, 3],
          userId: 1,
        })
      ).rejects.toThrow('Bulk insert failed');
    });

    it('should use the Selection_ID from dp_Selections for all dp_Selected_Records rows', async () => {
      const selectionId = 55555;
      mockCreateTableRecords
        .mockResolvedValueOnce([{ Selection_ID: selectionId }])
        .mockResolvedValueOnce([{}, {}, {}]);

      const service = await SelectionService.getInstance();
      await service.createSelection({
        selectionName: 'Test',
        pageId: 292,
        recordIds: [100, 200, 300],
        userId: 5,
      });

      const secondCall = mockCreateTableRecords.mock.calls[1];
      const selectedRecords = secondCall[1] as Array<{ Selection_ID: number; Record_ID: number }>;
      expect(selectedRecords).toHaveLength(3);
      selectedRecords.forEach((row) => {
        expect(row.Selection_ID).toBe(selectionId);
      });
      expect(selectedRecords.map((r) => r.Record_ID)).toEqual([100, 200, 300]);
    });
  });
});
