  // import { NestFactory } from '@nestjs/core';
  // import { AppModule } from './app.module';
  // import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

  // async function bootstrap() {
  //   const app = await NestFactory.create(AppModule);
    
  //   app.enableCors({
  //     origin: ['http://localhost:4200', 
  //             'http://10.0.0.197:4200'],// Reemplaza con la URL de tu aplicación Angular en desarrollo
  //     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //     credentials: true, // Habilita el envío de cookies de autenticación, etc.
  //   });

  //   //await app.listen(process.env.PORT ?? 3000);
  //   await app.listen(3000);
  // }
  // bootstrap();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:4200',
             'http://10.0.0.197:4300'], // Replace with the URL of your Angular development application
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable sending authentication cookies, etc.
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API-INGRESOS') // Set your API title
    .setDescription('Your API Description') // Set your API description
    .setVersion('1.0') // Set your API version
    .addTag('API-CONTROLLERS') // Optional: Add a tag for your API endpoints
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1', app, document); // Swagger UI will be at http://localhost:3000/api/v1

  await app.listen(3005);
}
bootstrap();