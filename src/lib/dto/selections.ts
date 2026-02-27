export interface DpSelectionCreate {
  [key: string]: unknown;
  Selection_Name: string;
  Record_Count: number;
  Is_Temporary: boolean;
  User_ID_Owner: number;
}

export interface DpSelectionRecord {
  [key: string]: unknown;
  Selection_ID: number;
  Selection_Name: string;
  Record_Count: number;
  Is_Temporary: boolean;
  User_ID_Owner: number;
}

export interface DpSelectedRecordCreate {
  [key: string]: unknown;
  Selection_ID: number;
  Record_ID: number;
}

export interface SelectionResult {
  pageId: number;
  selectionId: number;
  selectionUrl: string;
}

export interface CreateSelectionInput {
  selectionName: string;
  pageId: number;
  recordIds: number[];
  userId: number;
}
