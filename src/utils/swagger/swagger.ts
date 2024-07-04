import * as fs from 'fs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// eslint-disable-next-line import/no-extraneous-dependencies
import 'tsconfig-paths/register';
import { AppModule } from 'src/modules/app/app.module';
import { NestFactory } from '@nestjs/core';

/**
 * Generate Swagger JSON Schema offline, it used to deploy the document to other server but not the
 * current service (e.g. GitHub Pages)
 */
(async () => {
  const {
    BASE_PATH,
    npm_package_name,
    npm_package_description,
    npm_package_version,
  } = process.env;

  const app = await NestFactory.create(AppModule, { logger: false });

  app.enableVersioning();
  app.setGlobalPrefix(BASE_PATH);

  const swaggerDoc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle(npm_package_name)
      .setDescription(npm_package_description)
      .setVersion(npm_package_version)
      .addServer('http://localhost:3000', 'Localhost')
      .build(),
  );

  /**
   * Here we used a hacky way to wrap data object into all schema that end with 'Res'
   * Since it is the most efficient way to make all dto fit the Google JSON style response
   */
  const { schemas } = swaggerDoc.components;
  const schemaList = Object.entries(schemas);
  for (let i = 0; i < schemaList.length; i += 1) {
    const [key, value] = schemaList[i];
    if (key.match(/(.*)Res/)) {
      schemas[key] = {
        properties: { data: value },
        required: ['data'],
        type: 'object',
      };
    }
  }

  fs.writeFileSync(
    `${__filename.slice(__dirname.length + 1, -3)}.json`,
    JSON.stringify(swaggerDoc),
  );

  await app.close();
  process.exit(0);
})();
