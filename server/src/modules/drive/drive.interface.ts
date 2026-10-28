export interface StorageGrantResult {
  permissionId: string;
  targetId: string;
  grantedToEmail: string;
  role: 'reader' | 'writer';
  copyRequiresWriterPermission: boolean;
}

export interface StorageMetadata {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
}

/**
 * Interface cho dịch vụ lưu trữ đám mây (Cloud Storage Provider).
 * Senior note: Áp dụng nguyên lý Dependency Inversion Principle (DIP trong SOLID).
 * Nghiệp vụ đơn hàng (Order/Payment Service) chỉ phụ thuộc vào Interface này,
 * không phụ thuộc trực tiếp vào Google Drive SDK. Khi cần đổi sang AWS S3 hoặc Cloudflare R2,
 * chỉ cần viết Adapter mới mà không cần chạm vào một dòng code nghiệp vụ nào!
 */
export interface ICloudStorageService {
  /**
   * Cấp quyền đọc file/folder cho email người mua
   */
  grantAccess(fileOrFolderId: string, userEmail: string): Promise<StorageGrantResult>;

  /**
   * Thu hồi quyền khi hoàn tiền hoặc hết hạn
   */
  revokeAccess(fileOrFolderId: string, permissionId: string): Promise<boolean>;

  /**
   * Sinh URL hoặc Token stream bảo mật
   */
  getSignedStreamUrl(fileId: string, userId: string, ttlMinutes?: number): Promise<string>;

  /**
   * Lấy thông tin metadata của file
   */
  getFileMetadata(fileId: string): Promise<StorageMetadata>;
}
