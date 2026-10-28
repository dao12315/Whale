import { ICloudStorageService, StorageGrantResult, StorageMetadata } from './drive.interface.js';
import { CryptoUtil } from '../../common/utils/crypto.js';

export class MockDriveStorageAdapter implements ICloudStorageService {
  public grantedPermissions: Map<string, { fileId: string; email: string }> = new Map();
  public revokedPermissions: string[] = [];

  async grantAccess(fileOrFolderId: string, userEmail: string): Promise<StorageGrantResult> {
    const permissionId = `perm_mock_${CryptoUtil.randomString(8)}`;
    this.grantedPermissions.set(permissionId, { fileId: fileOrFolderId, email: userEmail });
    return {
      permissionId,
      targetId: fileOrFolderId,
      grantedToEmail: userEmail,
      role: 'reader',
      copyRequiresWriterPermission: true,
    };
  }

  async revokeAccess(fileOrFolderId: string, permissionId: string): Promise<boolean> {
    if (this.grantedPermissions.has(permissionId)) {
      this.grantedPermissions.delete(permissionId);
    }
    this.revokedPermissions.push(permissionId);
    return true;
  }

  async getSignedStreamUrl(fileId: string, userId: string): Promise<string> {
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }

  async getFileMetadata(fileId: string): Promise<StorageMetadata> {
    return {
      id: fileId,
      name: `Resource_File_${fileId}.psd`,
      mimeType: 'image/vnd.adobe.photoshop',
      sizeBytes: 1024 * 1024 * 150,
    };
  }

  public clear(): void {
    this.grantedPermissions.clear();
    this.revokedPermissions = [];
  }
}

export const defaultDriveService = new MockDriveStorageAdapter();
