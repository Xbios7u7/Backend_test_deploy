import { Injectable, Logger } from '@nestjs/common';
import { DatabaseCrudService } from '../crud/database-crud.service';
import { ImageStorageService } from '../media/image-storage.service';

@Injectable()
export class AreaUsersService {
  private readonly logger = new Logger(AreaUsersService.name);

  constructor(
    private readonly database: DatabaseCrudService,
    private readonly storage: ImageStorageService,
  ) {}

  list(actorId: string, area: string, query: unknown) {
    return this.database.runArea((store) =>
      store.list('users', actorId, area, query),
    );
  }

  get(actorId: string, area: string, id: string) {
    return this.database.runArea((store) =>
      store.get('users', actorId, area, id),
    );
  }

  create(actorId: string, area: string, body: unknown) {
    return this.database.runArea((store) =>
      store.create('users', actorId, area, body),
    );
  }

  update(actorId: string, area: string, id: string, body: unknown) {
    return this.database.runArea((store) =>
      store.update('users', actorId, area, id, body),
    );
  }

  async remove(actorId: string, area: string, id: string) {
    try {
      const user = (await this.database.runArea((store) =>
        store.get('users', actorId, area, id),
      )) as any;
      if (user?.avatarS3Bucket && user?.avatarS3Key) {
        await this.storage
          .remove('users', id, {
            bucket: user.avatarS3Bucket,
            key: user.avatarS3Key,
          })
          .catch((err) => {
            this.logger.warn(`No se pudo eliminar el avatar de S3 para el usuario ${id}: ${err.message}`);
          });
      }
    } catch {
      // Ignorar si falla la lectura previa para que store.remove maneje las reglas y permisos
    }
    return this.database.runArea((store) =>
      store.remove('users', actorId, area, id),
    );
  }
}
