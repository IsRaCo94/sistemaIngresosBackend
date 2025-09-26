// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class AppService {
//   getHello(): string {
//     return 'Hello World!';
//   }
// }
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {
    console.log('DB_HOST:', process.env.DB_HOST);
  }

  getHello(): string {
    return 'Hello World!';
  }
}