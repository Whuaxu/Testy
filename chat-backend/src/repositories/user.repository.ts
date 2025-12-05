import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {User, UserRelations, Message} from '../models';
import {MessageRepository} from './message.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  public readonly sentMessages: HasManyRepositoryFactory<
    Message,
    typeof User.prototype.id
  >;

  constructor(
    @inject('datasources.mongodb') dataSource: MongodbDataSource,
    @repository.getter('MessageRepository')
    protected messageRepositoryGetter: Getter<MessageRepository>,
  ) {
    super(User, dataSource);
    this.sentMessages = this.createHasManyRepositoryFactoryFor(
      'sentMessages',
      messageRepositoryGetter,
    );
    this.registerInclusionResolver(
      'sentMessages',
      this.sentMessages.inclusionResolver,
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({where: {email}});
  }
}
