import { MPHelper } from "@/lib/providers/ministry-platform";
import {
  CreateSelectionInput,
  DpSelectedRecordCreate,
  DpSelectionCreate,
  DpSelectionRecord,
  SelectionResult,
} from "@/lib/dto/selections";

export class SelectionService {
  private static instance: SelectionService;
  private mp: MPHelper | null = null;

  private constructor() {
    this.initialize();
  }

  public static async getInstance(): Promise<SelectionService> {
    if (!SelectionService.instance) {
      SelectionService.instance = new SelectionService();
      await SelectionService.instance.initialize();
    }
    return SelectionService.instance;
  }

  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  public async createSelection(input: CreateSelectionInput): Promise<SelectionResult> {
    const { selectionName, pageId, recordIds, userId } = input;

    if (!recordIds || recordIds.length === 0) {
      throw new Error("recordIds must not be empty");
    }

    const selectionHeader: DpSelectionCreate = {
      Selection_Name: selectionName,
      Record_Count: recordIds.length,
      Is_Temporary: false,
      User_ID_Owner: userId,
    };

    const selectionResult = await this.mp!.createTableRecords(
      "dp_Selections",
      [selectionHeader]
    );

    if (!selectionResult || selectionResult.length === 0) {
      throw new Error("Failed to create selection: no Selection_ID returned");
    }

    const selectionId = (selectionResult[0] as DpSelectionRecord).Selection_ID;

    if (!selectionId) {
      throw new Error("Failed to create selection: no Selection_ID returned");
    }

    const selectedRecords: DpSelectedRecordCreate[] = recordIds.map((id) => ({
      Selection_ID: selectionId,
      Record_ID: id,
    }));

    await this.mp!.createTableRecords("dp_Selected_Records", selectedRecords);

    const mpUrl = process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_URL;
    const selectionUrl = `${mpUrl}/mp/${pageId}.${selectionId}`;

    return { pageId, selectionId, selectionUrl };
  }
}
