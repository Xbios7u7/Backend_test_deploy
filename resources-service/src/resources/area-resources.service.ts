import { Injectable, Logger } from '@nestjs/common';
import { DatabaseCrudService } from '../crud/database-crud.service';
import { ImageStorageService } from '../media/image-storage.service';

@Injectable()
export class AreaResourcesService {
  private readonly logger = new Logger(AreaResourcesService.name);

  constructor(
    private readonly database: DatabaseCrudService,
    private readonly storage: ImageStorageService,
  ) {}

  list(actorId: string, area: string, query: unknown) {
    return this.database.runArea((store) =>
      store.list('resources', actorId, area, query),
    );
  }

  get(actorId: string, area: string, id: string) {
    return this.database.runArea((store) =>
      store.get('resources', actorId, area, id),
    );
  }

  create(actorId: string, area: string, body: unknown) {
    return this.database.runArea((store) =>
      store.create('resources', actorId, area, body),
    );
  }

  update(actorId: string, area: string, id: string, body: unknown) {
    return this.database.runArea((store) =>
      store.update('resources', actorId, area, id, body),
    );
  }

  async remove(actorId: string, area: string, id: string) {
    try {
      const resource = (await this.database.runArea((store) =>
        store.get('resources', actorId, area, id),
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
      // Ignorar si falla la lectura previa para que store.remove maneje las reglas y permisos
    }
    return this.database.runArea((store) =>
      store.remove('resources', actorId, area, id),
    );
  }
}
