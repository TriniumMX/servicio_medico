// src/lib/dbConection.ts
import sql, { ConnectionPool, config as MSSQLConfig } from 'mssql';

const dbConfig: MSSQLConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER as string,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    requestTimeout: 60000,
  },
  pool: {
    max: 100,
    min: 0,
    idleTimeoutMillis: 300000,
  },
};

declare global {
  var mssqlPool: ConnectionPool | null;
}

// Esta es la implementación definitiva que distingue entre entornos
export const getDatabasePool = async (): Promise<ConnectionPool> => {
  // --- LÓGICA PARA ENTORNO DE PRODUCCIÓN ---
  // En producción, queremos reutilizar la conexión por eficiencia.
  if (process.env.NODE_ENV === 'production') {
    if (global.mssqlPool && global.mssqlPool.connected) {
      return global.mssqlPool;
    }
  }

  // --- LÓGICA PARA ENTORNO DE DESARROLLO ---
  // En desarrollo, SIEMPRE creamos una nueva conexión para evitar los problemas
  // de la recarga en caliente que corrompen el pool.
  try {
    const pool = new ConnectionPool(dbConfig);
    const connection = await pool.connect();

    // Solo en producción guardamos la conexión en el caché global.
    if (process.env.NODE_ENV === 'production') {
      global.mssqlPool = connection;
    }

    return connection;
  } catch (error) {
    console.error('Error creando el pool de conexión:', error);
    throw new Error('No se pudo establecer la conexión con la base de datos');
  }
};