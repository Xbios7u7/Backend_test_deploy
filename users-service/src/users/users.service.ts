import { Injectable, Logger } from '@nestjs/common';
import { DatabaseCrudService } from '../crud/database-crud.service';
import { ImageStorageService } from '../media/image-storage.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly database: DatabaseCrudService,
    private readonly storage: ImageStorageService,
  ) {}

  list(query: unknown) {
    return this.database.run((store) => store.list('users', query));
  }

  get(id: string) {
    return this.database.run((store) => store.get('users', id));
  }

  create(body: unknown, actorId: string) {
    return this.database.run((store) => store.create('users', body, actorId));
  }

  update(id: string, body: unknown) {
    return this.database.run((store) => store.update('users', id, body));
  }

  async remove(id: string) {
    try {
      const user = (await this.database.run((store) => store.get('users', id))) as any;
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
      // Si el usuario no existe, store.remove arrojará la excepción correspondiente
    }
    return this.database.run((store) => store.remove('users', id));
  }
}
