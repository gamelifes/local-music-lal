import { registerPlugin } from '@capacitor/core'

export interface FolderPickerResult {
  path: string
  folderName: string
  uri: string
}

export interface FolderPickerPlugin {
  pickFolder(): Promise<FolderPickerResult>
}

const FolderPicker = registerPlugin<FolderPickerPlugin>('FolderPicker')

export { FolderPicker }
