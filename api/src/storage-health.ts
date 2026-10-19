import { TableServiceClient } from '@azure/data-tables';

interface TableServiceLike {
  getProperties(): Promise<unknown>;
}

type ServiceFactory = (connectionString: string) => TableServiceLike;

const defaultFactory: ServiceFactory = (connectionString) =>
  TableServiceClient.fromConnectionString(connectionString, { allowInsecureConnection: true });

export function createStorageCheck(
  connectionString: string | undefined,
  factory: ServiceFactory = defaultFactory
): () => Promise<void> {
  return async () => {
    if (!connectionString) {
      throw new Error('Storage connection string is not configured');
    }
    await factory(connectionString).getProperties();
  };
}
