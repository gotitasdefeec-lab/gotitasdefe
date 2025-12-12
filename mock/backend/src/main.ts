import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  // Increase payload size limit
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  // Allow localhost and any ngrok subdomains by default. You can override with CORS_ORIGINS env (comma-separated).
  const defaultCorsOrigins: (string | RegExp)[] = [
    'http://localhost:3000', // Admin
    'http://localhost:3001', // Storefront
    'https://ejemplo-tienda.ngrok.dev', // Storefront ngrok
    'https://administrador-clementine.ngrok.app', // Admin ngrok
    'https://gotitasdefe-tienda.vercel.app', // Storefront Vercel
    'https://gotasdefe.com', // Dominio principal
    'https://www.gotasdefe.com', // Dominio principal www
    /^https:\/\/[a-z0-9-]+\.ngrok\.app$/, // any ngrok.app subdomain
    /^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/, // any ngrok-free.dev subdomain
    /^https:\/\/[a-z0-9.-]+\.ngrok\.dev$/, // any ngrok.dev subdomain (con puntos)
  ];

  const envCorsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g., curl, server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed = [...defaultCorsOrigins, ...envCorsOrigins].some((allowed) => {
        if (allowed instanceof RegExp) return allowed.test(origin);
        return allowed === origin;
      });

      return isAllowed ? callback(null, true) : callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'ngrok-skip-browser-warning', 'X-Skip-Auth-Redirect'],
    optionsSuccessStatus: 204,
  });

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('E-commerce Admin API')
    .setDescription('Backend API for e-commerce administration panel')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('products', 'Product management')
    .addTag('inventory', 'Inventory management')
    .addTag('sales', 'Sales and orders')
    .addTag('customers', 'Customer management')
    .addTag('store', 'Store configuration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Use 4001 by default to avoid conflicting with JSON Server on 4000
  const port = process.env.PORT || 4001;
  await app.listen(port);
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
