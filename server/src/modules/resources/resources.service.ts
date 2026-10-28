import { ResourceRepository } from './resources.repository.js';
import { NotFoundError } from '../../common/errors/app-error.js';
import { ICloudStorageService } from '../drive/drive.interface.js';

export class ResourcesService {
  constructor(
    private resourceRepo: ResourceRepository,
    private storageService: ICloudStorageService
  ) {}

  async listResources(category?: string) {
    return this.resourceRepo.findAll(category);
  }

  async getResourceDetail(id: string) {
    const resource = await this.resourceRepo.findById(id);
    if (!resource) throw new NotFoundError('Tài nguyên không tồn tại');
    return resource;
  }

  async getDownloadLink(id: string, userId: string) {
    const resource = await this.resourceRepo.findById(id);
    if (!resource) throw new NotFoundError('Tài nguyên không tồn tại');

    await this.resourceRepo.incrementDownloadCount(id);
    const downloadUrl = await this.storageService.getSignedStreamUrl(resource.driveFileId, userId);

    return {
      resourceId: resource.id,
      title: resource.title,
      downloadUrl,
      fileSizeMb: resource.fileSizeMb,
      format: resource.format,
    };
  }
}
