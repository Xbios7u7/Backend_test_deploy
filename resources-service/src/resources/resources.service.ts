import { Injectable, Logger } from '@nestjs/common';
import { DatabaseCrudService } from '../crud/database-crud.service';
import { ImageStorageService } from '../media/image-storage.service';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(
    private readonly database: DatabaseCrudService,
    private readonly storage: ImageStorageService,
  ) {}

  list(query: unknown) {
    return this.database.run((store) => store.list('resources', query));
  }

  get(id: string) {
    return this.database.run((store) => store.get('resources', id));
  }

  create(body: unknown, actorId: string) {
    return this.database.run((store) =>
      store.create('resources', body, actorId),
    );
  }

  update(id: string, body: unknown) {
    return this.database.run((store) => store.update('resources', id, body));
  }

  async remove(id: string) {
    try {
      const resource = (await this.database.run((store) =>
        store.get('resources', id),
      )) as any;
      if (resource?.imageS3Bucket && resource?.imageS3Key) {
        await this.storage
          .remove('resources', id, {
            bucket: resource.imageS3Bucket,
            key: resource.imageS3Key,
          })
          .catch((err) => {
            this.logger.warn(`No se pudo eliminar la imagen de S3 para el recurso ${id}: ${err.message}`);
          });
      }
      if (resource?.s3Bucket && resource?.s3Key) {
        await this.storage
          .removeFile(id, {
            bucket: resource.s3Bucket,
            key: resource.s3Key,
          })
          .catch((err) => {
            this.logger.warn(`No se pudo eliminar el archivo de S3 para el recurso ${id}: ${err.message}`);
          });
      }
    } catch {
      // Si el recurso no existe, store.remove arrojará la excepción correspondiente
    }
    return this.database.run((store) => store.remove('resources', id));
  }
}
