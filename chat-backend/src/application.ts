import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingScope} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import {
  AuthenticationComponent,
  registerAuthenticationStrategy,
} from '@loopback/authentication';
import {JWTAuthenticationStrategy} from './authentication/jwt-strategy';
import path from 'path';
import {MySequence} from './sequence';
import {CustomUserService} from './services/user.service';
import {JWTService} from './services/jwt.service';

export {ApplicationConfig};

export class ChatBackendApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    // Set up authentication
    this.component(AuthenticationComponent);
    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);

    // Bind JWT configuration
    this.bind('authentication.jwt.secret').to(
      process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    );
    this.bind('authentication.jwt.expiresIn').to(
      process.env.JWT_EXPIRES_IN || '86400', // 24 hours in seconds
    );

    // Bind services
    this.bind('services.CustomUserService')
      .toClass(CustomUserService)
      .inScope(BindingScope.TRANSIENT);
    this.bind('services.JWTService')
      .toClass(JWTService)
      .inScope(BindingScope.SINGLETON);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }
}
